export type AgentStatus = 'completed' | 'running' | 'pending'

export type Agent = {
  id: string
  name: string
  role: string
  status: AgentStatus
  duration?: string
  detail: string
  /** Per-agent accent color (hex). */
  accent: string
  /** Agents sharing a group id are executing concurrently. */
  group?: string
  /** Measured time-to-first-token in ms (from Cerebras time_info). */
  ttftMs?: number
  /** Measured throughput in tokens/sec (from Cerebras time_info). */
  tps?: number
}

export const pipeline: Agent[] = [
  {
    id: 'sage',
    name: 'Sage',
    role: 'Vision Extraction',
    status: 'completed',
    duration: '2.1s',
    detail: 'Parsed 4 documents · 38 fields extracted',
    accent: 'hsl(88, 44%, 59%)',
  },
  {
    id: 'oracle',
    name: 'Oracle',
    role: 'Domain Validation',
    status: 'running',
    detail: 'Cross-referencing ICD-10 + lab ranges',
    accent: '#cc785c',
    group: 'parallel',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Anomaly Detection',
    status: 'running',
    detail: 'Scanning for outliers across 12 vitals',
    accent: 'hsl(36, 60%, 60%)',
    group: 'parallel',
  },
  {
    id: 'compass',
    name: 'Compass',
    role: 'Data Structuring',
    status: 'pending',
    detail: 'Awaiting validated records',
    accent: 'hsl(278, 32%, 68%)',
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Intelligence Brief',
    status: 'pending',
    detail: 'Awaiting structured dataset',
    accent: 'hsl(12, 40%, 66%)',
  },
]

export type ChatMessage =
  | {
      id: string
      role: 'user'
      content: string
      images?: string[]
    }
  | {
      id: string
      role: 'assistant'
      status: string
      content?: string
      pipeline: Agent[]
    }
