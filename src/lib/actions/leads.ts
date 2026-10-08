"use server";

import { firestoreFindOne } from "../firebase/firestore";
import { createLeadService } from "../services/core.ts";
import { sendLeadConfirmationEmail, sendNewLeadAlertEmail } from "../email.ts";
import { leadFormLimiter, getClientIp } from "../rate-limit.ts";
import { headers } from "next/headers.js";
import { getCurrentUser } from "../auth/server";
import { createProject } from "../db/data-access";

export type SubmitLeadState = {
  success?: boolean;
  leadId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitContactLeadAction(
  payload: Record<string, unknown> | FormData
): Promise<SubmitLeadState> {
  // 1. Rate limiting check per IP
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const rateCheck = leadFormLimiter.check(ip);
    if (!rateCheck.success) {
      return {
        error: "Too many enquiries submitted from this network. Please try again in 10 minutes or call us directly.",
      };
    }
  } catch {
    // In environments without header context (e.g. direct unit test invocations), proceed gracefully
  }

  let fullName = "";
  let email = "";
  let phone = "";
  let serviceName = "";
  let budget = "";
  let location = "";
  let message = "";

  if (payload instanceof FormData) {
    fullName = String(payload.get("fullName") ?? "").trim();
    email = String(payload.get("email") ?? "").trim();
    phone = String(payload.get("phone") ?? "").trim();
    serviceName = String(payload.get("service") ?? "").trim();
    budget = String(payload.get("budget") ?? "").trim();
    location = String(payload.get("location") ?? "").trim();
    message = String(payload.get("message") ?? "").trim();
  } else {
    fullName = String(payload.fullName ?? "").trim();
    email = String(payload.email ?? "").trim();
    phone = String(payload.phone ?? "").trim();
    serviceName = String(payload.service ?? "").trim();
    budget = String(payload.budget ?? "").trim();
    location = String(payload.location ?? "").trim();
    message = String(payload.message ?? "").trim();
  }

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Please enter your name.";
  if (!email) {
    fieldErrors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }
  if (!phone) fieldErrors.phone = "Please enter your phone number.";
  if (!location) fieldErrors.location = "Please enter the project location.";
  if (!message) fieldErrors.message = "Please share a short project brief.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fill in all required fields.", fieldErrors };
  }

  try {
    let serviceConnect: { connect: { id: string } } | undefined;
    if (serviceName) {
      const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const matchedService = await firestoreFindOne<{ id: string }>("services", {
        where: [{ field: "slug", operator: "==", value: slug }],
      });
      if (matchedService) {
        serviceConnect = { connect: { id: matchedService.id } };
      }
    }

    const lead = await createLeadService({
      name: fullName,
      email: email.toLowerCase(),
      phone,
      location,
      projectBrief: serviceName ? `[Service: ${serviceName}]\n${message}` : message,
      ...(budget ? { budgetRange: budget } : {}),
      source: "website_contact",
      ...(serviceConnect ? { service: serviceConnect } : {}),
    });

    // If a logged-in customer submitted this form, also create a Project record
    // linked to their account so it shows on their dashboard immediately.
    try {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.role === "customer") {
        const projectName = serviceName || "New Project";
        const slug = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
        await createProject({
          customerId: currentUser.id,
          name: projectName,
          slug,
          location,
          status: "planning",
          progress: 0,
          leadId: lead.id,
          description: message,
          ...(budget ? { budgetRange: budget } : {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        });
      }
    } catch (projectErr) {
      // Non-fatal — the lead was already saved. Log and continue.
      console.warn("[leads] Could not create project record for logged-in user:", projectErr);
    }

    // Dispatch customer confirmation and admin notification emails asynchronously
    try {
      await Promise.allSettled([
        sendLeadConfirmationEmail({
          customerName: fullName,
          customerEmail: email.toLowerCase(),
          service: serviceName || undefined,
          location,
          leadId: lead.id,
        }),
        sendNewLeadAlertEmail({
          leadId: lead.id,
          customerName: fullName,
          customerEmail: email.toLowerCase(),
          customerPhone: phone,
          service: serviceName || undefined,
          budget: budget || undefined,
          location,
          projectBrief: message,
        }),
      ]);
    } catch (emailErr) {
      console.error("[leads] Background email dispatch error:", emailErr);
    }

    return { success: true, leadId: lead.id };
  } catch (err: unknown) {
    console.error("Failed to submit lead:", err);
    return {
      error: "We could not submit your enquiry at this moment. Please try again or reach us by phone.",
    };
  }
}
