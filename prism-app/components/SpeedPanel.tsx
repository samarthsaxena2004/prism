"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  cerebrasMs: number;
  geminiMs: number | null;
  geminiFailed?: boolean;
  cerebrasDone: boolean;
}

export default function SpeedPanel({ cerebrasMs, geminiMs, geminiFailed = false, cerebrasDone }: Props) {
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
      <div className="rounded-xl border border-[#4ade80]/30 bg-[#0e0f1a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono font-bold text-[#4ade80] tracking-widest">PRISM ON CEREBRAS</span>
          <span className="text-[9px] text-[#4ade80]/60 font-mono">⚡ 1,500 TPS</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-3xl font-bold text-[#4ade80]">{cerebrasS}s</span>
          {cerebrasDone && <span className="text-[#4ade80] text-sm mb-1">✓</span>}
        </div>
        <p className="text-[10px] text-[#454e70] mt-1">
          {cerebrasDone ? "5 agents completed" : "5 agents running..."}
        </p>
      </div>

      {/* Gemini baseline panel */}
      <div className="rounded-xl border border-white/8 bg-[#0e0f1a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono font-bold text-[#8a94b8] tracking-widest">1 AGENT — GPU BASELINE</span>
          <span className="text-[9px] text-[#454e70] font-mono">Gemini 2.5 Flash</span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`font-mono text-3xl font-bold ${settled ? "text-[#8a94b8]" : "text-[#e8eaf6]"}`}>
            {geminiFailed ? "—" : `${geminiS}s`}
          </span>
          {!settled && (
            <span className="text-[#f59e0b] text-sm mb-1 animate-pulse">▌</span>
          )}
          {geminiFinished && <span className="text-[#8a94b8] text-sm mb-1">✓</span>}
        </div>
        <p className="text-[10px] text-[#454e70] mt-1">
          {geminiFailed
            ? "baseline unavailable"
            : geminiFinished
            ? "measured · extraction only"
            : "still generating extraction..."}
        </p>
      </div>
    </div>
  );
}
