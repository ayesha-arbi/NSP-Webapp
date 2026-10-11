type PillStatus =
  | "verified" | "active" | "completed"
  | "tampered" | "needs-attention"
  | "revoked"
  | "draft"
  | "submitted" | "in-review"
  | "in-progress"
  | "try-again-shortly";

const CONFIG: Record<PillStatus, {
  bg: string; text: string; iconColor: string; label: string; iconType: string;
}> = {
  verified:            { bg: "#DCE7E3", text: "#2F5C4E", iconColor: "#4C7A6E", label: "Verified",           iconType: "check-solid" },
  active:              { bg: "#DCE7E3", text: "#2F5C4E", iconColor: "#4C7A6E", label: "Active",             iconType: "check-solid" },
  completed:           { bg: "#DCE7E3", text: "#2F5C4E", iconColor: "#4C7A6E", label: "Completed",          iconType: "check-solid" },
  tampered:            { bg: "#EFE3C9", text: "#9C6B1F", iconColor: "#B08D46", label: "Tampered",           iconType: "warn-solid" },
  "needs-attention":   { bg: "#EFE3C9", text: "#9C6B1F", iconColor: "#B08D46", label: "Needs Attention",   iconType: "warn-solid" },
  revoked:             { bg: "#EBDAD8", text: "#8C3B34", iconColor: "#A6453D", label: "Revoked",            iconType: "x-solid" },
  draft:               { bg: "#E4E2D9", text: "#5C5A50", iconColor: "#8C897C", label: "Draft",              iconType: "dash-circle" },
  submitted:           { bg: "#F1E7D2", text: "#8C6F35", iconColor: "#B08D46", label: "Submitted",          iconType: "partial-75" },
  "in-review":         { bg: "#F1E7D2", text: "#8C6F35", iconColor: "#B08D46", label: "In Review",          iconType: "partial-75" },
  "in-progress":       { bg: "#F1E7D2", text: "#8C6F35", iconColor: "#B08D46", label: "In Progress",        iconType: "partial-40" },
  "try-again-shortly": { bg: "#E4E2D9", text: "#5C5A50", iconColor: "#8C897C", label: "Try Again Shortly",  iconType: "clock" },
};

function PillIcon({ iconType, iconColor }: { iconType: string; iconColor: string }) {
  if (iconType === "check-solid") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={iconColor} />
      <path d="M6 10l2.5 2.5L14 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (iconType === "x-solid") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={iconColor} />
      <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (iconType === "warn-solid") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={iconColor} />
      <path d="M10 7v4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1" fill="white" />
    </svg>
  );
  if (iconType === "dash-circle") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={iconColor} strokeWidth="1.8" strokeDasharray="3.5 2.5" />
    </svg>
  );
  if (iconType === "partial-75") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={iconColor} opacity="0.2" />
      {/* 75% filled pie: top → clockwise 270° → left */}
      <path d="M10 10 L10 1 A9 9 0 1 1 1 10 Z" fill={iconColor} />
    </svg>
  );
  if (iconType === "partial-40") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill={iconColor} opacity="0.2" />
      {/* 40% filled pie: top → clockwise 144° → (15.29, 17.28) */}
      <path d="M10 10 L10 1 A9 9 0 0 1 15.29 17.28 Z" fill={iconColor} />
    </svg>
  );
  if (iconType === "clock") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={iconColor} strokeWidth="1.8" />
      <path d="M10 6v4.5l2.5 1.5" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return null;
}

export default function StatusPill({ status }: { status: PillStatus }) {
  // Unknown/future statuses (e.g. MINTED) must not crash: fall back to a neutral pill.
  const c = CONFIG[status] ?? { ...CONFIG.draft, label: String(status) };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: c.bg, borderRadius: 999,
      height: 32, padding: "0 12px",
      fontSize: 14, fontWeight: 600, color: c.text,
      whiteSpace: "nowrap",
    }}>
      <PillIcon iconType={c.iconType} iconColor={c.iconColor} />
      {c.label}
    </span>
  );
}
