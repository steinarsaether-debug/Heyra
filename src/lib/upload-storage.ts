import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const maxFileSizeBytes = 8 * 1024 * 1024;

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/heic") {
    return "heic";
  }

  if (mimeType === "image/heif") {
    return "heif";
  }

  return null;
}

export function validateImageUpload(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    return "Use a JPG, PNG, WebP, or HEIC image.";
  }

  if (file.size > maxFileSizeBytes) {
    return "Each photo must be 8 MB or smaller.";
  }

  return null;
}

export async function saveListingPhotoUpload({
  file,
  propertyId,
}: {
  file: File;
  propertyId: string;
}) {
  const extension = extensionForMimeType(file.type);

  if (!extension) {
    throw new Error("Unsupported image type.");
  }

  const safePropertyId = sanitizeSegment(propertyId);
  const uploadRoot = path.join(process.cwd(), "public", "uploads", "listings", safePropertyId);
  await fs.mkdir(uploadRoot, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filepath = path.join(uploadRoot, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filepath, bytes);

  return {
    url: `/uploads/listings/${safePropertyId}/${filename}`,
    bytes: file.size,
    mimeType: file.type,
  };
}
