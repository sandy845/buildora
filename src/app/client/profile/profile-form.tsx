"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  email: string;
};

export function ClientProfileForm({ name: initialName, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json().catch(() => ({})) as {
        error?: string;
        account?: { name?: string };
      };

      if (!response.ok) {
        setStatus({ type: "error", message: result.error || "We could not save your profile. Please try again." });
        return;
      }

      const savedName = result.account?.name || name.trim();
      setName(savedName);
      setStatus({ type: "success", message: "Profile saved! Redirecting to dashboard…" });

      // Hard navigation forces a full server re-render so the updated name is read fresh from DB
      setTimeout(() => {
        window.location.href = "/client/dashboard";
      }, 1200);
    } catch {
      setStatus({ type: "error", message: "Unable to reach Buildora. Check your connection and try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={saveProfile} className="space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-lg font-semibold">Profile details</h2>
        <p className="mt-1 text-sm text-muted">Your name is visible to the Buildora team working on your project.</p>
      </div>

      <label className="block max-w-xl">
        <span className="text-sm font-semibold">Full name</span>
        <input
          required
          minLength={2}
          maxLength={160}
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setStatus(null);
          }}
          className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-[#c5a059] focus:ring-2 focus:ring-[#e5c875]/40"
        />
      </label>

      <div className="max-w-xl">
        <span className="text-sm font-semibold">Sign-in email</span>
        <div className="mt-2 rounded-xl border border-border bg-[#f8f6f0] px-4 py-3 text-sm text-muted">{email}</div>
        <p className="mt-2 text-xs leading-5 text-muted">Email is managed by your sign-in provider and can’t be changed from this profile page.</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSaving || name.trim().length < 2}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#c5a059] px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-[#b58e43] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        {status && (
          <p role={status.type === "error" ? "alert" : "status"} className={`text-sm ${status.type === "error" ? "text-red-700" : "text-emerald-700"}`}>
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
