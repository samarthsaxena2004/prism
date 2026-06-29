"use client";

const CONFIG = {
  CRITICAL:        { label: "CRITICAL",        bg: "bg-destructive/15",    text: "text-destructive",    border: "border-destructive/30" },
  NEEDS_ATTENTION: { label: "NEEDS ATTENTION", bg: "bg-warning/15",  text: "text-warning",  border: "border-warning/30" },
  WARNING:         { label: "WARNING",          bg: "bg-warning/15",  text: "text-warning",  border: "border-warning/30" },
  NOTE:            { label: "NOTE",             bg: "bg-muted/50",   text: "text-muted-foreground",   border: "border-border" },
  NORMAL:          { label: "NORMAL",           bg: "bg-success/15",  text: "text-success",  border: "border-success/30" },
  HIGH:            { label: "HIGH",             bg: "bg-destructive/15",    text: "text-destructive",    border: "border-destructive/30" },
  MEDIUM:          { label: "MEDIUM",           bg: "bg-warning/15",  text: "text-warning",  border: "border-warning/30" },
  LOW:             { label: "LOW",              bg: "bg-success/15",  text: "text-success",  border: "border-success/30" },
};

export default function AnomalyBadge({ severity }: { severity: string }) {
  const cfg = CONFIG[severity as keyof typeof CONFIG] ?? CONFIG.NOTE;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}
