import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import {
  apiError,
  apiForbidden,
  apiInternalError,
  apiMethodNotAllowed,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
  apiUnauthorized,
} from "../src/lib/api/response.ts";
import {
  parseAndValidateJson,
  validateSearchParams,
} from "../src/lib/api/validate.ts";
import {
  AdminCreateProjectSchema,
  ClientSendMessageSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  StoragePresignRequestSchema,
  VerifyOtpRequestSchema,
} from "../src/lib/api/schemas.ts";
import { z } from "zod";

test("API Response: apiSuccess returns 200 with structured envelope", async () => {
  const response = apiSuccess({ projectId: "proj-123" });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.projectId, "proj-123");
  assert.ok(data.meta?.timestamp);
});

test("API Response: apiError formats status and structured field errors", async () => {
  const response = apiError("Validation failed.", 400, {
    fieldErrors: { email: "Invalid email" },
    code: "VALIDATION_FAILED",
  });
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.error, "Validation failed.");
  assert.equal(data.code, "VALIDATION_FAILED");
  assert.equal(data.fieldErrors?.email, "Invalid email");
});

test("API Response: standard error helpers assign correct status codes", async () => {
  const unauth = apiUnauthorized();
  assert.equal(unauth.status, 401);
  const unauthData = await unauth.json();
  assert.equal(unauthData.code, "UNAUTHORIZED");

  const forbidden = apiForbidden();
  assert.equal(forbidden.status, 403);
  const forbiddenData = await forbidden.json();
  assert.equal(forbiddenData.code, "FORBIDDEN");

  const notFound = apiNotFound();
  assert.equal(notFound.status, 404);
  const notFoundData = await notFound.json();
  assert.equal(notFoundData.code, "NOT_FOUND");

  const notAllowed = apiMethodNotAllowed(["GET", "POST"]);
  assert.equal(notAllowed.status, 405);
  assert.equal(notAllowed.headers.get("Allow"), "GET, POST");

  const tooMany = apiTooManyRequests("Rate limit reached.");
  assert.equal(tooMany.status, 429);

  const internalErr = apiInternalError(new Error("DB timeout"));
  assert.equal(internalErr.status, 500);
  const internalData = await internalErr.json();
  assert.equal(internalData.code, "INTERNAL_SERVER_ERROR");
  // Does not leak raw exception message to client
  assert.equal(internalData.error, "An unexpected error occurred while processing your request.");
});

test("Schema Validation: LoginRequestSchema enforces email and password", () => {
  const valid = LoginRequestSchema.safeParse({ email: "user@buildora.in", password: "Password123!" });
  assert.equal(valid.success, true);

  const invalidEmail = LoginRequestSchema.safeParse({ email: "notanemail", password: "pass" });
  assert.equal(invalidEmail.success, false);

  const emptyPass = LoginRequestSchema.safeParse({ email: "user@buildora.in", password: "" });
  assert.equal(emptyPass.success, false);
});

test("Schema Validation: RegisterRequestSchema enforces matching passwords and limits", () => {
  const valid = RegisterRequestSchema.safeParse({
    name: "John Doe",
    email: "john@buildora.in",
    phone: "+91 98765 43210",
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  assert.equal(valid.success, true);

  const mismatch = RegisterRequestSchema.safeParse({
    name: "John Doe",
    email: "john@buildora.in",
    phone: "+91 98765 43210",
    password: "Password123!",
    confirmPassword: "DifferentPassword123!",
  });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) {
    const errorPaths = mismatch.error.issues.map((i) => i.path.join("."));
    assert.ok(errorPaths.includes("confirmPassword"));
  }
});

test("Schema Validation: AdminCreateProjectSchema requires valid name and customer ID", () => {
  const valid = AdminCreateProjectSchema.safeParse({
    name: "Luxury Villa at Alibaug",
    customerId: "cust-1",
    location: "Alibaug",
  });
  assert.equal(valid.success, true);

  const tooShort = AdminCreateProjectSchema.safeParse({
    name: "A",
    customerId: "cust-1",
  });
  assert.equal(tooShort.success, false);

  const missingCustomer = AdminCreateProjectSchema.safeParse({
    name: "Luxury Villa",
    customerId: "",
  });
  assert.equal(missingCustomer.success, false);
});

test("Schema Validation: VerifyOtpRequestSchema requires exact 6 digits", () => {
  assert.equal(VerifyOtpRequestSchema.safeParse({ token: "123456" }).success, true);
  assert.equal(VerifyOtpRequestSchema.safeParse({ token: "12345" }).success, false);
  assert.equal(VerifyOtpRequestSchema.safeParse({ token: "abcdef" }).success, false);
  assert.equal(VerifyOtpRequestSchema.safeParse({ token: "1234567" }).success, false);
});

test("Schema Validation: StoragePresignRequestSchema validates category and positive file size", () => {
  const validDoc = StoragePresignRequestSchema.safeParse({
    projectId: "proj-1",
    fileName: "specification.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 1024,
    category: "document",
  });
  assert.equal(validDoc.success, true);

  const invalidCategory = StoragePresignRequestSchema.safeParse({
    projectId: "proj-1",
    fileName: "plan.dwg",
    contentType: "application/octet-stream",
    fileSizeBytes: 1024,
    category: "invalid_category",
  });
  assert.equal(invalidCategory.success, false);

  const negativeSize = StoragePresignRequestSchema.safeParse({
    projectId: "proj-1",
    fileName: "plan.dwg",
    contentType: "application/octet-stream",
    fileSizeBytes: -1,
  });
  assert.equal(negativeSize.success, false);
});

test("Schema Validation: ClientSendMessageSchema enforces character bounds", () => {
  const valid = ClientSendMessageSchema.safeParse({
    projectId: "p1",
    body: "Hello, what is the current milestone status?",
  });
  assert.equal(valid.success, true);

  const blank = ClientSendMessageSchema.safeParse({
    projectId: "p1",
    body: "   ",
  });
  assert.equal(blank.success, false);

  const oversized = ClientSendMessageSchema.safeParse({
    projectId: "p1",
    body: "x".repeat(5001),
  });
  assert.equal(oversized.success, false);
});

test("Payload Validator: parseAndValidateJson rejects malformed JSON with 400", async () => {
  const req = new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ malformed json",
  });

  const schema = z.object({ name: z.string() });
  const result = await parseAndValidateJson(req, schema);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.response.status, 400);
    const body = await result.response.json();
    assert.equal(body.code, "INVALID_JSON");
  }
});

test("Payload Validator: parseAndValidateJson produces structured field errors on invalid data", async () => {
  const req = new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email", password: "" }),
  });

  const result = await parseAndValidateJson(req, LoginRequestSchema);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.response.status, 400);
    const body = await result.response.json();
    assert.equal(body.code, "VALIDATION_FAILED");
    assert.ok(body.fieldErrors?.email);
    assert.ok(body.fieldErrors?.password);
  }
});

test("Payload Validator: validateSearchParams extracts and validates query string", () => {
  const schema = z.object({ key: z.string().min(1) });

  const validParams = new URLSearchParams("key=projects/p1/doc.pdf");
  const validResult = validateSearchParams(validParams, schema);
  assert.equal(validResult.success, true);
  if (validResult.success) {
    assert.equal(validResult.data.key, "projects/p1/doc.pdf");
  }

  const invalidParams = new URLSearchParams("");
  const invalidResult = validateSearchParams(invalidParams, schema);
  assert.equal(invalidResult.success, false);
  if (!invalidResult.success) {
    assert.equal(invalidResult.response.status, 400);
  }
});
