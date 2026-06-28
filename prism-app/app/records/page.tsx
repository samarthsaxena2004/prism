"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import AnomalyBadge from "@/components/AnomalyBadge";

interface Record {
  id: string;
  patient_name: string;
  patient_id: string;
  consultant: string;
  session_count: number;
  critical_flags: number;
  warning_flags: number;
  overall_status: string;
  created_at: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/api/records`)
      .then((r) => r.json())
      .then(setRecords)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#06060f] text-[#e8eaf6]">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/8 bg-[#06060f]/90 backdrop-blur-md">
        <Link href="/" className="font-mono text-base font-bold tracking-[0.15em]">PRISM</Link>
        <Link href="/analyze" className="text-xs text-[#4ade80] hover:underline">⚡ New Analysis</Link>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-6">
        <h2 className="text-lg font-semibold mb-4">Digitized Records</h2>

        {loading && <p className="text-[#454e70] text-sm">Loading records...</p>}
        {error && <p className="text-red-400 text-sm">Error: {error}</p>}
        {!loading && !error && records.length === 0 && (
          <p className="text-[#454e70] text-sm">No records yet. <Link href="/analyze" className="text-[#4ade80] hover:underline">Run an analysis.</Link></p>
        )}

        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="border-white/8 bg-[#0e0f1a] p-4 hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[#e8eaf6]">{r.patient_name ?? "Unknown Patient"}</p>
                  <div className="flex gap-3 mt-1 text-xs text-[#8a94b8]">
                    {r.patient_id && <span>ID: {r.patient_id}</span>}
                    {r.consultant && <span>Dr. {r.consultant}</span>}
                    <span>{r.session_count} sessions</span>
                    <span className="text-[#454e70]">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AnomalyBadge severity={r.overall_status} />
                  {r.critical_flags > 0 && (
                    <span className="text-xs text-red-400 font-mono">{r.critical_flags} critical</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
