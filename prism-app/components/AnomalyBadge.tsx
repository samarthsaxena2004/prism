"use client";

const CONFIG = {
  CRITICAL:        { label: "CRITICAL",        bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/30" },
  NEEDS_ATTENTION: { label: "NEEDS ATTENTION", bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30" },
  WARNING:         { label: "WARNING",          bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30" },
  NOTE:            { label: "NOTE",             bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
  NORMAL:          { label: "NORMAL",           bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
  HIGH:            { label: "HIGH",             bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/30" },
  MEDIUM:          { label: "MEDIUM",           bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30" },
  LOW:             { label: "LOW",              bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
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
