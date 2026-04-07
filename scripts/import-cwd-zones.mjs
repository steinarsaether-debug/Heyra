import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

let prisma;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envPath = path.join(__dirname, "..", ".env");
  const envFile = await fs.readFile(envPath, "utf8");
  const databaseUrlLine = envFile
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("DATABASE_URL="));

  if (!databaseUrlLine) {
    throw new Error("DATABASE_URL was not found in .env");
  }

  process.env.DATABASE_URL = databaseUrlLine
    .slice("DATABASE_URL=".length)
    .trim()
    .replace(/^"/, "")
    .replace(/"$/, "");
}

function escapeWktText(value) {
  return value.replace(/'/g, "''");
}

function assertFeatureCollection(json) {
  if (!json || json.type !== "FeatureCollection" || !Array.isArray(json.features)) {
    throw new Error("Expected a GeoJSON FeatureCollection.");
  }
}

function ringToWkt(ring) {
  return ring.map((position) => `${position[0]} ${position[1]}`).join(", ");
}

function geometryToMultiPolygonWkt(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    throw new Error("Feature is missing geometry.");
  }

  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates.map((ring) => `(${ringToWkt(ring)})`).join(", ");
    return `MULTIPOLYGON(( ${rings} ))`;
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates
      .map((polygon) => `( ${polygon.map((ring) => `(${ringToWkt(ring)})`).join(", ")} )`)
      .join(", ");
    return `MULTIPOLYGON(${polygons})`;
  }

  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

function getExternalId(feature, index) {
  const candidate =
    feature.id ??
    feature.properties?.id ??
    feature.properties?.ID ??
    feature.properties?.objectid ??
    feature.properties?.OBJECTID ??
    feature.properties?.zone_id ??
    feature.properties?.zoneId ??
    `cwd-zone-${index + 1}`;

  return String(candidate);
}

function getZoneName(feature, externalId) {
  return (
    feature.properties?.name ??
    feature.properties?.Name ??
    feature.properties?.navn ??
    feature.properties?.NAVN ??
    feature.properties?.title ??
    `CWD zone ${externalId}`
  );
}

function getZoneDescription(feature) {
  return (
    feature.properties?.description ??
    feature.properties?.Description ??
    feature.properties?.beskrivelse ??
    null
  );
}

function getZoneContactInfo(feature) {
  return {
    contactName:
      feature.properties?.contactName ??
      feature.properties?.contact_name ??
      feature.properties?.kontaktperson ??
      null,
    contactPhone:
      feature.properties?.contactPhone ??
      feature.properties?.contact_phone ??
      feature.properties?.telefon ??
      null,
    contactEmail:
      feature.properties?.contactEmail ??
      feature.properties?.contact_email ??
      feature.properties?.epost ??
      null,
    contactWebsite:
      feature.properties?.contactWebsite ??
      feature.properties?.contact_website ??
      feature.properties?.website ??
      null,
    samplingInstructions:
      feature.properties?.samplingInstructions ??
      feature.properties?.sampling_instructions ??
      feature.properties?.provetaking ??
      null,
  };
}

async function main() {
  await ensureDatabaseUrl();
  prisma = new PrismaClient();

  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const pathArg = args.find((arg) => !arg.startsWith("--"));
  const inputPath =
    pathArg ??
    process.env.CWD_ZONES_GEOJSON_PATH ??
    path.join(__dirname, "..", "data", "cwd-zones.example.geojson");

  const absolutePath = path.resolve(process.cwd(), inputPath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const json = JSON.parse(raw);
  assertFeatureCollection(json);

  if (replace) {
    await prisma.$executeRawUnsafe('DELETE FROM "CwdZone"');
  }

  let imported = 0;

  for (const [index, feature] of json.features.entries()) {
    const externalId = getExternalId(feature, index);
    const name = getZoneName(feature, externalId);
    const description = getZoneDescription(feature);
    const contactInfo = getZoneContactInfo(feature);
    const metadata = feature.properties ?? {};
    const wkt = geometryToMultiPolygonWkt(feature.geometry);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "CwdZone" ("id", "externalId", "name", "description", "source", "contactName", "contactPhone", "contactEmail", "contactWebsite", "samplingInstructions", "metadata", "geometry", "createdAt", "updatedAt")
      VALUES ('${crypto.randomUUID()}', '${escapeWktText(externalId)}', '${escapeWktText(name)}', ${
        description ? `'${escapeWktText(description)}'` : "NULL"
      }, 'Miljodirektoratet', ${
        contactInfo.contactName ? `'${escapeWktText(contactInfo.contactName)}'` : "NULL"
      }, ${
        contactInfo.contactPhone ? `'${escapeWktText(contactInfo.contactPhone)}'` : "NULL"
      }, ${
        contactInfo.contactEmail ? `'${escapeWktText(contactInfo.contactEmail)}'` : "NULL"
      }, ${
        contactInfo.contactWebsite ? `'${escapeWktText(contactInfo.contactWebsite)}'` : "NULL"
      }, ${
        contactInfo.samplingInstructions
          ? `'${escapeWktText(contactInfo.samplingInstructions)}'`
          : "NULL"
      }, '${escapeWktText(JSON.stringify(metadata))}'::jsonb, ST_SetSRID(ST_GeomFromText('${escapeWktText(wkt)}'), 4326), NOW(), NOW())
      ON CONFLICT ("externalId")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "source" = EXCLUDED."source",
        "contactName" = EXCLUDED."contactName",
        "contactPhone" = EXCLUDED."contactPhone",
        "contactEmail" = EXCLUDED."contactEmail",
        "contactWebsite" = EXCLUDED."contactWebsite",
        "samplingInstructions" = EXCLUDED."samplingInstructions",
        "metadata" = EXCLUDED."metadata",
        "geometry" = EXCLUDED."geometry",
        "updatedAt" = NOW()
    `);

    imported += 1;
  }

  await prisma.$executeRawUnsafe(`
    UPDATE "Property"
    SET "isInCwdZone" = false, "cwdZoneId" = NULL
  `);

  await prisma.$executeRawUnsafe(`
    WITH matches AS (
      SELECT
        p."id" AS property_id,
        (
          SELECT z."id"
          FROM "CwdZone" z
          WHERE p."boundary" IS NOT NULL
            AND ST_Intersects(p."boundary", z."geometry")
          ORDER BY ST_Area(ST_Intersection(p."boundary", z."geometry")) DESC
          LIMIT 1
        ) AS zone_id
      FROM "Property" p
    )
    UPDATE "Property" p
    SET
      "isInCwdZone" = matches.zone_id IS NOT NULL,
      "cwdZoneId" = matches.zone_id,
      "updatedAt" = NOW()
    FROM matches
    WHERE p."id" = matches.property_id
  `);

  const count = await prisma.cwdZone.count();
  const flaggedProperties = await prisma.property.count({
    where: {
      isInCwdZone: true,
    },
  });
  console.log(`Imported ${imported} CWD zones from ${absolutePath}.`);
  console.log(`CwdZone rows in database: ${count}.`);
  console.log(`Properties currently flagged inside a CWD zone: ${flaggedProperties}.`);
}

main()
  .catch((error) => {
    console.error("CWD import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
