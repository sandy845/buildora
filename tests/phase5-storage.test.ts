import assert from "node:assert/strict";
import test from "node:test";
import {
  buildObjectKey,
  extractSafeExtension,
  isValidStorageKey,
  validateUpload,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  MAX_UPLOAD_EXPIRY_SECONDS,
  MAX_DOWNLOAD_EXPIRY_SECONDS,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_BLUEPRINT_SIZE_BYTES,
} from "../src/lib/storage.ts";

// ---------------------------------------------------------------------------
// Extension extraction
// ---------------------------------------------------------------------------

test("Storage: extractSafeExtension returns extension for valid filenames", () => {
  assert.equal(extractSafeExtension("contract.pdf"), "pdf");
  assert.equal(extractSafeExtension("Architectural Plan (Rev 3).dwg"), "dwg");
  assert.equal(extractSafeExtension("report.xlsx"), "xlsx");
  assert.equal(extractSafeExtension("DRAWING.DXF"), "dxf");
});

test("Storage: extractSafeExtension blocks known-dangerous extensions", () => {
  const blocked = [
    "exploit.exe", "trojan.bat", "backdoor.sh", "webshell.php",
    "hack.py", "payload.vbs", "loader.cmd", "attack.ps1",
    "dropper.jar", "worm.phar", "stager.hta",
  ];
  for (const file of blocked) {
    assert.equal(
      extractSafeExtension(file),
      null,
      `Expected null for blocked file: ${file}`
    );
  }
});

test("Storage: extractSafeExtension returns null for files with no extension", () => {
  assert.equal(extractSafeExtension("Makefile"), null);
  assert.equal(extractSafeExtension("README"), null);
  assert.equal(extractSafeExtension(".htaccess"), null);
});

// ---------------------------------------------------------------------------
// buildObjectKey
// ---------------------------------------------------------------------------

test("Storage: buildObjectKey produces a correctly scoped and sanitized key", () => {
  const key = buildObjectKey("projects/proj-abc123", "documents", "contract.pdf");
  assert.ok(key.startsWith("projects/proj-abc123/documents/"), `Key should start with expected prefix, got: ${key}`);
  assert.ok(key.endsWith(".pdf"));
  assert.ok(!key.includes(" "));
  assert.ok(!key.includes("("));
  assert.ok(!key.includes(")"));
});

test("Storage: buildObjectKey rejects path traversal sequences", () => {
  assert.throws(() => {
    buildObjectKey("projects/../../../etc", "documents", "file.pdf");
  }, /path traversal/i);

  assert.throws(() => {
    buildObjectKey("projects/proj-123", "../documents", "file.pdf");
  }, /path traversal/i);

  assert.throws(() => {
    buildObjectKey("projects/proj-123", "documents", "../file.pdf");
  }, /path traversal/i);
});

test("Storage: buildObjectKey rejects filenames with blocked extensions", () => {
  assert.throws(() => {
    buildObjectKey("projects/proj-123", "documents", "exploit.exe");
  }, /not permitted/i);

  assert.throws(() => {
    buildObjectKey("projects/proj-123", "documents", "shell.sh");
  }, /not permitted/i);

  assert.throws(() => {
    buildObjectKey("projects/proj-123", "blueprints", "backdoor.php");
  }, /not permitted/i);
});

test("Storage: buildObjectKey rejects filenames with no extension", () => {
  assert.throws(() => {
    buildObjectKey("projects/proj-123", "documents", "Makefile");
  }, /not permitted/i);
});

// ---------------------------------------------------------------------------
// isValidStorageKey
// ---------------------------------------------------------------------------

test("Storage: isValidStorageKey accepts correctly scoped keys", () => {
  const projectId = "proj-abc123";
  const key = buildObjectKey(`projects/${projectId}`, "documents", "contract.pdf");
  assert.equal(isValidStorageKey(key, projectId), true);
});

test("Storage: isValidStorageKey rejects keys for wrong project", () => {
  const key = "projects/proj-abc123/documents/contract-123.pdf";
  assert.equal(isValidStorageKey(key, "proj-OTHER"), false);
});

test("Storage: isValidStorageKey rejects keys with path traversal sequences", () => {
  assert.equal(isValidStorageKey("projects/proj-abc/../../../etc/passwd", "proj-abc"), false);
  assert.equal(isValidStorageKey("projects/proj-abc//documents/file.pdf", "proj-abc"), false);
});

test("Storage: isValidStorageKey rejects keys with blocked extensions", () => {
  assert.equal(isValidStorageKey("projects/proj-abc/documents/exploit.exe", "proj-abc"), false);
  assert.equal(isValidStorageKey("projects/proj-abc/documents/shell.sh", "proj-abc"), false);
});

test("Storage: isValidStorageKey rejects empty inputs", () => {
  assert.equal(isValidStorageKey("", "proj-abc"), false);
  assert.equal(isValidStorageKey("projects/proj-abc/doc.pdf", ""), false);
});

// ---------------------------------------------------------------------------
// validateUpload
// ---------------------------------------------------------------------------

test("Storage: validateUpload accepts valid document uploads", () => {
  assert.deepEqual(validateUpload("application/pdf", 5 * 1024 * 1024, "document", "report.pdf"), { valid: true });
  assert.deepEqual(
    validateUpload(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      2 * 1024 * 1024,
      "document",
      "spec.docx"
    ),
    { valid: true }
  );
});

test("Storage: validateUpload rejects document exceeding 25 MB size limit", () => {
  const result = validateUpload("application/pdf", MAX_DOCUMENT_SIZE_BYTES + 1, "document", "big.pdf");
  assert.equal(result.valid, false);
  assert.ok("error" in result && result.error.includes("25 MB"));
});

test("Storage: validateUpload accepts valid blueprint uploads", () => {
  assert.deepEqual(validateUpload("application/pdf", 10 * 1024 * 1024, "blueprint", "plan.pdf"), { valid: true });
  assert.deepEqual(
    validateUpload("application/octet-stream", 45 * 1024 * 1024, "blueprint", "floor-plan.dwg"),
    { valid: true }
  );
});

test("Storage: validateUpload rejects blueprint exceeding 50 MB size limit", () => {
  const result = validateUpload("application/pdf", MAX_BLUEPRINT_SIZE_BYTES + 1, "blueprint", "huge.pdf");
  assert.equal(result.valid, false);
  assert.ok("error" in result && result.error.includes("50 MB"));
});

test("Storage: validateUpload rejects dangerous file extensions regardless of MIME type", () => {
  // Attacker claims MIME is PDF but extension is .exe
  const result = validateUpload("application/pdf", 1024, "document", "disguised.exe");
  assert.equal(result.valid, false);
  assert.ok("error" in result && result.error.includes("exe"));

  // Shell script with octet-stream
  const shResult = validateUpload("application/octet-stream", 1024, "blueprint", "cron.sh");
  assert.equal(shResult.valid, false);
});

test("Storage: validateUpload rejects disallowed MIME type", () => {
  const result = validateUpload("application/x-msdownload", 1024, "document", "app.dll");
  assert.equal(result.valid, false);
  assert.ok("error" in result && result.error.includes("not allowed"));
});

// ---------------------------------------------------------------------------
// URL expiry clamping
// ---------------------------------------------------------------------------

test("Storage: generatePresignedUploadUrl enforces maximum 15-minute expiry", () => {
  // Pass an excessively long expiry (24 hours) — should be clamped to MAX_UPLOAD_EXPIRY_SECONDS
  const before = Date.now();
  const result = generatePresignedUploadUrl("projects/p1/documents/test.pdf", "application/pdf", 86400);
  if ("url" in result || "isMock" in result) {
    if ("expiresAt" in result) {
      const diff = (result.expiresAt - before) / 1000;
      assert.ok(
        diff <= MAX_UPLOAD_EXPIRY_SECONDS + 5,
        `Upload expiry should be capped at ${MAX_UPLOAD_EXPIRY_SECONDS}s, got ~${Math.round(diff)}s`
      );
    }
  }
});

test("Storage: generatePresignedDownloadUrl enforces maximum 1-hour expiry", () => {
  const before = Date.now();
  const result = generatePresignedDownloadUrl("projects/p1/documents/test.pdf", 86400);
  if ("url" in result || "isMock" in result) {
    if ("expiresAt" in result) {
      const diff = (result.expiresAt - before) / 1000;
      assert.ok(
        diff <= MAX_DOWNLOAD_EXPIRY_SECONDS + 5,
        `Download expiry should be capped at ${MAX_DOWNLOAD_EXPIRY_SECONDS}s, got ~${Math.round(diff)}s`
      );
    }
  }
});

