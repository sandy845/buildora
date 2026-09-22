"use client";

import Link from "next/link";
import { useState } from "react";
import { validateRegister } from "@/lib/auth";
import { registerUser } from "@/lib/auth/server";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
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
    const nextErrors = validateRegister(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitState("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitState("idle");
    setServerError("");

    const result = await registerUser(form);
    setIsSubmitting(false);
    if (result.error) {
      setServerError(result.error);
      setSubmitState("error");
      return;
    }

    setSubmitState("success");
  }

  return (
    <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-4xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Create account</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tighter text-primary">Register</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
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

          {submitState === "success" && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Account created. You can now log in.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
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
