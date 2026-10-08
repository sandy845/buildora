"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { validateLogin } from "@/lib/auth";
import { loginUser } from "@/lib/auth/server";
import { signInWithGoogle } from "@/lib/firebase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const emailParam = searchParams.get("email") || "";

  const [form, setForm] = useState({ email: emailParam, password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (emailParam && !form.email) {
      setForm((prev) => ({ ...prev, email: emailParam }));
    }
  }, [emailParam]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitState("idle");
    setServerError("");
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    setServerError("");
    setSubmitState("idle");

    try {
      const result = await signInWithGoogle({
        email: form.email.trim() || undefined,
      });
      if (!result.success) {
        setServerError(result.error || "Failed to sign in with Google.");
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
      setServerError("Google sign-in could not be completed. Please try again.");
      setSubmitState("error");
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitState("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitState("idle");
    setServerError("");

    try {
      const result = await loginUser(form);
      if (result.error) {
        setServerError(result.error);
        setSubmitState("error");
        return;
      }

      if (result.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    } catch {
      setServerError("Sign-in is temporarily unavailable. Please try again later.");
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-hidden bg-[#f8f6f0] px-4 py-16">
      {/* Blueprint Grid & Ambient Illumination */}
      <div className="tech-blueprint-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-[#c5a059]/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#e5c97d]/15 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-7 shadow-2xl shadow-[#c5a059]/10 sm:p-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a059]/35 bg-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
          Portal Access // Client &amp; Admin
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a0e14]">Log in to Buildora</h1>
        <p className="mt-2 text-sm text-[#625d57]">Enter your credentials to access your live project dashboard.</p>

        {isRegistered && (
          <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-50/80 p-4 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Account created successfully!</span>
            </div>
            <p className="mt-1 pl-6 text-[#625d57]">
              Please log in below with your credentials to access your dashboard.
            </p>
          </div>
        )}

        {/* Google Sign-in Button */}
        <div className="mt-7">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#e4dec8] bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#0a0e14] shadow-xs transition-all duration-300 hover:border-[#c5a059] hover:bg-[#faf7ee] hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
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
            <span>{isGoogleSubmitting ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="relative my-6 text-center text-xs uppercase tracking-wider text-[#625d57]">
            <span className="relative z-10 bg-[#fffdf8] px-3 font-mono text-[10px] text-[#625d57]/70">Or continue with email</span>
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-[#e4dec8]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <label className="block text-sm text-[#0a0e14]">
            <span className="mb-1.5 block font-medium">Email address</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded-xl border border-[#e4dec8] bg-white px-3.5 py-2.5 text-sm text-[#0a0e14] outline-none transition focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/15"
              placeholder="name@example.com"
            />
            {errors.email && <span className="mt-1.5 block text-xs text-red-600">{errors.email}</span>}
          </label>

          <label className="block text-sm text-[#0a0e14]">
            <span className="mb-1.5 block font-medium">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="w-full rounded-xl border border-[#e4dec8] bg-white px-3.5 py-2.5 pr-12 text-sm text-[#0a0e14] outline-none transition focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/15"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-3 inline-flex items-center text-[#625d57] hover:text-[#0a0e14]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  {showPassword ? (
                    <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.8 4.4 9.8 7a14 14 0 0 1-3.2 4.5M6.2 6.2C3.9 7.8 2.6 10.2 2.2 12c1 2.6 4.6 7 9.8 7 1 0 2-.2 2.9-.5" /></>
                  ) : (
                    <><path d="M2.2 12C3.2 9.4 6.8 5 12 5s8.8 4.4 9.8 7c-1 2.6-4.6 7-9.8 7s-8.8-4.4-9.8-7Z" /><circle cx="12" cy="12" r="2.5" /></>
                  )}
                </svg>
              </button>
            </div>
            {errors.password && <span className="mt-1.5 block text-xs text-red-600">{errors.password}</span>}
          </label>

          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#a98032] hover:underline">
              Forgot password?
            </Link>
          </div>

          {submitState === "error" && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
              {serverError || "Please fix the highlighted fields and try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#0a0e14] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0a0e14] hover:shadow-[#c5a059]/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Log in to Dashboard →"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#625d57]">
          Need a client account?{" "}
          <Link href="/auth/register" className="font-bold text-[#0a0e14] hover:text-[#a98032]">
            Create one here
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-[#f8f6f0]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
