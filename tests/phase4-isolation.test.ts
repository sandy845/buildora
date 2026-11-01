import assert from "node:assert/strict";
import test from "node:test";
import {
  assertProjectCustomer,
  assertProjectOwner,
  canAccessProject,
  safeDatabaseOperation,
  ServiceError,
  type ServiceActor,
} from "../src/lib/services/shared.ts";
import {
  listNotificationService,
  updateNotificationService,
  deleteNotificationService,
} from "../src/lib/services/core.ts";
import { buildObjectKey } from "../src/lib/storage.ts";

test("Data Isolation: canAccessProject permits owner and admins only", () => {
  const customerA: ServiceActor = { id: "cust-a", role: "customer" };
  const customerB: ServiceActor = { id: "cust-b", role: "customer" };
  const admin: ServiceActor = { id: "admin-master", role: "admin" };

  // Customer accessing own project
  assert.equal(canAccessProject(customerA, "cust-a"), true);

  // Customer accessing other customer's project -> DENIED
  assert.equal(canAccessProject(customerA, "cust-b"), false);
  assert.equal(canAccessProject(customerB, "cust-a"), false);

  // Admin accessing any project -> PERMITTED
  assert.equal(canAccessProject(admin, "cust-a"), true);
  assert.equal(canAccessProject(admin, "cust-b"), true);
});

test("Data Isolation: assertProjectOwner throws FORBIDDEN on cross-customer access", () => {
  const customerA: ServiceActor = { id: "cust-a", role: "customer" };
  const admin: ServiceActor = { id: "admin-master", role: "admin" };

  assert.doesNotThrow(() => {
    assertProjectOwner(customerA, "cust-a");
  });

  assert.throws(
    () => {
      assertProjectOwner(customerA, "cust-b");
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.equal(err.message, "You cannot access this project.");
      return true;
    }
  );

  assert.doesNotThrow(() => {
    assertProjectOwner(admin, "cust-b");
  });
});

test("Data Isolation: assertProjectCustomer prevents customers from creating projects for others", () => {
  const customerA: ServiceActor = { id: "cust-a", role: "customer" };
  const admin: ServiceActor = { id: "admin-master", role: "admin" };

  // Customer creating for self -> ALLOWED
  assert.doesNotThrow(() => {
    assertProjectCustomer(customerA, "cust-a");
  });

  // Customer creating for another -> FORBIDDEN
  assert.throws(
    () => {
      assertProjectCustomer(customerA, "cust-b");
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.equal(err.message, "Customers can create projects only for themselves.");
      return true;
    }
  );

  // Admin creating for any customer -> ALLOWED
  assert.doesNotThrow(() => {
    assertProjectCustomer(admin, "cust-b");
  });
});

test("Data Isolation: notification services strictly isolate user notifications", () => {
  const customerA: ServiceActor = { id: "cust-a", role: "customer" };

  // Cross-tenant list notifications — customer A cannot list customer B's notifications
  assert.throws(
    () => {
      listNotificationService(customerA, "cust-b");
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.equal(err.message, "You cannot access these notifications.");
      return true;
    }
  );

  // Customer A can list own notifications without error being thrown
  // (no DB call in this synchronous check — we just verify no FORBIDDEN is thrown)
  assert.doesNotThrow(() => {
    // Calling with matching actor.id === userId — no throw, even if no DB
    const { id } = customerA;
    listNotificationService(customerA, id);
  });

  // Cross-tenant update notifications
  assert.throws(
    () => {
      updateNotificationService(customerA, "cust-b", "notif-1", { readAt: new Date() });
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.equal(err.message, "You cannot update these notifications.");
      return true;
    }
  );

  // Cross-tenant delete notifications
  assert.throws(
    () => {
      deleteNotificationService(customerA, "cust-b", "notif-1");
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "FORBIDDEN");
      assert.equal(err.message, "You cannot delete these notifications.");
      return true;
    }
  );
});

test("Data Isolation: safeDatabaseOperation fails closed and never leaks error details", async () => {
  // Simulate a database connection timeout or crash
  await assert.rejects(
    async () => {
      await safeDatabaseOperation(async () => {
        throw new Error("P2024: Timed out fetching a new connection from the connection pool");
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ServiceError);
      assert.equal(err.code, "DATABASE_ERROR");
      assert.equal(err.message, "We could not complete that request. Please try again.");
      // Ensure raw database internals / credentials are not in message
      assert.ok(!err.message.includes("P2024"));
      assert.ok(!err.message.includes("pool"));
      return true;
    }
  );
});

test("Data Isolation: document storage paths enforce strict project key scoping", () => {
  const projectId = "proj-xyz-789";
  const key = buildObjectKey(`projects/${projectId}`, "documents", "contract.pdf");

  assert.ok(key.startsWith(`projects/${projectId}/documents/`));
  assert.ok(!key.includes("../"));
  assert.ok(!key.includes("..\\"));
});
