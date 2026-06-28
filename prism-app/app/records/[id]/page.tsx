"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import AnomalyBadge from "@/components/AnomalyBadge";
import IntelBrief from "@/components/IntelBrief";

interface RecordDetail {
  record: {
    id: string;
    patient_name: string;
    patient_id: string;
    consultant: string;
    session_count: number;
    critical_flags: number;
    warning_flags: number;
    overall_status: string;
    structured_data: Record<string, unknown>;
    anomalies: unknown[];
    intelligence_brief: string;
    created_at: string;
  };
  agents: Array<{
    agent_name: string;
    content: Record<string, unknown>;
    processing_time_ms: number;
  }>;
}

export default function RecordDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/api/records/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setDetail)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#06060f] text-[#e8eaf6]">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/8 bg-[#06060f]/90 backdrop-blur-md">
        <Link href="/" className="font-mono text-base font-bold tracking-[0.15em]">PRISM</Link>
        <div className="flex items-center gap-4">
          <Link href="/records" className="text-xs text-[#454e70] hover:text-[#8a94b8] transition-colors">← Records</Link>
          <Link href="/analyze" className="text-xs text-[#4ade80] hover:underline">⚡ New Analysis</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-4">
        {loading && <p className="text-[#454e70] text-sm">Loading record...</p>}
        {error && <p className="text-red-400 text-sm">Error: {error}</p>}

        {detail && (
          <>
            {/* Patient header */}
            <Card className="border-white/8 bg-[#0e0f1a] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-mono text-[#454e70] tracking-widest uppercase mb-1">Patient Record</p>
                  <p className="text-xl font-semibold">{detail.record.patient_name ?? "Unknown"}</p>
                  <div className="flex gap-4 mt-1 text-xs text-[#8a94b8]">
                    {detail.record.patient_id && <span>ID: {detail.record.patient_id}</span>}
                    {detail.record.consultant && <span>Consultant: {detail.record.consultant}</span>}
                    <span>{detail.record.session_count} sessions</span>
                    <span className="text-[#454e70]">{new Date(detail.record.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <AnomalyBadge severity={detail.record.overall_status} />
              </div>
            </Card>

            {/* Intelligence brief */}
            {detail.record.intelligence_brief && (
              <Card className="border-[#f472b6]/20 bg-[#0e0f1a] p-4">
                <p className="text-[10px] font-mono font-bold text-[#f472b6] tracking-widest mb-3">INTELLIGENCE BRIEF — ECHO</p>
                <IntelBrief content={detail.record.intelligence_brief} />
              </Card>
            )}

            {/* Agent timing breakdown */}
            {detail.agents.length > 0 && (
              <Card className="border-white/8 bg-[#0e0f1a] p-4">
                <p className="text-[10px] font-mono text-[#454e70] tracking-widest uppercase mb-3">Agent Performance</p>
                <div className="space-y-2">
                  {detail.agents.map((a) => (
                    <div key={a.agent_name} className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#8a94b8] uppercase">{a.agent_name}</span>
                      <span className="text-[#454e70] font-mono">{(a.processing_time_ms / 1000).toFixed(2)}s</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
