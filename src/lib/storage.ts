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
// Security constants
// ---------------------------------------------------------------------------

/**
 * Blocked file extensions — regardless of MIME type, these are never accepted.
 * This covers executables, scripts, server-side code and dangerous archive payloads.
 */
const BLOCKED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "vbs", "vbe", "js", "jse", "wsf", "wsh",
  "ps1", "ps2", "psc1", "psc2", "sh", "bash", "zsh", "fish", "csh",
  "php", "php3", "php4", "php5", "php7", "phtml", "phar",
  "asp", "aspx", "cshtml", "vbhtml",
  "py", "rb", "pl", "lua", "go",
  "jar", "war", "ear",
  "scr", "pif", "application", "gadget", "hta",
  "reg", "inf",
  "lnk", "url",
]);

/**
 * Maximum allowed presigned upload URL lifetime (15 minutes).
 * Callers cannot request longer-lived upload tokens.
 */
export const MAX_UPLOAD_EXPIRY_SECONDS = 900;

/**
 * Maximum allowed presigned download URL lifetime (1 hour).
 */
export const MAX_DOWNLOAD_EXPIRY_SECONDS = 3600;

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
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_STORAGE_MOCK === "1";
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
 * @param key              - Object key in the bucket, e.g. "projects/abc123/contract.pdf"
 * @param contentType      - MIME type of the file, e.g. "application/pdf"
 * @param expiresInSeconds - How long the URL is valid (max MAX_UPLOAD_EXPIRY_SECONDS = 15 min)
 */
export function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = MAX_UPLOAD_EXPIRY_SECONDS,
): PresignedUploadResult {
  // Enforce maximum expiry ceiling — callers cannot bypass this.
  const clampedExpiry = Math.min(Math.max(1, expiresInSeconds), MAX_UPLOAD_EXPIRY_SECONDS);

  const cfg = getStorageConfig();
  const now = new Date();
  const expiresAt = now.getTime() + clampedExpiry * 1000;

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
    "X-Amz-Expires": String(clampedExpiry),
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
 *
 * @param key              - Object key in the bucket
 * @param expiresInSeconds - How long the URL is valid (max MAX_DOWNLOAD_EXPIRY_SECONDS = 1 hour)
 */
export function generatePresignedDownloadUrl(
  key: string,
  expiresInSeconds = MAX_DOWNLOAD_EXPIRY_SECONDS,
): PresignedDownloadResult {
  // Enforce maximum expiry ceiling.
  const clampedExpiry = Math.min(Math.max(1, expiresInSeconds), MAX_DOWNLOAD_EXPIRY_SECONDS);

  const cfg = getStorageConfig();
  const now = new Date();
  const expiresAt = now.getTime() + clampedExpiry * 1000;

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
    "X-Amz-Expires": String(clampedExpiry),
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
 * Extract and validate the file extension from a filename.
 * Returns the lowercase extension (without leading dot), or null if the
 * extension is blocked or the filename has no meaningful extension.
 */
export function extractSafeExtension(filename: string): string | null {
  const cleanName = filename.trim();
  // Dotfiles (.htaccess, .env, etc.) or extensionless files
  if (cleanName.startsWith(".") || !cleanName.includes(".")) return null;
  const parts = cleanName.split(".");
  if (parts.length < 2) return null; // no extension
  const ext = parts[parts.length - 1]!.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ext || ext.length > 10) return null; // empty or suspiciously long
  if (BLOCKED_EXTENSIONS.has(ext)) return null; // known-dangerous extension
  return ext;
}

/**
 * Build a safe, namespaced object key.
 *
 * - Rejects filenames with no safe extension.
 * - Rejects blocked extensions (executables, scripts, etc.).
 * - Strips path-traversal sequences from all components.
 * - Produces deterministic, collision-resistant keys.
 *
 * @param namespace - e.g. "projects/proj-abc123"
 * @param subfolder - e.g. "documents" | "blueprints"
 * @param filename - Original filename from the client
 * @returns Safe object key, or throws if the filename is rejected.
 */
export function buildObjectKey(
  namespace: string,
  subfolder: string,
  filename: string,
): string {
  if (namespace.includes("..") || subfolder.includes("..") || filename.includes("..")) {
    throw new Error("Path traversal sequences are not permitted.");
  }
  if (filename.includes("/") || filename.includes("\\")) {
    throw new Error("Filename must not contain path separators.");
  }

  // Sanitize namespace and subfolder — strip invalid characters
  const safeNamespace = namespace
    .replace(/[^a-z0-9\-_/]/gi, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");

  const safeSubfolder = subfolder
    .replace(/[^a-z0-9\-_]/gi, "-");

  const ext = extractSafeExtension(filename);
  if (!ext) {
    throw new Error(`File extension is missing or not permitted for upload.`);
  }

  const baseName = filename.substring(0, filename.lastIndexOf("."));
  const safeName = baseName
    .replace(/[^a-z0-9.\-_]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80); // Limit base name length

  const timestamp = Date.now();
  const key = `${safeNamespace}/${safeSubfolder}/${safeName}-${timestamp}.${ext}`;
  // Collapse any double-slashes that may arise from empty components
  return key.replace(/\/\/+/g, "/");
}

/**
 * Validates that an object key is safely scoped to a specific project.
 * Returns true only if the key begins with "projects/<projectId>/" with no
 * path-traversal sequences and a safe file extension.
 */
export function isValidStorageKey(key: string, projectId: string): boolean {
  if (!key || !projectId) return false;
  // Reject path traversal anywhere in the key
  if (key.includes("..") || key.includes("//")) return false;
  // Must be scoped to this exact project
  const expectedPrefix = `projects/${projectId}/`;
  if (!key.startsWith(expectedPrefix)) return false;
  // Must have a safe extension
  const filename = key.split("/").pop() ?? "";
  const ext = extractSafeExtension(filename);
  return ext !== null;
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
  // Block dangerous file extensions regardless of declared MIME type
  if (fileName) {
    const ext = extractSafeExtension(fileName);
    if (ext === null) {
      const rawExt = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "(none)";
      return {
        valid: false,
        error: `File extension .${rawExt} is not permitted. Only safe document and blueprint formats are accepted.`,
      };
    }
  }

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
