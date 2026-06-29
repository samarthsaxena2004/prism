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

export const INITIAL_ENTERPRISE_PIPELINE: Agent[] = [
  {
    id: 'sage',
    name: 'Scout',
    role: 'Vision Extraction',
    status: 'pending',
    detail: 'Initializing vision models...',
    accent: 'hsl(88, 44%, 59%)',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Deep Web Search',
    status: 'pending',
    detail: 'Awaiting search entities...',
    accent: '#cc785c',
    group: 'parallel',
  },
  {
    id: 'navigator',
    name: 'Navigator',
    role: 'API Orchestrator',
    status: 'pending',
    detail: 'Awaiting API parameters...',
    accent: 'hsl(36, 60%, 60%)',
    group: 'parallel',
  },
  {
    id: 'publisher',
    name: 'Publisher',
    role: 'Artifact Generation',
    status: 'pending',
    detail: 'Awaiting context...',
    accent: 'hsl(278, 32%, 68%)',
  }
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
      gpuPipeline?: Agent[]
      gpuContent?: string
    }
