"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateVerify } from "@/lib/auth";
import {
  sendFirebaseVerificationEmailToCurrentUser,
  syncCurrentFirebaseSession,
} from "@/lib/firebase/client";

function VerifyForm() {
  const searchParams = useSearchParams();
  const firebaseFlow = searchParams.get("provider") === "firebase";
  const firebaseVerified = searchParams.get("verified") === "1";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!firebaseFlow || !firebaseVerified) return;
    void syncCurrentFirebaseSession().then((result) => {
      if (result.success) {
        setMessage("Email verified. Your account is ready.");
      } else if (result.error) {
        setMessage(`${result.error} You can still log in to finish syncing your account.`);
      }
    });
  }, [firebaseFlow, firebaseVerified]);

  async function resendFirebaseVerification() {
    setIsSubmitting(true);
    setError("");
    const result = await sendFirebaseVerificationEmailToCurrentUser();
    if (result.success) {
      setMessage("Verification link sent. Check your inbox.");
    } else {
      setError(result.error || "Could not resend the verification link.");
    }
    setIsSubmitting(false);
  }

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

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp }),
      });
      if (response.ok) {
        setStatus("success");
      } else {
        const result = await response.json().catch(() => ({})) as { error?: string };
        setError(result.error || "That code is invalid or expired.");
        setStatus("error");
      }
    } catch {
      setError("Verification is temporarily unavailable. Please try again later.");
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-4xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Email verification</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tighter text-primary">Verify account</h1>

        <p className="mt-4 text-sm text-muted">
          {firebaseFlow
            ? "Use the verification link Firebase sent to your email. After verification, return here or log in."
            : "Enter the six-digit code sent to your email to complete verification."}
        </p>

        {!firebaseFlow && <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
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
              Verification complete. You can now log in.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Verifying..." : "Verify code"}
          </button>
        </form>}

        {firebaseFlow && (
          <div className="mt-6 space-y-4">
            <p className={`rounded-xl border px-3 py-2 text-sm ${firebaseVerified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {message || (firebaseVerified
                ? "Firebase has confirmed your email. You can now log in."
                : "Check your inbox and click Firebase’s verification link to finish.")}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => void resendFirebaseVerification()}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary disabled:opacity-70"
            >
              {isSubmitting ? "Sending..." : "Resend verification link"}
            </button>
          </div>
        )}

        {!firebaseFlow && (
          <p className="mt-6 text-center text-sm text-muted">Need another code? Return to registration and choose “Resend verification email”.</p>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
