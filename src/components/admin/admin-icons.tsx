import { DashboardIcon } from "@/components/client/dashboard-icons";

type AdminIconProps = { name: string; className?: string };

export function AdminIcon({ name, className = "h-5 w-5" }: AdminIconProps) {
  if (["grid", "building", "file", "folder", "card", "settings"].includes(name)) {
    return <DashboardIcon name={name} className={className} />;
  }

  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "users": return <svg viewBox="0 0 24 24" {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 0 0 0-6M16 14.5a4 4 0 0 1 4 4V20" /></svg>;
    case "target": return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v2M22 12h-2M12 20v2M4 12H2" /></svg>;
    case "layers": return <svg viewBox="0 0 24 24" {...common}><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" /></svg>;
    case "image": return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-4-4L7 20" /></svg>;
    case "chart": return <svg viewBox="0 0 24 24" {...common}><path d="M4 19V5M4 19h17M8 16v-4M12 16V8M16 16v-6M20 16v-9" /></svg>;
    default: return <DashboardIcon name="grid" className={className} />;
  }
}
