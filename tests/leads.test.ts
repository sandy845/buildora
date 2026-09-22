import assert from "node:assert/strict";
import test from "node:test";
import { submitContactLeadAction } from "../src/lib/actions/leads.ts";

test("submitContactLeadAction rejects empty payload with field errors", async () => {
  const result = await submitContactLeadAction({});
  assert.equal(result.success, undefined);
  assert.ok(result.error);
  assert.equal(result.fieldErrors?.fullName, "Please enter your name.");
  assert.equal(result.fieldErrors?.email, "Please enter your email.");
  assert.equal(result.fieldErrors?.phone, "Please enter your phone number.");
  assert.equal(result.fieldErrors?.location, "Please enter the project location.");
  assert.equal(result.fieldErrors?.message, "Please share a short project brief.");
});

test("submitContactLeadAction rejects invalid email address", async () => {
  const result = await submitContactLeadAction({
    fullName: "John Doe",
    email: "not-an-email",
    phone: "+91 99999 88888",
    location: "Mumbai",
    message: "Need RCC construction",
  });
  assert.equal(result.success, undefined);
  assert.equal(result.fieldErrors?.email, "Please enter a valid email address.");
});
