import assert from "node:assert/strict";
import test from "node:test";
import { submitContactLeadAction } from "../src/lib/actions/leads.ts";
import { prisma } from "../src/lib/db/prisma.ts";

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

test("submitContactLeadAction persists a valid enquiry in PostgreSQL", {
  skip: process.env.RUN_DATABASE_TESTS !== "1",
}, async () => {
  const serviceName = `Interior design ${Date.now()}`;
  const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const email = `lead-${Date.now()}@example.com`;
  const service = await prisma.service.create({
    data: { name: serviceName, slug, description: "Test fixture" },
  });
  try {
    const result = await submitContactLeadAction({
      fullName: "Buildora Test Customer",
      email,
      phone: "+91 98765 43210",
      location: "Mumbai",
      service: serviceName,
      message: "Please help plan an interior design project.",
    });
    assert.equal(result.success, true);
    assert.ok(result.leadId);
    const lead = await prisma.lead.findUnique({ where: { id: result.leadId } });
    assert.equal(lead?.projectBrief, `[Service: ${serviceName}]\nPlease help plan an interior design project.`);
    assert.equal(lead?.budgetRange, null);
    assert.equal(lead?.serviceId, service.id);
  } finally {
    await prisma.lead.deleteMany({ where: { email } });
    await prisma.service.delete({ where: { id: service.id } });
  }
});
