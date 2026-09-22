"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateLogin } from "@/lib/auth";
import { loginUser } from "@/lib/auth/server";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitState("idle");
    setServerError("");
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

    const result = await loginUser(form);
    setIsSubmitting(false);
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
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-4xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Welcome back</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tighter text-primary">Log in</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <label className="block text-sm text-primary">
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
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-3 inline-flex items-center text-muted hover:text-primary"
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
            {errors.password && <span className="mt-2 block text-xs text-red-600">{errors.password}</span>}
          </label>

          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-muted">
              Forgot password?
            </Link>
          </div>

          {submitState === "error" && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError || "Please fix the highlighted fields and try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Need an account?{" "}
          <Link href="/auth/register" className="font-medium text-primary hover:text-muted">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
