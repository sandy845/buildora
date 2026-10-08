export type DashboardNavItem = {
  label: string;
  href: string;
  icon: string;
  count?: number;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Overview", href: "/client/dashboard", icon: "grid" },
  { label: "My Projects", href: "/client/dashboard#projects", icon: "building" },
  { label: "Quotations", href: "/client/dashboard#quotations", icon: "file" },
  { label: "Documents", href: "/client/dashboard#documents", icon: "folder" },
  { label: "Payments", href: "/client/dashboard#payments", icon: "card" },
  { label: "Messages", href: "/client/dashboard#messages", icon: "message", count: 2 },
  { label: "Notifications", href: "/client/dashboard#notifications", icon: "bell", count: 3 },
  { label: "Settings", href: "/client/profile", icon: "settings" },
];

export const dashboardStats = [
  { label: "Active projects", value: "2", detail: "Across 2 locations", tone: "neutral" },
  { label: "Overall progress", value: "68%", detail: "+8% this month", tone: "positive" },
  { label: "Pending approvals", value: "3", detail: "Needs your review", tone: "attention" },
  { label: "Outstanding payment", value: "₹84,500", detail: "Due 18 Sep 2026", tone: "attention" },
] as const;

export const projects = [
  {
    name: "Residence 01",
    type: "Residential construction",
    location: "Your project location",
    progress: 72,
    milestone: "Electrical & plumbing",
    due: "Due 24 Sep",
    color: "bg-amber-500",
  },
  {
    name: "Studio renovation",
    type: "Interior renovation",
    location: "Your project location",
    progress: 64,
    milestone: "Cabinet installation",
    due: "Due 02 Oct",
    color: "bg-emerald-600",
  },
];

export const activity = [
  { title: "Site progress updated", detail: "Residence 01 · 2 hours ago", icon: "building", tone: "dark" },
  { title: "Quotation ready for review", detail: "Studio renovation · Yesterday", icon: "file", tone: "gold" },
  { title: "Payment milestone recorded", detail: "Residence 01 · 2 days ago", icon: "card", tone: "green" },
  { title: "New document uploaded", detail: "Studio renovation · 4 days ago", icon: "folder", tone: "slate" },
];
