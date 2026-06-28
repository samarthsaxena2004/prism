"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AgentState = {
  status: "idle" | "active" | "done";
  statusMsg: string;
  content: string;
  ms?: number;
  tps?: number;
  ttft_ms?: number;
};

const AGENT_META: Record<string, { label: string; color: string; role: string }> = {
  sage:     { label: "SAGE",     color: "#4ade80", role: "Vision Extractor" },
  oracle:   { label: "ORACLE",   color: "#60a5fa", role: "Clinical Validator" },
  sentinel: { label: "SENTINEL", color: "#f59e0b", role: "Anomaly Detector" },
  compass:  { label: "COMPASS",  color: "#a78bfa", role: "Data Structurer" },
  echo:     { label: "ECHO",     color: "#f472b6", role: "Intelligence Brief" },
};

export default function AgentCard({
  name,
  state,
  fullWidth = false,
}: {
  name: string;
  state: AgentState;
  fullWidth?: boolean;
}) {
  const meta = AGENT_META[name] ?? { label: name.toUpperCase(), color: "#e8eaf6", role: "" };
  const { status, statusMsg, content, ms, tps, ttft_ms } = state;

  const borderColor =
    status === "idle"   ? "border-white/8"
    : status === "active" ? `border-[${meta.color}]/40`
    : "border-white/15";

  return (
    <Card
      className={`relative overflow-hidden rounded-xl border bg-[#0e0f1a] transition-all duration-300 ${borderColor} ${fullWidth ? "col-span-2" : ""}`}
      style={status === "active" ? { borderColor: `${meta.color}40` } : undefined}
    >
      {/* Active glow */}
      <AnimatePresence>
        {status === "active" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse at top left, ${meta.color}12 0%, transparent 60%)` }}
          />
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs font-bold tracking-widest"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-[10px] text-[#454e70] hidden sm:inline">{meta.role}</span>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
            )}
            {status === "done" && ms !== undefined && (
              <span className="font-mono text-[10px] text-[#8a94b8]">{(ms / 1000).toFixed(1)}s</span>
            )}
            {status === "done" && tps !== undefined && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-[#2a2d3e] text-[#60a5fa] px-1 py-0"
              >
                {tps.toLocaleString()} tok/s
              </Badge>
            )}
          </div>
        </div>

        {/* Status / content */}
        <div className="min-h-[48px]">
          {status === "idle" && (
            <p className="text-[11px] text-[#454e70] italic">Waiting...</p>
          )}
          {status === "active" && !content && (
            <p className="text-[11px] text-[#8a94b8]">{statusMsg}</p>
          )}
          {content && (
            <pre
              className="text-[11px] text-[#c4cae8] whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {content}
            </pre>
          )}
        </div>

        {/* Footer timing */}
        {status === "done" && ttft_ms !== undefined && (
          <p className="mt-2 text-[9px] text-[#454e70] font-mono">TTFT {ttft_ms}ms</p>
        )}
      </div>
    </Card>
  );
}
