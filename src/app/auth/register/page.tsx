"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateRegister } from "@/lib/auth";
import { registerUser, resendVerificationEmail } from "@/lib/auth/server";
import { signInWithGoogle } from "@/lib/firebase/client";

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {visible ? (
        <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.8 4.4 9.8 7a14 14 0 0 1-3.2 4.5M6.2 6.2C3.9 7.8 2.6 10.2 2.2 12c1 2.6 4.6 7 9.8 7 1 0 2-.2 2.9-.5" /></>
      ) : (
        <><path d="M2.2 12C3.2 9.4 6.8 5 12 5s8.8 4.4 9.8 7c-1 2.6-4.6 7-9.8 7s-8.8-4.4-9.8-7Z" /><circle cx="12" cy="12" r="2.5" /></>
      )}
    </svg>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [resendState, setResendState] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitState("idle");
    setServerError("");
  }

  async function handleGoogleSignUp() {
    setIsGoogleSubmitting(true);
    setServerError("");
    setSubmitState("idle");

    try {
      const result = await signInWithGoogle({
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      if (!result.success) {
        setServerError(result.error || "Failed to sign up with Google.");
        setSubmitState("error");
        return;
      }

      const role = (result.user as { role?: string })?.role;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    } catch {
      setServerError("Google sign-up could not be completed. Please try again.");
      setSubmitState("error");
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegister(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitState("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitState("idle");
    setServerError("");

    try {
      const result = await registerUser(form);
      if (result.error) {
        setServerError(result.error);
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
      const userEmail = form.email.trim();
      const userName = form.name.trim();
      if (typeof window !== "undefined") {
        localStorage.setItem("buildora_last_registered_email", userEmail);
        localStorage.setItem("buildora_last_registered_name", userName);
        localStorage.setItem("buildora_dev_google_email", userEmail);
        localStorage.setItem("buildora_dev_google_name", userName);
      }
      router.push(`/auth/login?registered=true${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""}`);
    } catch {
      setServerError("Registration is temporarily unavailable. Please try again later.");
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    setIsSubmitting(true);
    setResendState("");
    try {
      const result = await resendVerificationEmail(form.email);
      setResendState(result.error || "Verification email sent. Check your inbox.");
    } catch {
      setResendState("Could not send the verification email. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-4xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Create account</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tighter text-primary">Register</h1>

        {/* Google Sign-up Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleSubmitting || isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-white px-4 py-3 text-sm font-medium text-primary shadow-xs transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleSubmitting ? "Connecting to Google..." : "Sign up with Google"}</span>
          </button>

          <div className="relative my-6 text-center text-xs uppercase tracking-wider text-muted">
            <span className="relative z-10 bg-white px-3">Or register with email</span>
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border" />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-primary">
              <span className="mb-2 block font-medium">Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                placeholder="Your full name"
              />
              {errors.name && <span className="mt-2 block text-xs text-red-600">{errors.name}</span>}
            </label>

            <label className="block text-sm text-primary">
              <span className="mb-2 block font-medium">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                placeholder="+91 00000 00000"
              />
              {errors.phone && <span className="mt-2 block text-xs text-red-600">{errors.phone}</span>}
            </label>

            <label className="block text-sm text-primary sm:col-span-2">
              <span className="mb-2 block font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                placeholder="name@example.com"
              />
              {errors.email && <span className="mt-2 block text-xs text-red-600">{errors.email}</span>}
            </label>

            <label className="block text-sm text-primary">
              <span className="mb-2 block font-medium">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-12 text-sm text-primary outline-none transition focus:border-primary"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 inline-flex items-center text-muted hover:text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>
                  <PasswordVisibilityIcon visible={showPassword} />
                </button>
              </div>
              {errors.password && <span className="mt-2 block text-xs text-red-600">{errors.password}</span>}
            </label>

            <label className="block text-sm text-primary">
              <span className="mb-2 block font-medium">Confirm password</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-12 text-sm text-primary outline-none transition focus:border-primary"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute inset-y-0 right-3 inline-flex items-center text-muted hover:text-primary" aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}>
                  <PasswordVisibilityIcon visible={showConfirmPassword} />
                </button>
              </div>
              {errors.confirmPassword && <span className="mt-2 block text-xs text-red-600">{errors.confirmPassword}</span>}
            </label>
          </div>

          {submitState === "error" && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError || "Please correct the highlighted fields and try again."}
            </p>
          )}

          {submitState === "error" && form.email.includes("@") && (
            <button type="button" onClick={() => void handleResendVerification()} disabled={isSubmitting} className="w-full rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary disabled:opacity-60">
              {isSubmitting ? "Sending verification email..." : "Resend verification email"}
            </button>
          )}

          {resendState && (
            <p className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary">
              {resendState}
            </p>
          )}

          {submitState === "success" && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Account created successfully! Redirecting to login...
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || submitState === "success"}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : submitState === "success" ? "Redirecting to login..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:text-muted">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
