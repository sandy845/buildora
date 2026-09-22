export const adminNavItems = [
  { label: "Overview", href: "/admin/dashboard", icon: "grid" },
  { label: "Users", href: "/admin/dashboard#users", icon: "users" },
  { label: "Leads", href: "/admin/dashboard#leads", icon: "target", count: 8 },
  { label: "Projects", href: "/admin/dashboard#projects", icon: "building" },
  { label: "Services", href: "/admin/dashboard#services", icon: "layers" },
  { label: "Portfolio", href: "/admin/dashboard#portfolio", icon: "image" },
  { label: "Quotations", href: "/admin/dashboard#quotations", icon: "file", count: 5 },
  { label: "Payments", href: "/admin/dashboard#payments", icon: "card" },
  { label: "Documents", href: "/admin/dashboard#documents", icon: "folder" },
  { label: "Reports", href: "/admin/dashboard#reports", icon: "chart" },
  { label: "Settings", href: "/admin/dashboard#settings", icon: "settings" },
];

export const adminStats = [
  { label: "Total projects", value: "24", detail: "+3 this quarter", tone: "neutral" },
  { label: "Active projects", value: "12", detail: "8 on track · 4 at risk", tone: "positive" },
  { label: "New leads", value: "18", detail: "Since last week", tone: "attention" },
  { label: "Pending quotations", value: "5", detail: "Awaiting follow-up", tone: "attention" },
];

export const adminProjects = [
  { name: "Residence 01", client: "Customer A", type: "Residential", progress: 72, status: "On track", updated: "Today" },
  { name: "Studio renovation", client: "Customer B", type: "Interior", progress: 64, status: "On track", updated: "Yesterday" },
  { name: "Courtyard build", client: "Customer C", type: "RCC", progress: 41, status: "At risk", updated: "2 days ago" },
  { name: "Office fit-out", client: "Customer D", type: "Commercial", progress: 88, status: "On track", updated: "4 days ago" },
];

export const adminLeads = [
  { name: "Prospective customer A", service: "Residential construction", source: "Website", status: "New", received: "Today" },
  { name: "Prospective customer B", service: "Interior design", source: "Referral", status: "Contacted", received: "Yesterday" },
  { name: "Prospective customer C", service: "Renovation", source: "Website", status: "New", received: "2 days ago" },
];

export const adminActivity = [
  { title: "New lead received", detail: "Residential construction · 18 min ago", icon: "target" },
  { title: "Quotation approved", detail: "Studio renovation · 1 hour ago", icon: "file" },
  { title: "Project status updated", detail: "Residence 01 · 3 hours ago", icon: "building" },
  { title: "Payment recorded", detail: "Office fit-out · Yesterday", icon: "card" },
];
