'use client'

import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/agents'

function StatusGlyph({ agent }: { agent: Agent }) {
  if (agent.status === 'completed') {
    return (
      <span
        className="flex size-5 items-center justify-center rounded-full ring-1"
        style={{
          color: agent.accent,
          backgroundColor: `${agent.accent}26`,
          borderColor: `${agent.accent}4d`,
        }}
      >
        <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
      </span>
    )
  }
  if (agent.status === 'running') {
    return (
      <span
        className="flex size-5 items-center justify-center rounded-full ring-1"
        style={{
          color: agent.accent,
          backgroundColor: `${agent.accent}26`,
          borderColor: `${agent.accent}4d`,
        }}
      >
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-muted-foreground ring-1 ring-border">
      <span
        className="size-1.5 rounded-full opacity-60"
        style={{ backgroundColor: agent.accent }}
        aria-hidden="true"
      />
    </span>
  )
}

function statusLabel(agent: Agent) {
  if (agent.status === 'completed') return `Completed · ${agent.duration}`
  if (agent.status === 'running') return 'Running in parallel…'
  return 'Pending'
}

function AgentRow({ agent }: { agent: Agent }) {
  const isRunning = agent.status === 'running'
  return (
    <div
      className={cn(
        'relative flex items-start gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-colors',
        isRunning ? '' : 'hover:bg-secondary/60',
      )}
      style={isRunning ? { backgroundColor: `${agent.accent}12` } : undefined}
    >
      {isRunning ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden"
        >
          <span
            className="animate-scan block h-full w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${agent.accent}99, transparent)`,
            }}
          />
        </span>
      ) : null}

      <StatusGlyph agent={agent} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="font-mono text-[13px] font-medium tracking-tight text-foreground">
            {agent.name}
            <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
              {agent.role}
            </span>
          </p>
          <p
            className="font-mono text-[11px] tabular-nums"
            style={{
              color:
                agent.status === 'pending'
                  ? 'var(--muted-foreground)'
                  : agent.accent,
            }}
          >
            {statusLabel(agent)}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {agent.detail}
        </p>
      </div>
    </div>
  )
}

export function ExecutionPanel({ pipeline }: { pipeline: Agent[] }) {
  // Build render groups so parallel agents can be visually bracketed together.
  const rendered: React.ReactNode[] = []
  let i = 0
  while (i < pipeline.length) {
    const agent = pipeline[i]
    if (agent.group) {
      const groupAgents: Agent[] = []
      while (i < pipeline.length && pipeline[i].group === agent.group) {
        groupAgents.push(pipeline[i])
        i++
      }
      rendered.push(
        <div key={agent.group} className="relative pl-4">
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-0 top-3 w-px rounded-full bg-[var(--processing)]/40"
          />
          <span className="absolute -left-[3px] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[var(--processing)]/70" />
          <div className="mb-1 pl-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--processing)]">
              Parallel execution
            </span>
          </div>
          <div className="space-y-1">
            {groupAgents.map((a) => (
              <AgentRow key={a.id} agent={a} />
            ))}
          </div>
        </div>,
      )
    } else {
      rendered.push(<AgentRow key={agent.id} agent={agent} />)
      i++
    }
  }

  const completed = pipeline.filter((a) => a.status === 'completed').length

  return (
    <div className="mt-2.5 overflow-hidden rounded-xl border border-border bg-[var(--elevated)] shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full bg-[var(--success)]"
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Execution Pipeline
          </span>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {completed}/{pipeline.length} agents
        </span>
      </div>
      <div className="space-y-1 p-2">{rendered}</div>
    </div>
  )
}
