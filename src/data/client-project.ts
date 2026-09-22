export const clientProject = {
  id: "residence-01",
  name: "Residence 01",
  type: "Residential construction",
  location: "Your project location",
  status: "On track",
  statusDetail: "Last updated today",
  overallProgress: 72,
  startDate: "08 Jan 2026",
  targetDate: "18 Dec 2026",
  nextAction: {
    title: "Review material selection",
    description: "Confirm the proposed kitchen and bathroom finishes before procurement begins.",
    due: "Due 24 September 2026",
  },
  nextMilestone: {
    name: "Electrical & plumbing",
    progress: 72,
    date: "Expected 24 September 2026",
  },
  phases: [
    { name: "Planning & design", state: "complete" as const, progress: 100 },
    { name: "Structure", state: "complete" as const, progress: 100 },
    { name: "Electrical & plumbing", state: "current" as const, progress: 72 },
    { name: "Finishes & installation", state: "upcoming" as const, progress: 0 },
    { name: "Handover", state: "upcoming" as const, progress: 0 },
  ],
  timeline: [
    { date: "12 Sep", title: "Electrical rough-in started", detail: "Site team began the first fix across the residence.", state: "current" },
    { date: "05 Sep", title: "Structure completed", detail: "Structural works passed the scheduled quality review.", state: "complete" },
    { date: "18 Aug", title: "Material palette approved", detail: "Core flooring and wall finish direction confirmed.", state: "complete" },
    { date: "08 Jan", title: "Project started", detail: "Planning and design coordination began.", state: "complete" },
  ],
  designs: [
    { name: "Kitchen material palette", type: "Material board", status: "Awaiting approval" },
    { name: "Ground floor lighting plan", type: "Drawing set", status: "Approved" },
    { name: "Living room joinery", type: "3D visual", status: "Approved" },
  ],
  materials: [
    { name: "Kitchen surfaces", supplier: "Selected collection", status: "Review needed" },
    { name: "Bathroom fittings", supplier: "Selected collection", status: "Approved" },
    { name: "Flooring", supplier: "Selected collection", status: "Ordered" },
  ],
  approvals: [
    { title: "Kitchen material selection", detail: "Finish and hardware confirmation", due: "Due 24 Sep" },
    { title: "Bathroom fittings", detail: "Final fitting schedule", due: "Due 28 Sep" },
  ],
  documents: [
    { name: "Progress report · September", type: "PDF · 2.4 MB", date: "12 Sep 2026" },
    { name: "Electrical plan · Rev 02", type: "PDF · 1.1 MB", date: "05 Sep 2026" },
  ],
};

export type ClientProject = typeof clientProject;
