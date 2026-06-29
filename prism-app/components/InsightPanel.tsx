"use client";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Download, FileSpreadsheet, Clock, DollarSign, Gauge, ShieldCheck } from "lucide-react";
import AnomalyBadge from "./AnomalyBadge";
import { exportJSON, exportCSV, type Insights } from "@/lib/export";

interface Props {
  insights: Insights;
  docId: string;
  compassContent: string; // raw streamed Compass text, parsed for export
  echoContent: string;
}

function parseRecord(text: string): Record<string, unknown> | null {
  try {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}") + 1;
    if (s >= 0) return JSON.parse(text.slice(s, e));
  } catch {
    /* ignore */
  }
  return null;
}

function Metric({
  icon,
  label,
  value,
  sub,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-mono uppercase tracking-widest ${accentClass}`}>
        <span>{icon}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <p className={`font-mono text-2xl font-bold ${accentClass}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function InsightPanel({ insights, docId, compassContent, echoContent }: Props) {
  const record = useMemo(() => parseRecord(compassContent), [compassContent]);
  const { roi, review_queue } = insights;

  const confidence = insights.extraction_confidence;
  const quality = insights.data_quality_score;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-success tracking-widest">
          ENTERPRISE INSIGHTS
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => exportJSON(record, insights, echoContent, docId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:border-success/50 hover:text-success transition-colors"
          >
            <Download className="size-3" /> FHIR/JSON
          </button>
          <button
            onClick={() => exportCSV(record, docId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:border-success/50 hover:text-success transition-colors"
          >
            <FileSpreadsheet className="size-3" /> CSV
          </button>
        </div>
      </div>

      {/* ROI + quality metric grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric
          icon={<Clock className="size-3.5" />}
          label="Time Saved"
          value={`${roi.minutes_saved} min`}
          sub={`vs ~${roi.manual_estimate_min} min manual`}
          accentClass="text-success"
        />
        <Metric
          icon={<DollarSign className="size-3.5" />}
          label="Cost Saved"
          value={`$${roi.rupees_saved}`}
          sub={`@ $${roi.nurse_hourly_inr}/hr processing`}
          accentClass="text-chart-4"
        />
        <Metric
          icon={<ShieldCheck className="size-3.5" />}
          label="Confidence"
          value={confidence != null ? `${confidence}%` : "—"}
          sub={`${insights.fields_captured}/${insights.fields_total} fields`}
          accentClass="text-chart-1"
        />
        <Metric
          icon={<Gauge className="size-3.5" />}
          label="Data Quality"
          value={quality != null ? `${quality}/100` : "—"}
          sub={insights.throughput_tps ? `${insights.throughput_tps} tok/s avg` : undefined}
          accentClass="text-chart-3"
        />
      </div>

      {/* Human-review queue */}
      <Card className="border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Human-Review Queue
          </p>
          <div className="flex gap-2 text-[10px] font-mono">
            {insights.critical_count > 0 && (
              <span className="text-destructive">{insights.critical_count} critical</span>
            )}
            {insights.warning_count > 0 && (
              <span className="text-warning">{insights.warning_count} review</span>
            )}
            {insights.review_count === 0 && (
              <span className="text-success">all clear ✓</span>
            )}
          </div>
        </div>

        {review_queue.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No fields require human review. Record is clean and ready for archival.
          </p>
        ) : (
          <ul className="space-y-2">
            {review_queue.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border px-3 py-2"
              >
                <AnomalyBadge severity={item.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground">
                    {item.label}
                    {item.session != null && (
                      <span className="text-muted-foreground"> · item {item.session}</span>
                    )}
                  </p>
                  {item.detail && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                  )}
                </div>
                <span className="text-[9px] font-mono uppercase text-muted-foreground shrink-0 mt-1">
                  {item.source}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
