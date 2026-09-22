import assert from "node:assert/strict";
import test from "node:test";
import { validateLogin, validateRegister, validateReset, validateVerify } from "../src/lib/auth.ts";

test("registration rejects malformed runtime input", () => {
  const errors = validateRegister({ name: 42, email: "bad", password: "short" });
  assert.equal(errors.name, "Please enter your name.");
  assert.equal(errors.email, "Please enter a valid email.");
  assert.equal(errors.phone, "Please enter your phone number.");
  assert.equal(errors.password, "Password must be at least 8 characters.");
  assert.equal(errors.confirmPassword, "Please confirm your password.");
});

test("registration accepts a complete valid customer payload", () => {
  const errors = validateRegister({
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+44 20 0000 0000",
    password: "correct horse battery staple",
    confirmPassword: "correct horse battery staple",
  });
  assert.deepEqual(errors, {});
});

test("registration rejects excessively long passwords", () => {
  const password = "a".repeat(257);
  const errors = validateRegister({
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "123",
    password,
    confirmPassword: password,
  });
  assert.equal(errors.password, "Password must be at least 8 characters.");
});

test("login rejects malformed values without throwing", () => {
  const errors = validateLogin({ email: { value: "ada@example.com" }, password: null });
  assert.equal(errors.email, "Please enter your email.");
  assert.equal(errors.password, "Please enter your password.");
});

test("reset and verification validators reject non-string payloads", () => {
  assert.equal(validateReset({ email: 123 }).email, "Please enter your email.");
  assert.equal(validateVerify({ otp: 123 }).otp, "Please enter the verification code.");
});
