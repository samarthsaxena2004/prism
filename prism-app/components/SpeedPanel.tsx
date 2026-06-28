"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  cerebrasMs: number;
  geminiMs: number | null;
  cerebrasDone: boolean;
}

export default function SpeedPanel({ cerebrasMs, geminiMs, cerebrasDone }: Props) {
  const [geminiLive, setGeminiLive] = useState(0);
  const geminiRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const geminiStart = useRef(Date.now());

  // Keep Gemini timer running after Cerebras finishes (if Gemini hasn't responded yet)
  useEffect(() => {
    if (cerebrasDone && geminiMs === null) {
      geminiStart.current = Date.now() - cerebrasMs;
      geminiRef.current = setInterval(() => {
        setGeminiLive(Date.now() - geminiStart.current);
      }, 100);
    }
    return () => {
      if (geminiRef.current) clearInterval(geminiRef.current);
    };
  }, [cerebrasDone, geminiMs, cerebrasMs]);

  const cerebrasS = (cerebrasMs / 1000).toFixed(1);
  const geminiS = geminiMs
    ? (geminiMs / 1000).toFixed(1)
    : (geminiLive / 1000).toFixed(1);
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
          <span className="text-[10px] font-mono font-bold text-[#8a94b8] tracking-widest">SINGLE AGENT — GPU</span>
          <span className="text-[9px] text-[#454e70] font-mono">~ 100 TPS</span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`font-mono text-3xl font-bold ${geminiFinished ? "text-[#8a94b8]" : "text-[#e8eaf6]"}`}>
            {geminiS}s
          </span>
          {!geminiFinished && (
            <span className="text-[#f59e0b] text-sm mb-1 animate-pulse">▌</span>
          )}
          {geminiFinished && <span className="text-[#8a94b8] text-sm mb-1">✓</span>}
        </div>
        <p className="text-[10px] text-[#454e70] mt-1">
          {geminiFinished ? "1 agent, extraction only" : "1 agent, still generating..."}
        </p>
      </div>
    </div>
  );
}
