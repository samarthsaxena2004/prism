// Client-side export of a digitized record into HIS-consumable formats.
// We build a FHIR-flavored JSON bundle (the shape a hospital information system
// or ABDM endpoint would ingest) and a flat CSV of the session rows. Doing it
// client-side keeps the demo dependency-free — the data is already in memory.

export interface Insights {
  extraction_confidence: number | null
  data_quality_score: number | null
  fields_captured: number
  fields_total: number
  sessions_processed: number
  review_queue: ReviewItem[]
  review_count: number
  critical_count: number
  warning_count: number
  throughput_tps: number | null
  roi: {
    manual_estimate_min: number
    pipeline_seconds: number
    minutes_saved: number
    rupees_saved: number
    nurse_hourly_inr: number
  }
}

export interface ReviewItem {
  source: string
  severity: string
  label: string
  detail: string
  session?: string | number | null
}

interface StructuredRecord {
  patient?: Record<string, unknown>
  sessions?: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportJSON(
  record: StructuredRecord | null,
  insights: Insights | null,
  brief: string,
  docId: string,
) {
  const patient = record?.patient ?? {}
  const sessions = record?.sessions ?? []

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    meta: {
      source: 'Prism — Multi-Agent Document Intelligence',
      generated: new Date().toISOString(),
      documentId: docId,
    },
    prismInsights: insights,
    intelligenceBrief: brief,
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          identifier: patient.id ? [{ value: String(patient.id) }] : [],
          name: patient.name ? [{ text: String(patient.name) }] : [],
          extension: patient,
        },
      },
      ...sessions.map((s, i) => ({
        resource: {
          resourceType: 'Observation',
          status: 'preliminary',
          category: [{ text: 'dialysis-session' }],
          sessionIndex: i + 1,
          effectiveDateTime: s.date ?? null,
          interpretation: s.status ?? 'NORMAL',
          component: s.measurements ?? {},
          performer: s.technician ?? null,
        },
      })),
    ],
  }

  triggerDownload(
    `prism-record-${docId.slice(0, 8)}.json`,
    JSON.stringify(bundle, null, 2),
    'application/json',
  )
}

export function exportCSV(record: StructuredRecord | null, docId: string) {
  const sessions = record?.sessions ?? []
  const cols = [
    'session_num',
    'date',
    'status',
    'pre_weight_kg',
    'post_weight_kg',
    'weight_gain_kg',
    'bp_pre',
    'bp_mid',
    'bp_post',
    'pulse_pre',
    'duration_hrs',
    'technician',
  ]

  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const rows = sessions.map((s) => {
    const m = (s.measurements ?? {}) as Record<string, unknown>
    return cols
      .map((c) => {
        if (c === 'session_num') return escape(s.session_num)
        if (c === 'date') return escape(s.date)
        if (c === 'status') return escape(s.status)
        if (c === 'technician') return escape(s.technician)
        return escape(m[c])
      })
      .join(',')
  })

  const csv = [cols.join(','), ...rows].join('\n')
  triggerDownload(`prism-record-${docId.slice(0, 8)}.csv`, csv, 'text/csv')
}
