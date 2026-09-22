"use client";

import Link from "next/link";
import { useState } from "react";
import { validateVerify } from "@/lib/auth";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateVerify({ otp });

    if (nextErrors.otp) {
      setError(nextErrors.otp);
      setStatus("error");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");

    await new Promise((resolve) => setTimeout(resolve, 900));

    setIsSubmitting(false);
    setStatus("success");
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-4xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Email verification</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tighter text-primary">Verify account</h1>

        <p className="mt-4 text-sm text-muted">
          Enter the six-digit code sent to your email to complete the demo setup.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <label className="block text-sm text-primary">
            <span className="mb-2 block font-medium">Verification code</span>
            <input
              inputMode="numeric"
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value);
                setError("");
                setStatus("idle");
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
              placeholder="123456"
            />
            {error && <span className="mt-2 block text-xs text-red-600">{error}</span>}
          </label>

          {status === "success" && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Verification complete. This is a mock frontend-only flow.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Verifying..." : "Verify code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Need another code?{" "}
          <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-muted">
            Resend
          </Link>
        </p>
      </div>
    </main>
  );
}
