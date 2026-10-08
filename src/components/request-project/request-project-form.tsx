"use client";

import { useState } from "react";
import Link from "next/link";
import { submitContactLeadAction, type SubmitLeadState } from "@/lib/actions/leads";

type RequestProjectFormProps = {
  initialValues: {
    service: string;
    budget: string;
    location: string;
    message: string;
  };
};

const inputClassName = "w-full rounded-xl border border-[#e4dec8] bg-white px-4 py-3 text-sm text-[#0a0e14] outline-none transition focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/15 shadow-2xs";
const serviceOptions = [
  "Complete home construction",
  "Residential construction",
  "Interior design",
  "Home renovation",
  "Commercial construction",
  "Project planning",
];
const budgetOptions = ["Under ₹20L", "₹20L – ₹50L", "₹50L – ₹1Cr", "₹1Cr – ₹2Cr", "₹2Cr+"];

export function RequestProjectForm({ initialValues }: RequestProjectFormProps) {
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", ...initialValues });
  const [state, setState] = useState<SubmitLeadState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (state.fieldErrors?.[field]) {
      setState((current) => {
        const fieldErrors = { ...current.fieldErrors };
        delete fieldErrors[field];
        return { ...current, fieldErrors };
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setState({});
    const result = await submitContactLeadAction(values);
    setState(result);
    setIsSubmitting(false);
  }

  if (state.success) {
    return (
      <div className="rounded-3xl border border-[#c5a059]/50 bg-[#fffdf8] p-8 shadow-2xl shadow-[#c5a059]/10 sm:p-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0e14] font-mono text-xl font-bold text-[#e5c97d] shadow-lg">✓</span>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#c5a059]/40 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98032]">
          Brief Status // Verified Intake
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a0e14]">Your project is on our radar.</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#625d57]">Thank you for sharing your project specifications. A Buildora architectural consultant will connect within one working day to discuss feasibility, drawings, and next steps.</p>
        <div className="mt-7 inline-block rounded-xl border border-[#e4dec8] bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#a98032]">
          REFERENCE ID: {state.leadId?.split("-")[0].toUpperCase()}
        </div>
        <div className="mt-6">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-[#0a0e14] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#c5a059] hover:text-[#0a0e14]"
          >
            View on Dashboard →
          </Link>
        </div>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-2xl shadow-[#c5a059]/5 sm:p-9">
      <div className="border-b border-[#e4dec8] pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a059]/35 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98032]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
          Direct Brief // Intake Form
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0a0e14]">Tell us where you are headed</h2>
        <p className="mt-1.5 text-sm text-[#625d57]">Fields marked with * help us prepare a relevant architectural proposal.</p>
      </div>
      {state.error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{state.error}</p>}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Your name *" name="fullName" value={values.fullName} error={state.fieldErrors?.fullName} onChange={updateField} placeholder="Aarav Mehta" />
        <Field label="Email address *" name="email" type="email" value={values.email} error={state.fieldErrors?.email} onChange={updateField} placeholder="you@example.com" />
        <Field label="Phone number *" name="phone" type="tel" value={values.phone} error={state.fieldErrors?.phone} onChange={updateField} placeholder="+91 98765 43210" />
        <Field label="Project location *" name="location" value={values.location} error={state.fieldErrors?.location} onChange={updateField} placeholder="City or neighbourhood" />
        <SelectField label="What do you need help with?" name="service" value={values.service} options={serviceOptions} onChange={updateField} placeholder="Select a service" />
        <SelectField label="Comfortable budget range" name="budget" value={values.budget} options={budgetOptions} onChange={updateField} placeholder="Select a range" />
        <label className="block text-sm text-[#0a0e14] sm:col-span-2">
          <span className="mb-2 block font-medium">Tell us about the project *</span>
          <textarea name="message" rows={6} value={values.message} onChange={(event) => updateField("message", event.target.value)} className={inputClassName} placeholder="What are you hoping to build, renovate, or transform?" />
          {state.fieldErrors?.message && <span className="mt-2 block text-xs text-red-600">{state.fieldErrors.message}</span>}
        </label>
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#0a0e14] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0a0e14] hover:shadow-[#c5a059]/30 active:scale-95 disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? "Sending your brief..." : "Send Project Brief →"}
      </button>
      <p className="mt-4 text-center font-mono text-[11px] text-[#625d57]">Confidential · No sales spam · Responded within 1 business day</p>
    </form>
  );
}

function Field({ label, name, value, error, onChange, placeholder, type = "text" }: { label: string; name: keyof RequestProjectFormProps["initialValues"] | "fullName" | "email" | "phone"; value: string; error?: string; onChange: (field: keyof ReturnType<typeof getValues>, value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="block text-sm text-primary">
      <span className="mb-2 block font-medium">{label}</span>
      <input name={name} type={type} value={value} onChange={(event) => onChange(name, event.target.value)} className={inputClassName} placeholder={placeholder} />
      {error && <span className="mt-2 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({ label, name, value, options, onChange, placeholder }: { label: string; name: "service" | "budget"; value: string; options: string[]; onChange: (field: keyof ReturnType<typeof getValues>, value: string) => void; placeholder: string }) {
  return (
    <label className="block text-sm text-primary">
      <span className="mb-2 block font-medium">{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(name, event.target.value)} className={`${inputClassName} appearance-none`}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function getValues() {
  return { fullName: "", email: "", phone: "", service: "", budget: "", location: "", message: "" };
}
