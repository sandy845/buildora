"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tighter text-primary">This page could not load.</h1>
        <button type="button" onClick={() => reset()} className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Try again</button>
      </div>
    </main>
  );
}
