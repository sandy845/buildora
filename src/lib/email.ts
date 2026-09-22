/**
 * Buildora transactional email service.
 *
 * Supports:
 *   1. Resend API     — RESEND_API_KEY (modern default, zero-dependency fetch)
 *   2. Postmark API   — POSTMARK_SERVER_TOKEN (enterprise transactional API)
 *   3. SMTP Transport — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (nodemailer)
 *   4. Local Dev Log  — Graceful simulated output if no provider is configured.
 *
 * Sender configuration:
 *   EMAIL_FROM  — Sender address (default: "Buildora <no-reply@buildora.in>")
 *   EMAIL_ADMIN — Admin notification inbox (default: "admin@buildora.in")
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ---------------------------------------------------------------------------
// Types & Provider Detection
// ---------------------------------------------------------------------------

export type EmailProviderType = "resend" | "postmark" | "smtp" | "simulated";

export type EmailResult = {
  sent: boolean;
  provider?: EmailProviderType;
  simulated?: boolean;
  error?: string;
};

export type LeadConfirmationData = {
  customerName: string;
  customerEmail: string;
  service?: string;
  location: string;
  leadId: string;
};

export type NewLeadAlertData = {
  leadId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service?: string;
  budget?: string;
  location: string;
  projectBrief: string;
};

export type ApprovalReminderData = {
  recipientName: string;
  recipientEmail: string;
  projectName: string;
  approvalTitle: string;
  approvalType: string;
  referenceId: string;
  dueDate?: string;
  reviewUrl?: string;
};

export function getEmailProviderStatus(): {
  provider: EmailProviderType;
  configured: boolean;
} {
  if (process.env.RESEND_API_KEY) return { provider: "resend", configured: true };
  if (process.env.POSTMARK_SERVER_TOKEN) return { provider: "postmark", configured: true };
  if (process.env.SMTP_HOST) return { provider: "smtp", configured: true };
  return { provider: "simulated", configured: false };
}

// ---------------------------------------------------------------------------
// Transporter singleton (for SMTP)
// ---------------------------------------------------------------------------

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

// ---------------------------------------------------------------------------
// Internal send helper (Multi-provider dispatcher)
// ---------------------------------------------------------------------------

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM ?? "Buildora <no-reply@buildora.in>";

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[email/resend] Failed: ${res.status} ${errText}`);
        return { sent: false, provider: "resend", error: errText };
      }

      return { sent: true, provider: "resend" };
    } catch (err) {
      console.error("[email/resend] Network error:", err);
      return { sent: false, provider: "resend", error: String(err) };
    }
  }

  // 2. Postmark API
  if (process.env.POSTMARK_SERVER_TOKEN) {
    try {
      const res = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          From: from,
          To: to,
          Subject: subject,
          HtmlBody: html,
          TextBody: text,
          MessageStream: "outbound",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[email/postmark] Failed: ${res.status} ${errText}`);
        return { sent: false, provider: "postmark", error: errText };
      }

      return { sent: true, provider: "postmark" };
    } catch (err) {
      console.error("[email/postmark] Network error:", err);
      return { sent: false, provider: "postmark", error: String(err) };
    }
  }

  // 3. Nodemailer SMTP
  const t = getTransporter();
  if (t) {
    try {
      await t.sendMail({ from, to, subject, html, text });
      return { sent: true, provider: "smtp" };
    } catch (err) {
      console.error("[email/smtp] Failed:", err);
      return { sent: false, provider: "smtp", error: String(err) };
    }
  }

  // 4. Local dev / test fallback
  console.info(`[email/simulated] Delivery to: ${to} | Subject: "${subject}"`);
  return { sent: true, provider: "simulated", simulated: true };
}

// ---------------------------------------------------------------------------
// Public email functions
// ---------------------------------------------------------------------------

/**
 * Send a confirmation email to the customer after they submit a contact lead.
 */
export async function sendLeadConfirmationEmail(data: LeadConfirmationData): Promise<EmailResult> {
  const { customerName, customerEmail, service, location, leadId } = data;
  const shortId = leadId.split("-")[0].toUpperCase();

  const subject = `We received your enquiry — Buildora (Ref: ${shortId})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ede7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede7;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e2dc;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:28px 32px;">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d4b97a;">Buildora</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 32px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9b9590;">Enquiry received</p>
          <h1 style="margin:0 0 20px;font-size:26px;font-weight:600;color:#1a1a1a;line-height:1.3;">Thank you, ${escapeHtml(customerName)}</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#6b6560;line-height:1.6;">
            We have received your project enquiry and our engineering team will review your details carefully.
            You can expect a call or email from us within <strong style="color:#1a1a1a;">24 business hours</strong>.
          </p>
          <!-- Details card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f3;border-radius:12px;margin:24px 0;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9b9590;">Your enquiry details</p>
              ${service ? `<p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;"><strong>Service:</strong> ${escapeHtml(service)}</p>` : ""}
              <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;"><strong>Location:</strong> ${escapeHtml(location)}</p>
              <p style="margin:0;font-size:12px;color:#9b9590;">Reference: <strong style="color:#1a1a1a;">${shortId}</strong></p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#6b6560;line-height:1.6;">
            If you have any immediate questions, feel free to call us directly or reply to this email.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f6f3;padding:20px 32px;border-top:1px solid #e5e2dc;">
          <p style="margin:0;font-size:12px;color:#9b9590;">© ${new Date().getFullYear()} Buildora. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `
Hi ${customerName},

We have received your project enquiry — thank you for reaching out to Buildora.

Our engineering team will review your details and get in touch within 24 business hours.

Enquiry reference: ${shortId}
${service ? `Service: ${service}` : ""}
Location: ${location}

— The Buildora Team
`.trim();

  return sendEmail({ to: customerEmail, subject, html, text });
}

/**
 * Send a new-lead alert to the admin inbox.
 */
export async function sendNewLeadAlertEmail(data: NewLeadAlertData): Promise<EmailResult> {
  const adminEmail = process.env.EMAIL_ADMIN ?? "admin@buildora.in";

  const { leadId, customerName, customerEmail, customerPhone, service, budget, location, projectBrief } = data;
  const shortId = leadId.split("-")[0].toUpperCase();
  const subject = `🔔 New lead received — ${customerName} (${shortId})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px 16px;background:#f0ede7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e2dc;margin:0 auto;">
    <tr><td style="background:#1a1a1a;padding:24px 28px;border-radius:16px 16px 0 0;">
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d4b97a;">New lead alert</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#ffffff;">${escapeHtml(customerName)}</h1>
    </td></tr>
    <tr><td style="padding:28px;">
      <table width="100%" cellpadding="0" cellspacing="4">
        <tr><td style="font-size:13px;color:#9b9590;padding:6px 0;width:130px;">Reference</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;">${shortId}</td></tr>
        <tr><td style="font-size:13px;color:#9b9590;padding:6px 0;">Email</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;">${escapeHtml(customerEmail)}</td></tr>
        <tr><td style="font-size:13px;color:#9b9590;padding:6px 0;">Phone</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;">${escapeHtml(customerPhone)}</td></tr>
        ${service ? `<tr><td style="font-size:13px;color:#9b9590;padding:6px 0;">Service</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;">${escapeHtml(service)}</td></tr>` : ""}
        ${budget ? `<tr><td style="font-size:13px;color:#9b9590;padding:6px 0;">Budget</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;">${escapeHtml(budget)}</td></tr>` : ""}
        <tr><td style="font-size:13px;color:#9b9590;padding:6px 0;">Location</td><td style="font-size:13px;font-weight:600;color:#1a1a1a;">${escapeHtml(location)}</td></tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#f8f6f3;border-radius:10px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9b9590;">Project brief</p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${escapeHtml(projectBrief)}</p>
      </div>
    </td></tr>
    <tr><td style="background:#f8f6f3;padding:16px 28px;border-top:1px solid #e5e2dc;border-radius:0 0 16px 16px;">
      <p style="margin:0;font-size:12px;color:#9b9590;">Automated notification from Buildora CRM. Lead ID: ${leadId}</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `
NEW LEAD — ${customerName} (${shortId})

Email:    ${customerEmail}
Phone:    ${customerPhone}
${service ? `Service:  ${service}` : ""}
${budget ? `Budget:   ${budget}` : ""}
Location: ${location}

Project brief:
${projectBrief}

Lead ID: ${leadId}
`.trim();

  return sendEmail({ to: adminEmail, subject, html, text });
}

/**
 * Send an approval reminder notification to the client or project owner.
 */
export async function sendApprovalReminderEmail(data: ApprovalReminderData): Promise<EmailResult> {
  const { recipientName, recipientEmail, projectName, approvalTitle, approvalType, referenceId, dueDate, reviewUrl } = data;
  const link = reviewUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://buildora.in"}/client/dashboard#approvals`;

  const subject = `Action required: Approval pending for ${projectName} — ${approvalTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px 16px;background:#f0ede7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e2dc;margin:0 auto;overflow:hidden;">
    <tr><td style="background:#1a1a1a;padding:26px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d4b97a;">Buildora · Action Required</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#ffffff;line-height:1.3;">Approval Pending Review</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.6;">
        Dear ${escapeHtml(recipientName)},
      </p>
      <p style="margin:0 0 20px;font-size:14px;color:#6b6560;line-height:1.6;">
        Your project team has submitted a new item requiring your review and sign-off for <strong style="color:#1a1a1a;">${escapeHtml(projectName)}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f3;border-radius:12px;margin:20px 0;">
        <tr><td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="4">
            <tr><td style="font-size:12px;color:#9b9590;width:120px;">Item</td><td style="font-size:14px;font-weight:600;color:#1a1a1a;">${escapeHtml(approvalTitle)}</td></tr>
            <tr><td style="font-size:12px;color:#9b9590;">Category</td><td style="font-size:13px;color:#1a1a1a;text-transform:capitalize;">${escapeHtml(approvalType)}</td></tr>
            ${dueDate ? `<tr><td style="font-size:12px;color:#9b9590;">Target Date</td><td style="font-size:13px;font-weight:600;color:#b45309;">${escapeHtml(dueDate)}</td></tr>` : ""}
            <tr><td style="font-size:12px;color:#9b9590;">Reference</td><td style="font-size:12px;color:#6b6560;">${referenceId.slice(0, 8).toUpperCase()}</td></tr>
          </table>
        </td></tr>
      </table>

      <div style="text-align:center;margin:32px 0 24px;">
        <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:9999px;font-size:14px;font-weight:600;text-decoration:none;">
          Review & Sign Off Now
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#9b9590;text-align:center;">
        Prompt approvals keep on-site milestones running smoothly and on schedule.
      </p>
    </td></tr>
    <tr><td style="background:#f8f6f3;padding:16px 32px;border-top:1px solid #e5e2dc;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9b9590;">© ${new Date().getFullYear()} Buildora Infrastructure & Living. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `
APPROVAL PENDING REVIEW — ${projectName}

Dear ${recipientName},

Your approval is requested for: ${approvalTitle}
Category: ${approvalType}
${dueDate ? `Due date: ${dueDate}` : ""}

Please review and sign off in your project workspace:
${link}

— The Buildora Team
`.trim();

  return sendEmail({ to: recipientEmail, subject, html, text });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
