type DashboardIconProps = { name: string; className?: string };

export function DashboardIcon({ name, className = "h-5 w-5" }: DashboardIconProps) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "building":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 20V6l8-3 8 3v14M8 9h.01M8 13h.01M8 17h.01M12 9h.01M12 13h.01M12 17h.01M16 13h.01M16 17h.01M3 20h18" /></svg>;
    case "file":
      return <svg viewBox="0 0 24 24" {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>;
    case "folder":
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" /></svg>;
    case "card":
      return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></svg>;
    case "message":
      return <svg viewBox="0 0 24 24" {...common}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 19l1-3.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
    case "bell":
      return <svg viewBox="0 0 24 24" {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "chart":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 19V5M4 19h17M8 15l3-4 3 2 5-6" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
    case "settings":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 1 1-4 0v-.1a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 3.6 11H3a2 2 0 1 1 0-4h.6a2 2 0 0 0 1.4-3.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 11 2.4V2a2 2 0 1 1 4 0v.6a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.6 11h.4a2 2 0 1 1 0 4h-.6a2 2 0 0 0-1 0Z" /></svg>;
    case "grid":
    default:
      return <svg viewBox="0 0 24 24" {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  }
}
