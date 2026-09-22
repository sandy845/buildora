import assert from "node:assert/strict";
import test from "node:test";
import { assertProjectAccess, assertProjectCustomer, requireEmail, requireMoney, requirePositive, ServiceError } from "../src/lib/services/shared.ts";

test("requireEmail validates valid email formats", () => {
  assert.equal(requireEmail("User@Example.COM"), "user@example.com");
  assert.throws(
    () => requireEmail("invalid-email"),
    (err: unknown) => err instanceof ServiceError && err.code === "INVALID_INPUT",
  );
});

test("requirePositive rejects zero and negative values", () => {
  assert.equal(requirePositive(10, "amount"), 10);
  assert.throws(
    () => requirePositive(0, "amount"),
    (err: unknown) => err instanceof ServiceError && err.code === "INVALID_INPUT",
  );
  assert.throws(
    () => requirePositive(-5, "amount"),
    (err: unknown) => err instanceof ServiceError && err.code === "INVALID_INPUT",
  );
});

test("requireMoney enforces maximum 2 decimal places", () => {
  assert.equal(requireMoney(100.5, "price"), 100.5);
  assert.equal(requireMoney(99.99, "price"), 99.99);
  assert.throws(
    () => requireMoney(10.005, "price"),
    (err: unknown) => err instanceof ServiceError && err.code === "INVALID_INPUT",
  );
});

test("assertProjectCustomer allows admins to specify any customer ID", () => {
  assert.doesNotThrow(() => {
    assertProjectCustomer({ id: "admin-1", role: "admin" }, "customer-99");
  });
});

test("assertProjectCustomer allows customers to specify only their own customer ID", () => {
  assert.doesNotThrow(() => {
    assertProjectCustomer({ id: "customer-1", role: "customer" }, "customer-1");
  });

  assert.throws(
    () => assertProjectCustomer({ id: "customer-1", role: "customer" }, "customer-2"),
    (err: unknown) => err instanceof ServiceError && err.code === "FORBIDDEN",
  );
});
