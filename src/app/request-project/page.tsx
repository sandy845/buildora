import type { Metadata } from "next";
import { RequestProjectForm } from "@/components/request-project/request-project-form";

export const metadata: Metadata = {
  title: "Request a project",
  description: "Share your project brief with Buildora and start a conversation with our team.",
};

type RequestProjectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function RequestProjectPage({ searchParams }: RequestProjectPageProps) {
  const params = await searchParams;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#f3efe5] py-16 sm:py-24">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#c5a059]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#d9e2e3]/70 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#c5a059] shadow-[0_0_14px_#c5a059]" />
              Buildora project intake
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-primary sm:text-6xl">
              Let’s shape the right project for your space.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              This is the next step after exploring an estimate. Share the context behind your build and our team will come back with a focused plan for the conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-0 sm:pb-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <aside className="relative h-fit overflow-hidden rounded-[2rem] border border-[#d9cba8] bg-[#fffdf8] p-7 text-primary shadow-xl shadow-[#c5a059]/10 sm:p-9 lg:sticky lg:top-28">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#e5c875]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-[#d9e2e3]/60 blur-3xl" />
            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">What happens next</p>
                <span className="h-px w-12 bg-[#c5a059]" aria-hidden="true" />
              </div>
              <h2 className="max-w-xs text-3xl font-semibold leading-[1.08] tracking-[-0.06em] text-primary">
                A considered start, not a sales pitch.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
                Every Buildora project begins with clarity, context, and a conversation.
              </p>
            <div className="relative mt-9 space-y-7">
              <div className="absolute bottom-5 left-[1.125rem] top-5 w-px bg-[#d9cba8]" aria-hidden="true" />
              {[
                ["01", "We review your brief", "Our team looks at your goals, property, and the level of support you need."],
                ["02", "We call within one working day", "We clarify the opportunity and answer early questions about scope and process."],
                ["03", "We map the right next step", "You get a practical direction: site visit, design discussion, or a detailed proposal."],
              ].map(([number, title, description]) => (
                <div key={number} className="relative flex gap-4">
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c5a059] bg-[#fffdf8] text-xs font-bold text-[#a98032] shadow-sm">{number}</span>
                  <div className="pt-0.5">
                    <h3 className="font-semibold text-primary">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-9 border-t border-[#e4dec8] pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a98032]">Buildora promise</p>
              <p className="mt-2 text-sm font-medium leading-6 text-primary">Thoughtful planning. Transparent decisions. Spaces built to last.</p>
            </div>
            </div>
          </aside>
          <RequestProjectForm
            initialValues={{
              service: getParam(params.service),
              budget: getParam(params.budget),
              location: getParam(params.location),
              message: getParam(params.brief),
            }}
          />
        </div>
      </section>
    </>
  );
}
