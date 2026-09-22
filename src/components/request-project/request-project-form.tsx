"use client";

import { useState } from "react";
import { submitContactLeadAction, type SubmitLeadState } from "@/lib/actions/leads";

type RequestProjectFormProps = {
  initialValues: {
    service: string;
    budget: string;
    location: string;
    message: string;
  };
};

const inputClassName = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/15";
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
      <div className="rounded-4xl border border-[#c5a059]/35 bg-[#fffdf8] p-8 shadow-xl shadow-primary/5 sm:p-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-[#e5c875]">✓</span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Brief received</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-primary">Your project is on our radar.</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Thank you for sharing the details. A Buildora specialist will contact you within one working day to understand the opportunity and suggest the right next step.</p>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-muted">Reference: {state.leadId?.split("-")[0].toUpperCase()}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-4xl border border-primary/10 bg-white p-6 shadow-xl shadow-primary/5 sm:p-9">
      <div className="border-b border-border pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">Your project brief</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-primary">Tell us where you are headed</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Fields marked with * help us prepare for a useful first conversation.</p>
      </div>
      {state.error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Your name *" name="fullName" value={values.fullName} error={state.fieldErrors?.fullName} onChange={updateField} placeholder="Aarav Mehta" />
        <Field label="Email address *" name="email" type="email" value={values.email} error={state.fieldErrors?.email} onChange={updateField} placeholder="you@example.com" />
        <Field label="Phone number *" name="phone" type="tel" value={values.phone} error={state.fieldErrors?.phone} onChange={updateField} placeholder="+91 98765 43210" />
        <Field label="Project location *" name="location" value={values.location} error={state.fieldErrors?.location} onChange={updateField} placeholder="City or neighbourhood" />
        <SelectField label="What do you need help with?" name="service" value={values.service} options={serviceOptions} onChange={updateField} placeholder="Select a service" />
        <SelectField label="Comfortable budget range" name="budget" value={values.budget} options={budgetOptions} onChange={updateField} placeholder="Select a range" />
        <label className="block text-sm text-primary sm:col-span-2">
          <span className="mb-2 block font-medium">Tell us about the project *</span>
          <textarea name="message" rows={6} value={values.message} onChange={(event) => updateField("message", event.target.value)} className={inputClassName} placeholder="What are you hoping to build, renovate, or transform?" />
          {state.fieldErrors?.message && <span className="mt-2 block text-xs text-red-600">{state.fieldErrors.message}</span>}
        </label>
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-[#c5a059] hover:text-primary disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? "Sending your brief..." : "Send project brief →"}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-muted">By submitting, you agree to be contacted about this project enquiry.</p>
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
