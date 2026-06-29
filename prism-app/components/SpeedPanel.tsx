"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  cerebrasMs: number;
  geminiMs: number | null;
  geminiFailed?: boolean;
  cerebrasTps?: number | null;
  geminiTps?: number | null;
  cerebrasDone: boolean;
}

export default function SpeedPanel({
  cerebrasMs,
  geminiMs,
  geminiFailed = false,
  cerebrasTps = null,
  geminiTps = null,
  cerebrasDone,
}: Props) {
  const [geminiLive, setGeminiLive] = useState(cerebrasMs);
  const geminiRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Calibrate to Cerebras start time on mount so the baseline timer measures
  // genuine wall-clock elapsed since the run started (both fired together).
  const [startedAt] = useState(() => Date.now() - cerebrasMs);

  const settled = geminiMs !== null || geminiFailed;

  // Tick the baseline timer (real elapsed) until its true result arrives.
  useEffect(() => {
    if (settled) return; // already have a real value or it failed
    geminiRef.current = setInterval(() => {
      setGeminiLive(Date.now() - startedAt);
    }, 100);
    return () => {
      if (geminiRef.current) clearInterval(geminiRef.current);
    };
  }, [settled, startedAt]);

  // Stop the interval the moment the baseline settles
  useEffect(() => {
    if (settled && geminiRef.current) {
      clearInterval(geminiRef.current);
      geminiRef.current = null;
    }
  }, [settled]);

  const cerebrasS = (cerebrasMs / 1000).toFixed(1);
  const geminiS = ((geminiMs ?? geminiLive) / 1000).toFixed(1);
  const geminiFinished = geminiMs !== null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Cerebras panel */}
      <div className="rounded-2xl border-2 border-success/30 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono font-bold text-success tracking-widest">PRISM ON CEREBRAS</span>
          <span className="text-[9px] text-success/70 font-mono">
            {cerebrasTps != null ? `⚡ ${cerebrasTps.toLocaleString()} tok/s measured` : "⚡ Cerebras"}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-3xl font-bold text-success">{cerebrasS}s</span>
          {cerebrasDone && <span className="text-success text-sm mb-1">✓</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {cerebrasDone ? "5 agents completed" : "5 agents running..."}
        </p>
      </div>

      {/* Gemini baseline panel */}
      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest">1 AGENT — GEMINI 2.5 FLASH</span>
          <span className="text-[9px] text-muted-foreground/70 font-mono">
            {geminiTps != null ? `${geminiTps.toLocaleString()} tok/s measured` : "Google hosted"}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`font-mono text-3xl font-bold ${settled ? "text-muted-foreground" : "text-foreground"}`}>
            {geminiFailed ? "—" : `${geminiS}s`}
          </span>
          {!settled && (
            <span className="text-processing text-sm mb-1 animate-pulse">▌</span>
          )}
          {geminiFinished && <span className="text-muted-foreground text-sm mb-1">✓</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {geminiFailed
            ? "baseline unavailable"
            : geminiFinished
            ? "1 agent, extraction only"
            : "1 agent, still generating..."}
        </p>
      </div>
    </div>
  );
}
