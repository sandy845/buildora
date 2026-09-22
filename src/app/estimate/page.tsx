"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { calculateEstimate, formatCurrency, type EstimateFormValues, type EstimateResult } from "@/lib/cost-estimator";

const propertyOptions = ["Apartment", "Villa", "Commercial", "Duplex"];
const constructionOptions = ["RCC", "Load bearing", "Mixed"];
const interiorOptions = ["Basic", "Standard", "Premium", "Luxury"];
const locationOptions = ["Metro", "Tier 1", "Tier 2", "Rural"];
const qualityOptions = ["Standard", "Premium", "Luxury"];

const initialForm: EstimateFormValues = {
  propertyType: "",
  constructionType: "",
  area: "",
  floors: "",
  interior: "",
  location: "",
  quality: "",
};

export default function EstimatePage() {
  const [form, setForm] = useState<EstimateFormValues>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof EstimateFormValues, string>>>({});
  const [result, setResult] = useState<EstimateResult | null>(null);

  function updateField(field: keyof EstimateFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof EstimateFormValues, string>> = {};

    if (!form.propertyType) nextErrors.propertyType = "Please select a property type.";
    if (!form.constructionType) nextErrors.constructionType = "Please select a construction type.";
    if (!form.area) nextErrors.area = "Please enter the approximate area.";
    else if (Number(form.area) <= 0) nextErrors.area = "Area must be greater than zero.";
    if (!form.floors) nextErrors.floors = "Please select the number of floors.";
    else if (Number(form.floors) <= 0) nextErrors.floors = "Floors must be greater than zero.";
    else if (Number(form.floors) > 10) nextErrors.floors = "Floors must be 10 or fewer.";
    if (!form.interior) nextErrors.interior = "Please select an interior requirement.";
    if (!form.location) nextErrors.location = "Please select a location.";
    if (!form.quality) nextErrors.quality = "Please select a quality preference.";

    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      return;
    }

    setResult(calculateEstimate(form));
  }

  return (
    <>
      <Section className="relative isolate overflow-hidden bg-[#f3efe5] py-16 sm:py-24">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#c5a059]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#d9e2e3]/70 blur-3xl" />
        <Container>
          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5a059] shadow-[0_0_14px_#c5a059]" />
              Your Buildora project plan
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-primary sm:text-5xl">
              Start with a budget that feels as considered as your space.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Tell us a little about your home, villa, or commercial space. Buildora will shape a practical planning range around your priorities, finish level, and location.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <form onSubmit={handleSubmit} noValidate className="relative rounded-4xl border border-primary/10 bg-white p-5 shadow-xl shadow-primary/5 sm:p-7">
            <div className="mb-7 flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">Project snapshot</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-primary">Shape your brief</h2>
              </div>
              <span className="rounded-full bg-[#f3efe5] px-3 py-1 text-xs font-bold text-muted">2 min</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <label className="block text-sm text-primary">
                <span className="mb-2 block font-medium">Property type</span>
                <select
                  value={form.propertyType}
                  onChange={(event) => updateField("propertyType", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                >
                  <option value="">Select</option>
                  {propertyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.propertyType && <span className="mt-2 block text-xs text-red-600">{errors.propertyType}</span>}
              </label>

              <label className="block text-sm text-primary">
                <span className="mb-2 block font-medium">Construction type</span>
                <select
                  value={form.constructionType}
                  onChange={(event) => updateField("constructionType", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                >
                  <option value="">Select</option>
                  {constructionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.constructionType && <span className="mt-2 block text-xs text-red-600">{errors.constructionType}</span>}
              </label>

              <label className="block text-sm text-primary">
                <span className="mb-2 block font-medium">Approximate area (sq ft)</span>
                <input
                  type="number"
                  min="1"
                  value={form.area}
                  onChange={(event) => updateField("area", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                  placeholder="1200"
                />
                {errors.area && <span className="mt-2 block text-xs text-red-600">{errors.area}</span>}
              </label>

              <label className="block text-sm text-primary">
                <span className="mb-2 block font-medium">Number of floors</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.floors}
                  onChange={(event) => updateField("floors", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                  placeholder="2"
                />
                {errors.floors && <span className="mt-2 block text-xs text-red-600">{errors.floors}</span>}
              </label>

              <label className="block text-sm text-primary">
                <span className="mb-2 block font-medium">Interior requirement</span>
                <select
                  value={form.interior}
                  onChange={(event) => updateField("interior", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                >
                  <option value="">Select</option>
                  {interiorOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.interior && <span className="mt-2 block text-xs text-red-600">{errors.interior}</span>}
              </label>

              <label className="block text-sm text-primary">
                <span className="mb-2 block font-medium">Location</span>
                <select
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                >
                  <option value="">Select</option>
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.location && <span className="mt-2 block text-xs text-red-600">{errors.location}</span>}
              </label>

              <label className="block text-sm text-primary sm:col-span-2">
                <span className="mb-2 block font-medium">Quality preference</span>
                <select
                  value={form.quality}
                  onChange={(event) => updateField("quality", event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary"
                >
                  <option value="">Select</option>
                  {qualityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.quality && <span className="mt-2 block text-xs text-red-600">{errors.quality}</span>}
              </label>
            </div>

            <button
              type="submit"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-[#c5a059] hover:text-primary hover:shadow-[#c5a059]/25"
            >
              Calculate estimate
            </button>
          </form>

          <aside className="relative overflow-hidden rounded-4xl border border-[#c5a059]/30 bg-[#fffdf8] p-5 text-primary shadow-2xl shadow-[#c5a059]/10 sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#c5a059]/20 blur-3xl" />
            <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Your planning range</p>

            {result ? (
              <>
                <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-primary sm:text-4xl">
                  {formatCurrency(result.minimum)} – {formatCurrency(result.maximum)}
                </p>
                <p className="mt-3 text-sm text-muted">
                  A tailored starting point based on the way you want to build, finish, and use your space.
                </p>
                <div className="mt-5 rounded-2xl border border-border bg-[#f3efe5] p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Indicative rate per sq ft</p>
                  <p className="mt-2 text-xl font-semibold text-primary">{formatCurrency(result.perSqFt)}</p>
                </div>

                <div className="mt-5 rounded-2xl border border-[#c5a059]/40 bg-primary p-4 text-white sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e5c875]">Next Step</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">Turn this range into a real build plan</h3>
                  <p className="mt-2 text-xs leading-5 text-white/70">
                    Lock in your planning specifications and discuss architectural drawings, structural viability, and delivery timelines with our engineers.
                  </p>
                  <Link
                    href={`/request-project?service=${encodeURIComponent(form.propertyType ? `${form.propertyType} Construction` : "Complete Home Construction")}&budget=${encodeURIComponent(
                      result.maximum <= 2000000
                        ? "Under ₹20L"
                        : result.maximum <= 5000000
                        ? "₹20L – ₹50L"
                        : result.maximum <= 10000000
                        ? "₹50L – ₹1Cr"
                        : result.maximum <= 20000000
                        ? "₹1Cr – ₹2Cr"
                        : "₹2Cr+"
                    )}&location=${encodeURIComponent(form.location)}&brief=${encodeURIComponent(
                      `Planning Estimate Baseline:\n- Property: ${form.propertyType} (${form.constructionType})\n- Area: ${form.area} sq ft (${form.floors} floors)\n- Interior & Quality: ${form.interior} interior, ${form.quality} quality\n- Location Tier: ${form.location}\n- Calculated Budget Range: ${formatCurrency(result.minimum)} – ${formatCurrency(result.maximum)} (~${formatCurrency(result.perSqFt)}/sq ft)`
                    )}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary transition-all duration-300 hover:bg-amber-100 hover:shadow-lg"
                  >
                    Proceed with this Estimate →
                  </Link>
                </div>
              </>
            ) : (
              <div className="relative mt-6 rounded-2xl border border-dashed border-[#c5a059]/40 bg-[#f3efe5] p-6 text-sm leading-6 text-muted">
                Your estimate is built around your project, not a generic package. Complete the snapshot and we’ll calculate a Buildora planning range for your next conversation with our team.
              </div>
            )}
          </aside>
        </Container>
      </Section>
    </>
  );
}
