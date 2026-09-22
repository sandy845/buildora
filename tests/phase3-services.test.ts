import assert from "node:assert/strict";
import test from "node:test";
import {
  RateLimiter,
  getRateLimitHeaders,
} from "../src/lib/rate-limit.ts";
import {
  validateUpload,
  buildObjectKey,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  getStorageProviderName,
} from "../src/lib/storage.ts";
import { getEmailProviderStatus } from "../src/lib/email.ts";

test("RateLimiter: sliding window enforces limits and calculates remaining attempts", () => {
  const limiter = new RateLimiter({ limit: 3, windowMs: 60_000 });
  const key = `test-ip-${Date.now()}`;

  const res1 = limiter.check(key);
  assert.equal(res1.success, true);
  assert.equal(res1.remaining, 2);

  const res2 = limiter.check(key);
  assert.equal(res2.success, true);
  assert.equal(res2.remaining, 1);

  const res3 = limiter.check(key);
  assert.equal(res3.success, true);
  assert.equal(res3.remaining, 0);

  // 4th attempt should be rejected
  const res4 = limiter.check(key);
  assert.equal(res4.success, false);
  assert.equal(res4.remaining, 0);
  assert.ok((res4.retryAfterMs ?? 0) > 0);

  // Headers check
  const headers = getRateLimitHeaders(res4, 3);
  assert.equal(headers["X-RateLimit-Limit"], "3");
  assert.equal(headers["X-RateLimit-Remaining"], "0");
  assert.ok(headers["Retry-After"]);
});

test("Storage: validateUpload correctly verifies documents and blueprints", () => {
  // Valid PDF document
  const validDoc = validateUpload("application/pdf", 10 * 1024 * 1024, "document");
  assert.equal(validDoc.valid, true);

  // Exceeds 25MB document limit
  const oversizedDoc = validateUpload("application/pdf", 26 * 1024 * 1024, "document");
  assert.equal(oversizedDoc.valid, false);

  // Invalid document MIME type
  const badMime = validateUpload("application/x-msdownload", 1024, "document");
  assert.equal(badMime.valid, false);

  // Valid CAD blueprint (DWG octet-stream with valid extension)
  const validBlueprint = validateUpload("application/octet-stream", 45 * 1024 * 1024, "blueprint", "ground-floor-plan.dwg");
  assert.equal(validBlueprint.valid, true);

  // Exceeds 50MB blueprint limit
  const oversizedBlueprint = validateUpload("application/pdf", 55 * 1024 * 1024, "blueprint", "full-res-drawing.pdf");
  assert.equal(oversizedBlueprint.valid, false);

  // Invalid blueprint extension
  const badCadExt = validateUpload("application/octet-stream", 1024, "blueprint", "virus.exe");
  assert.equal(badCadExt.valid, false);
});

test("Storage: buildObjectKey normalizes filenames and prevents path traversal", () => {
  const key = buildObjectKey("projects/proj-1", "blueprints", "Living Room Plan (Rev 2).dwg");
  assert.ok(key.startsWith("projects/proj-1/blueprints/"));
  assert.ok(key.endsWith(".dwg"));
  assert.ok(!key.includes(" "));
  assert.ok(!key.includes("("));
  assert.ok(!key.includes(")"));
});

test("Storage: presigned URL generation produces valid endpoint and expiry", () => {
  const upload = generatePresignedUploadUrl("projects/p1/doc.pdf", "application/pdf", 900);
  assert.ok("url" in upload);
  assert.ok("key" in upload);
  assert.ok((upload.expiresAt ?? 0) > Date.now());

  const download = generatePresignedDownloadUrl("projects/p1/doc.pdf", 3600);
  assert.ok("url" in download);
  assert.ok((download.expiresAt ?? 0) > Date.now());
});

test("Email: getEmailProviderStatus accurately reports configured provider", () => {
  const status = getEmailProviderStatus();
  assert.ok(["resend", "postmark", "smtp", "simulated"].includes(status.provider));
  assert.equal(typeof status.configured, "boolean");
});
