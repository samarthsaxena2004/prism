"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import UploadZone from "./UploadZone";
import AgentCard from "./AgentCard";
import SpeedPanel from "./SpeedPanel";
import StructuredTable from "./StructuredTable";

type AgentName = "sage" | "oracle" | "sentinel" | "compass" | "echo";
const AGENT_ORDER: AgentName[] = ["sage", "oracle", "sentinel", "compass", "echo"];

type AgentState = {
  status: "idle" | "active" | "done";
  statusMsg: string;
  content: string;
  ms?: number;
  tps?: number;
  ttft_ms?: number;
};

const IDLE_AGENT = (): AgentState => ({ status: "idle", statusMsg: "Waiting...", content: "" });

const INITIAL_AGENTS = (): Record<AgentName, AgentState> =>
  Object.fromEntries(AGENT_ORDER.map((n) => [n, IDLE_AGENT()])) as Record<AgentName, AgentState>;

export default function InvestigationRoom() {
  const [image, setImage]         = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [running, setRunning]     = useState(false);
  const [done, setDone]           = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [geminiMs, setGeminiMs]   = useState<number | null>(null);
  const [docId, setDocId]         = useState<string | null>(null);
  const [agents, setAgents]       = useState<Record<AgentName, AgentState>>(INITIAL_AGENTS());

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef(0);
  const abortRef  = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setAgents(INITIAL_AGENTS());
    setElapsedMs(0);
    setGeminiMs(null);
    setRunning(false);
    setDone(false);
    setDocId(null);
  }, []);

  const analyze = useCallback(async () => {
    if (!image || running) return;
    reset();

    // Small tick to let reset flush before re-running
    await new Promise((r) => setTimeout(r, 50));

    setRunning(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 100);

    abortRef.current = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_b64: image, facility_name: "Demo Facility" }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));

            if (ev.type === "status" && ev.agent) {
              setAgents((p) => ({
                ...p,
                [ev.agent]: { status: "active", statusMsg: ev.content, content: "" },
              }));
            } else if (ev.type === "streaming" && ev.agent) {
              setAgents((p) => ({
                ...p,
                [ev.agent]: { ...p[ev.agent as AgentName], status: "active", content: p[ev.agent as AgentName].content + ev.content },
              }));
            } else if (ev.type === "done" && ev.agent) {
              setAgents((p) => ({
                ...p,
                [ev.agent]: {
                  ...p[ev.agent as AgentName],
                  status: "done",
                  ms: ev.ms,
                  tps: ev.tps,
                  ttft_ms: ev.ttft_ms,
                },
              }));
            } else if (ev.type === "timing" && ev.agent) {
              setAgents((p) => ({
                ...p,
                [ev.agent]: { ...p[ev.agent as AgentName], tps: ev.tps, ttft_ms: ev.ttft_ms },
              }));
            } else if (ev.type === "speed_data") {
              if (ev.gemini_ms) setGeminiMs(ev.gemini_ms);
            } else if (ev.type === "complete") {
              setDocId(ev.doc_id ?? null);
            }
          } catch { /* malformed event — skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") console.error(err);
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
      setDone(true);
      setElapsedMs(Date.now() - startRef.current);
    }
  }, [image, running, reset]);

  // Cleanup on unmount
  useEffect(() => () => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const doneCount = AGENT_ORDER.filter((n) => agents[n].status === "done").length;

  return (
    <div className="min-h-screen bg-[#06060f] text-[#e8eaf6] font-sans">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/8 bg-[#06060f]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <a href="/" className="font-mono text-base font-bold tracking-[0.15em] text-[#e8eaf6]">PRISM</a>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px] font-mono border">
            ⚡ Cerebras 1,500 TPS
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#454e70] font-mono">{doneCount}/5 agents</span>
          {(running || done) && (
            <span className={`font-mono text-sm font-bold ${done ? "text-green-400" : "text-[#e8eaf6]"}`}>
              {(elapsedMs / 1000).toFixed(1)}s{done ? " ✓" : ""}
            </span>
          )}
          <a href="/records" className="text-xs text-[#454e70] hover:text-[#8a94b8] transition-colors">Records</a>
          {done && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="text-[#8a94b8] border-white/15 h-7 text-xs hover:text-[#e8eaf6]"
            >
              Reset
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-6 space-y-4">
        {/* Upload */}
        <UploadZone
          image={image}
          imageName={imageName}
          running={running}
          onFile={(b64, name) => { setImage(b64); setImageName(name); }}
          onAnalyze={analyze}
          onClear={reset}
        />

        {/* Agent grid (2×2 for first 4 agents) */}
        <AnimatePresence>
          {(running || done || doneCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {(["sage", "oracle", "sentinel", "compass"] as AgentName[]).map((n) => (
                <AgentCard key={n} name={n} state={agents[n]} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Echo — full width */}
        <AnimatePresence>
          {(agents.echo.status !== "idle") && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <AgentCard name="echo" state={agents.echo} fullWidth />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speed comparison */}
        <AnimatePresence>
          {(running || done) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SpeedPanel
                cerebrasMs={elapsedMs}
                geminiMs={geminiMs}
                cerebrasDone={done}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Structured output — appears after completion */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StructuredTable
                docId={docId ?? ""}
                compassContent={agents.compass.content}
                echoContent={agents.echo.content}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
