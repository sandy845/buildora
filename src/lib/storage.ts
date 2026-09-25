/**
 * Buildora file storage — S3-compatible presigned URL service.
 *
 * Works with:
 *  - Cloudflare R2 (recommended for India-latency + cost)
 *  - AWS S3
 *  - Supabase Storage
 *  - MinIO (self-hosted)
 *  - Any S3-compatible provider
 *
 * Required environment variables:
 *   STORAGE_ENDPOINT     — e.g. https://<account>.r2.cloudflarestorage.com  (omit for AWS S3)
 *   STORAGE_REGION       — e.g. auto | ap-south-1
 *   STORAGE_BUCKET       — bucket name
 *   STORAGE_ACCESS_KEY   — access key ID
 *   STORAGE_SECRET_KEY   — secret access key
 *
 * If any of these are missing, the helpers return { error: "Storage not configured" }
 * and never throw — safe for local development.
 *
 * How it works:
 *   1. Client calls /api/storage/presign with { key, contentType } — a Next.js API route.
 *   2. The server generates a presigned PUT URL valid for 15 minutes.
 *   3. The client uploads the file directly to storage (browser → storage, bypasses our server).
 *   4. The client notifies us of the final URL via a Server Action.
 *
 * This pattern keeps our server free from binary I/O.
 */

import { createHmac, createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PresignedUploadResult =
  | { url: string; key: string; expiresAt: number; isMock?: boolean }
  | { error: string };

export type StorageDeleteResult = { deleted: boolean; error?: string };

export type PresignedDownloadResult =
  | { url: string; expiresAt: number; isMock?: boolean }
  | { error: string };

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.STORAGE_REGION &&
    process.env.STORAGE_BUCKET &&
    process.env.STORAGE_ACCESS_KEY &&
    process.env.STORAGE_SECRET_KEY
  );
}

export function isMockStorageAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function getStorageProviderName(): "cloudflare-r2" | "aws-s3" | "custom-s3" | "dev-mock" {
  if (!isStorageConfigured()) return "dev-mock";
  const endpoint = process.env.STORAGE_ENDPOINT ?? "";
  if (endpoint.includes("r2.cloudflarestorage.com")) return "cloudflare-r2";
  if (!endpoint) return "aws-s3";
  return "custom-s3";
}

function getStorageConfig() {
  const region = process.env.STORAGE_REGION;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  const endpoint = process.env.STORAGE_ENDPOINT; // Optional — defaults to AWS S3

  if (!region || !bucket || !accessKey || !secretKey) return null;

  // Build the base host — custom endpoint (R2, MinIO) or AWS S3.
  const host = endpoint
    ? new URL(endpoint).hostname
    : `${bucket}.s3.${region}.amazonaws.com`;

  const baseUrl = endpoint
    ? `${endpoint.replace(/\/$/, "")}/${bucket}`
    : `https://${bucket}.s3.${region}.amazonaws.com`;

  return { region, bucket, accessKey, secretKey, host, baseUrl, endpoint };
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 AWS Signature v4 helpers
// ---------------------------------------------------------------------------

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate())
  );
}

function formatDateTime(d: Date): string {
  return (
    formatDate(d) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

function deriveSigningKey(secretKey: string, date: string, region: string, service = "s3"): Buffer {
  const kDate = hmac("AWS4" + secretKey, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

// ---------------------------------------------------------------------------
// Presigned PUT URL (upload)
// ---------------------------------------------------------------------------

/**
 * Generate a presigned PUT URL. The client can use this to upload a file
 * directly to S3/R2 without going through our server.
 *
 * @param key          - Object key in the bucket, e.g. "projects/abc123/contract.pdf"
 * @param contentType  - MIME type of the file, e.g. "application/pdf"
 * @param expiresInSeconds - How long the URL is valid (default 15 minutes)
 */
export function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900,
): PresignedUploadResult {
  const cfg = getStorageConfig();
  const now = new Date();
  const expiresAt = now.getTime() + expiresInSeconds * 1000;

  // Development / test fallback when S3 / R2 is not configured
  if (!cfg && isMockStorageAllowed()) {
    const mockBase = process.env.NEXT_PUBLIC_APP_URL || "";
    return {
      url: `${mockBase}/api/storage/mock-upload?key=${encodeURIComponent(key)}`,
      key,
      expiresAt,
      isMock: true,
    };
  } else if (!cfg) {
    return { error: "Storage is not configured." };
  }

  const dateStr = formatDate(now);
  const dateTimeStr = formatDateTime(now);

  const credential = `${cfg.accessKey}/${dateStr}/${cfg.region}/s3/aws4_request`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": dateTimeStr,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "content-type;host",
  });

  // Sorted canonical query string
  const sortedQuery = [...queryParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    `/${encodeURIComponent(key).replace(/%2F/g, "/")}`, // canonical URI
    sortedQuery,
    `content-type:${contentType}\nhost:${cfg.host}\n`, // canonical headers (must end with \n)
    "content-type;host", // signed headers
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateTimeStr,
    `${dateStr}/${cfg.region}/s3/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = deriveSigningKey(cfg.secretKey, dateStr, cfg.region);
  const signature = hmac(signingKey, stringToSign).toString("hex");

  const url = `${cfg.baseUrl}/${encodeURIComponent(key).replace(/%2F/g, "/")}?${sortedQuery}&X-Amz-Signature=${signature}`;

  return { url, key, expiresAt };
}

/**
 * Generate a presigned GET URL for private file downloads.
 */
export function generatePresignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
): PresignedDownloadResult {
  const cfg = getStorageConfig();
  const now = new Date();
  const expiresAt = now.getTime() + expiresInSeconds * 1000;

  if (!cfg && isMockStorageAllowed()) {
    const mockBase = process.env.NEXT_PUBLIC_APP_URL || "";
    return {
      url: `${mockBase}/api/storage/mock-upload?key=${encodeURIComponent(key)}`,
      expiresAt,
      isMock: true,
    };
  } else if (!cfg) {
    return { error: "Storage is not configured." };
  }

  const dateStr = formatDate(now);
  const dateTimeStr = formatDateTime(now);

  const credential = `${cfg.accessKey}/${dateStr}/${cfg.region}/s3/aws4_request`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": dateTimeStr,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  });

  const sortedQuery = [...queryParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalRequest = [
    "GET",
    `/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
    sortedQuery,
    `host:${cfg.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateTimeStr,
    `${dateStr}/${cfg.region}/s3/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = deriveSigningKey(cfg.secretKey, dateStr, cfg.region);
  const signature = hmac(signingKey, stringToSign).toString("hex");

  const url = `${cfg.baseUrl}/${encodeURIComponent(key).replace(/%2F/g, "/")}?${sortedQuery}&X-Amz-Signature=${signature}`;

  return { url, expiresAt };
}

// ---------------------------------------------------------------------------
// Object key helpers
// ---------------------------------------------------------------------------

/**
 * Build a safe, namespaced object key.
 * Example: buildObjectKey("projects", "abc123", "contract.pdf")
 *   → "projects/abc123/contract-1234567890.pdf"
 */
export function buildObjectKey(
  namespace: string,
  entityId: string,
  filename: string,
): string {
  const ext = filename.includes(".") ? filename.split(".").pop()! : "bin";
  const baseName = filename.includes(".") ? filename.substring(0, filename.lastIndexOf(".")) : filename;
  const safeName = baseName
    .replace(/[^a-z0-9.\-_]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const timestamp = Date.now();
  return `${namespace}/${entityId}/${safeName}-${timestamp}.${ext}`.replace(/\/\/+/g, "/");
}

// ---------------------------------------------------------------------------
// Allowed MIME types / size limits
// ---------------------------------------------------------------------------

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

const ALLOWED_BLUEPRINT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/vnd.dwg",
  "image/x-dwg",
  "application/acad",
  "application/x-acad",
  "application/autocad_dwg",
  "application/dwg",
  "application/x-dwg",
  "image/vnd.dxf",
  "image/x-dxf",
  "application/dxf",
  "application/x-dxf",
  "application/octet-stream", // Frequently returned by OS for DWG/DXF files
]);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;  // 25 MB
export const MAX_BLUEPRINT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB (High-res CAD & Architectural Drawings)
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;     // 15 MB

export function validateUpload(
  contentType: string,
  fileSizeBytes: number,
  allowType: "document" | "blueprint" | "image",
  fileName?: string,
): { valid: true } | { valid: false; error: string } {
  let allowedSet: Set<string>;
  let maxSize: number;

  if (allowType === "blueprint") {
    allowedSet = ALLOWED_BLUEPRINT_TYPES;
    maxSize = MAX_BLUEPRINT_SIZE_BYTES;

    // If octet-stream, verify file extension is a valid CAD/drawing format
    if (contentType === "application/octet-stream" && fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase();
      const validCadExts = ["dwg", "dxf", "pdf", "cad", "rvt", "ifc", "png", "jpg", "jpeg"];
      if (!ext || !validCadExts.includes(ext)) {
        return { valid: false, error: `File extension .${ext} is not supported for blueprints.` };
      }
    }
  } else if (allowType === "document") {
    allowedSet = ALLOWED_DOCUMENT_TYPES;
    maxSize = MAX_DOCUMENT_SIZE_BYTES;
  } else {
    allowedSet = ALLOWED_IMAGE_TYPES;
    maxSize = MAX_IMAGE_SIZE_BYTES;
  }

  if (!allowedSet.has(contentType)) {
    return { valid: false, error: `File type "${contentType}" is not allowed for ${allowType} uploads.` };
  }
  if (fileSizeBytes > maxSize) {
    const maxMb = maxSize / 1024 / 1024;
    return { valid: false, error: `File exceeds the ${maxMb} MB size limit.` };
  }
  return { valid: true };
}
