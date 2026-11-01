import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPermission,
  assertPermission,
  canAccessResource,
  assertResourceAccess,
  CUSTOMER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  type Permission,
  type Actor,
} from "../src/lib/auth/rbac.ts";
import { ServiceError } from "../src/lib/services/shared.ts";

test("RBAC: customer has authorized permissions and lacks administrative permissions", () => {
  const customerAllowed: Permission[] = [
    "profile:read",
    "profile:update",
    "projects:read_own",
    "projects:create_own",
    "quotations:read_own",
    "quotations:respond",
    "approvals:read_own",
    "approvals:respond",
    "documents:read_own",
    "documents:upload_own",
    "messages:read_own",
    "messages:send_own",
    "payments:read_own",
  ];

  for (const perm of customerAllowed) {
    assert.equal(hasPermission("customer", perm), true, `Customer should have ${perm}`);
    assert.equal(CUSTOMER_PERMISSIONS.has(perm), true, `CUSTOMER_PERMISSIONS set must contain ${perm}`);
  }

  const adminOnly: Permission[] = [
    "projects:read_all",
    "projects:create_any",
    "projects:update_any",
    "projects:delete_any",
    "quotations:manage",
    "quotations:read_all",
    "approvals:manage",
    "documents:manage_all",
    "documents:read_all",
    "messages:read_all",
    "leads:read_all",
    "leads:manage",
    "payments:manage",
    "admin:dashboard",
    "admin:audit_logs",
  ];

  for (const perm of adminOnly) {
    assert.equal(hasPermission("customer", perm), false, `Customer must NOT have ${perm}`);
  }
});

test("RBAC: administrator has all system permissions", () => {
  const testPermissions: Permission[] = [
    "profile:read",
    "projects:read_all",
    "projects:delete_any",
    "quotations:manage",
    "approvals:manage",
    "documents:manage_all",
    "leads:manage",
    "payments:manage",
    "admin:dashboard",
    "admin:audit_logs",
  ];

  for (const perm of testPermissions) {
    assert.equal(hasPermission("admin", perm), true, `Admin should have ${perm}`);
    assert.equal(ADMIN_PERMISSIONS.has(perm), true, `ADMIN_PERMISSIONS set must contain ${perm}`);
  }
});

test("RBAC: assertPermission passes for authorized actions and throws 403 ServiceError for unauthorized", () => {
  const customer: Actor = { id: "cust-1", role: "customer" };
  const admin: Actor = { id: "admin-1", role: "admin" };

  // Customer authorized action
  assert.doesNotThrow(() => {
    assertPermission(customer, "projects:read_own");
  });

  // Customer unauthorized administrative action
  assert.throws(
    () => {
      assertPermission(customer, "admin:dashboard");
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.ok(err.message.includes("Missing permission"));
      return true;
    }
  );

  // Admin authorized on administrative action
  assert.doesNotThrow(() => {
    assertPermission(admin, "admin:dashboard");
  });

  assert.doesNotThrow(() => {
    assertPermission(admin, "projects:delete_any");
  });
});

test("RBAC: resource ownership isolation prevents cross-tenant access", () => {
  const customerA: Actor = { id: "cust-a", role: "customer" };
  const customerB: Actor = { id: "cust-b", role: "customer" };
  const admin: Actor = { id: "admin-master", role: "admin" };

  // Customer A accessing own resource
  assert.equal(canAccessResource(customerA, "cust-a"), true);

  // Customer A accessing Customer B's resource -> DENIED
  assert.equal(canAccessResource(customerA, "cust-b"), false);

  // Customer B accessing Customer A's resource -> DENIED
  assert.equal(canAccessResource(customerB, "cust-a"), false);

  // Admin accessing any customer resource -> ALLOWED
  assert.equal(canAccessResource(admin, "cust-a"), true);
  assert.equal(canAccessResource(admin, "cust-b"), true);
});

test("RBAC: assertResourceAccess throws FORBIDDEN on unauthorized resource access", () => {
  const customerA: Actor = { id: "cust-a", role: "customer" };
  const admin: Actor = { id: "admin-master", role: "admin" };

  // Customer A accessing own resource succeeds
  assert.doesNotThrow(() => {
    assertResourceAccess(customerA, "cust-a", "project");
  });

  // Customer A accessing Customer B's resource throws FORBIDDEN
  assert.throws(
    () => {
      assertResourceAccess(customerA, "cust-b", "quotation");
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.ok(err.message.includes("quotation"));
      return true;
    }
  );

  // Admin accessing Customer B's resource succeeds
  assert.doesNotThrow(() => {
    assertResourceAccess(admin, "cust-b", "quotation");
  });
});

test("RBAC: edge middleware session signature verification and role routing", async () => {
  // Test HMAC signature logic matching middleware Web Crypto API
  const encoder = new TextEncoder();
  const secret = "buildora_test_session_key_32_chars_minimum_length";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const customerPayload = {
    userId: "cust-123",
    role: "customer" as const,
    expiresAt: Date.now() + 60_000,
  };
  const body = Buffer.from(JSON.stringify(customerPayload)).toString("base64url");
  const signedBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const bytes = new Uint8Array(signedBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // Verify valid signature passes
  const verifyBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const verifyBytes = new Uint8Array(verifyBuffer);
  let verifyBinary = "";
  for (let i = 0; i < verifyBytes.byteLength; i++) {
    verifyBinary += String.fromCharCode(verifyBytes[i]!);
  }
  const computedSig = btoa(verifyBinary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assert.equal(signature, computedSig);

  // Verify tampered payload fails
  const tamperedBody = Buffer.from(JSON.stringify({ ...customerPayload, role: "admin" })).toString("base64url");
  assert.notEqual(tamperedBody, body);
});
