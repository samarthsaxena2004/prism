"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import AnomalyBadge from "./AnomalyBadge";
import IntelBrief from "./IntelBrief";

interface Props {
  docId: string;
  compassContent: string; // raw streamed text from Compass agent
  echoContent: string;    // raw streamed text from Echo agent
}

interface Session {
  session_num?: string | number;
  date?: string;
  status?: string;
  measurements?: Record<string, unknown>;
  technician?: string;
  flags?: unknown[];
}

interface StructuredData {
  patient?: {
    name?: string;
    id?: string;
    age?: string;
    sex?: string;
    consultant?: string;
  };
  sessions?: Session[];
  summary?: {
    total_sessions?: number;
    overall_status?: string;
    date_range?: string;
    critical?: number;
    needs_attention?: number;
    normal?: number;
  };
}

function tryParseCompass(text: string): StructuredData | null {
  try {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}") + 1;
    if (s >= 0) return JSON.parse(text.slice(s, e));
  } catch {
    // ignore
  }
  return null;
}

export default function StructuredTable({ compassContent, echoContent }: Props) {
  const [data, setData] = useState<StructuredData | null>(null);

  useEffect(() => {
    const parsed = tryParseCompass(compassContent);
    if (parsed) setData(parsed);
  }, [compassContent]);

  if (!data) return null;

  const { patient, sessions, summary } = data;

  return (
    <div className="space-y-3">
      {/* Patient header */}
      {patient && (
        <Card className="border-white/8 bg-[#0e0f1a] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#454e70] uppercase tracking-widest font-mono mb-1">Patient Record</p>
              <p className="text-lg font-semibold text-[#e8eaf6]">{patient.name ?? "Unknown"}</p>
              <div className="flex gap-4 mt-1 text-xs text-[#8a94b8]">
                {patient.id && <span>ID: {patient.id}</span>}
                {patient.age && <span>Age: {patient.age}</span>}
                {patient.sex && <span>{patient.sex}</span>}
                {patient.consultant && <span>Consultant: {patient.consultant}</span>}
              </div>
            </div>
            {summary?.overall_status && (
              <AnomalyBadge severity={summary.overall_status} />
            )}
          </div>
          {summary && (
            <div className="flex gap-6 mt-3 text-xs">
              <span className="text-[#454e70]">{summary.total_sessions ?? 0} sessions</span>
              {summary.date_range && <span className="text-[#454e70]">{summary.date_range}</span>}
              {!!summary.critical && <span className="text-red-400">{summary.critical} critical</span>}
              {!!summary.needs_attention && <span className="text-amber-400">{summary.needs_attention} need attention</span>}
              {!!summary.normal && <span className="text-green-400">{summary.normal} normal</span>}
            </div>
          )}
        </Card>
      )}

      {/* Sessions table */}
      {sessions && sessions.length > 0 && (
        <Card className="border-white/8 bg-[#0e0f1a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 text-[#454e70] font-mono text-[10px] uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Session</th>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Pre Wt</th>
                  <th className="text-left px-4 py-2">Post Wt</th>
                  <th className="text-left px-4 py-2">BP Pre</th>
                  <th className="text-left px-4 py-2">BP Mid</th>
                  <th className="text-left px-4 py-2">BP Post</th>
                  <th className="text-left px-4 py-2">Duration</th>
                  <th className="text-left px-4 py-2">Tech</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const m = s.measurements ?? {};
                  return (
                    <tr key={i} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-2 font-mono text-[#e8eaf6]">{s.session_num ?? i + 1}</td>
                      <td className="px-4 py-2 text-[#8a94b8]">{s.date ?? "—"}</td>
                      <td className="px-4 py-2">
                        <AnomalyBadge severity={s.status ?? "NORMAL"} />
                      </td>
                      <td className="px-4 py-2 text-[#c4cae8]">{String(m.pre_weight_kg ?? "—")}</td>
                      <td className="px-4 py-2 text-[#c4cae8]">{String(m.post_weight_kg ?? "—")}</td>
                      <td className="px-4 py-2 text-[#c4cae8]">{String(m.bp_pre ?? "—")}</td>
                      <td className="px-4 py-2 text-[#c4cae8]">{String(m.bp_mid ?? "—")}</td>
                      <td className="px-4 py-2 text-[#c4cae8]">{String(m.bp_post ?? "—")}</td>
                      <td className="px-4 py-2 text-[#c4cae8]">{String(m.duration_hrs ?? "—")}h</td>
                      <td className="px-4 py-2 text-[#8a94b8]">{s.technician ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Echo intelligence brief */}
      {echoContent && (
        <Card className="border-[#f472b6]/20 bg-[#0e0f1a] p-4">
          <p className="text-[10px] font-mono font-bold text-[#f472b6] tracking-widest mb-3">INTELLIGENCE BRIEF — ECHO</p>
          <IntelBrief content={echoContent} />
        </Card>
      )}
    </div>
  );
}
