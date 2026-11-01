import assert from "node:assert/strict";
import test from "node:test";
import {
  getHomeServices,
  getHomeProjects,
  getReasons,
  getHomeProcess,
  getTestimonials,
  getTrustStats,
  getServices,
  getProjects,
  getValues,
  getExpertise,
  getProcessSteps,
} from "../src/lib/data-access.ts";
import { calculateEstimate, formatCurrency } from "../src/lib/cost-estimator.ts";
import { hasPermission, canAccessResource } from "../src/lib/auth/rbac.ts";
import { extractSafeExtension, buildObjectKey, isValidStorageKey } from "../src/lib/storage.ts";
import { apiInternalError } from "../src/lib/api/response.ts";

test("Regression: public content datasets load with complete metadata", () => {
  const homeServices = getHomeServices();
  assert.ok(Array.isArray(homeServices));
  assert.ok(homeServices.length > 0);
  assert.ok(homeServices[0]?.title);

  const homeProjects = getHomeProjects();
  assert.ok(Array.isArray(homeProjects));
  assert.ok(homeProjects.length > 0);

  const trustStats = getTrustStats();
  assert.ok(Array.isArray(trustStats));
  assert.ok(trustStats.length >= 3);

  const reasons = getReasons();
  assert.ok(Array.isArray(reasons));
  assert.ok(reasons.length >= 3);

  const homeProcess = getHomeProcess();
  assert.ok(Array.isArray(homeProcess));
  assert.ok(homeProcess.length >= 3);

  const testimonials = getTestimonials();
  assert.ok(Array.isArray(testimonials));
  assert.ok(testimonials.length > 0);

  const services = getServices();
  assert.ok(Array.isArray(services));
  assert.ok(services.length >= 4);

  const projects = getProjects();
  assert.ok(Array.isArray(projects));
  assert.ok(projects.length > 0);

  const values = getValues();
  assert.ok(Array.isArray(values));

  const expertise = getExpertise();
  assert.ok(Array.isArray(expertise));

  const processSteps = getProcessSteps();
  assert.ok(Array.isArray(processSteps));
});

test("Regression: Cost Estimator computes accurate ranges and currencies", () => {
  const input = {
    propertyType: "Apartment",
    constructionType: "RCC",
    area: "1200",
    floors: "2",
    interior: "Premium",
    location: "Metro",
    quality: "Premium",
  };

  const estimate = calculateEstimate(input);
  assert.ok(estimate.minimum > 0);
  assert.ok(estimate.maximum > estimate.minimum);
  assert.ok(estimate.perSqFt > 1000);

  const formatted = formatCurrency(estimate.minimum);
  assert.ok(formatted.includes("₹") || formatted.includes("INR"));
});

test("Security Matrix: customer cannot access admin permissions or peer resources", () => {
  // 1. Permission checks
  assert.equal(hasPermission("customer", "admin:dashboard"), false);
  assert.equal(hasPermission("customer", "projects:delete_any"), false);
  assert.equal(hasPermission("customer", "leads:manage"), false);
  assert.equal(hasPermission("customer", "quotations:manage"), false);

  // 2. Resource tenant access checks
  const customer = { id: "cust-user-1", role: "customer" as const };
  const admin = { id: "admin-master", role: "admin" as const };

  assert.equal(canAccessResource(customer, "cust-user-1"), true);
  assert.equal(canAccessResource(customer, "cust-user-2"), false);
  assert.equal(canAccessResource(admin, "cust-user-2"), true);
});

test("Security Matrix: storage path traversal and dangerous extensions are rejected", () => {
  // Dangerous extensions blocked
  assert.equal(extractSafeExtension("malware.exe"), null);
  assert.equal(extractSafeExtension("script.sh"), null);
  assert.equal(extractSafeExtension("shell.php"), null);
  assert.equal(extractSafeExtension(".env"), null);
  assert.equal(extractSafeExtension(".htaccess"), null);

  // Safe extensions accepted
  assert.equal(extractSafeExtension("drawing.dwg"), "dwg");
  assert.equal(extractSafeExtension("specification.pdf"), "pdf");

  // Path traversal in buildObjectKey rejected
  assert.throws(() => {
    buildObjectKey("projects/../../etc", "documents", "contract.pdf");
  }, /path traversal/i);

  // Storage key scoping validation
  assert.equal(isValidStorageKey("projects/proj-1/documents/doc-123.pdf", "proj-1"), true);
  assert.equal(isValidStorageKey("projects/proj-1/documents/doc-123.pdf", "proj-2"), false);
  assert.equal(isValidStorageKey("projects/proj-1/../../etc/passwd", "proj-1"), false);
});

test("Security Matrix: production error responses never leak internals or stack traces", async () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = env.NODE_ENV;
  try {
    env.NODE_ENV = "production";
    const internalErr = new Error("PostgreSQL connection error: password auth failed at line 12");
    const res = apiInternalError(internalErr, "Failed to load requested resource.");

    assert.equal(res.status, 500);
    const body = (await res.json()) as { success: boolean; error: string; details?: unknown };
    assert.equal(body.success, false);
    assert.equal(body.error, "Failed to load requested resource.");
    assert.equal(body.details, undefined);
  } finally {
    env.NODE_ENV = originalEnv;
  }
});
