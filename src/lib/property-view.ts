import { PropertyStatus, TerrainType, type Property } from "@prisma/client";

type PropertyWithMinimalShape = Pick<
  Property,
  | "id"
  | "cadastralRef"
  | "municipality"
  | "county"
  | "areaHectares"
  | "terrainTypes"
  | "status"
  | "createdAt"
>;

type PropertyCompletionShape = PropertyWithMinimalShape & {
  boundary?: unknown | null;
  centerPoint?: unknown | null;
};

export function formatPropertyStatus(status: PropertyStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTerrainTypes(terrainTypes: TerrainType[]) {
  if (terrainTypes.length === 0) {
    return "Not set";
  }

  return terrainTypes
    .map((type) => type.toLowerCase())
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(", ");
}

export function getPropertyCompletionState(property: PropertyCompletionShape) {
  const hasIdentity =
    Boolean(property.cadastralRef.trim()) &&
    Boolean(property.municipality.trim()) &&
    Boolean(property.county.trim()) &&
    property.areaHectares > 0;
  const hasTerrain = property.terrainTypes.length > 0;
  const hasBoundary = Boolean(property.boundary && property.centerPoint);

  const steps = [
    {
      key: "identity",
      label: "Basic property details",
      complete: hasIdentity,
    },
    {
      key: "terrain",
      label: "Terrain and facilities",
      complete: hasTerrain,
    },
    {
      key: "boundary",
      label: "Boundary and map area",
      complete: hasBoundary,
    },
  ];

  const completed = steps.filter((step) => step.complete).length;

  return {
    steps,
    completed,
    total: steps.length,
    percent: Math.round((completed / steps.length) * 100),
    hasBoundary,
  };
}
