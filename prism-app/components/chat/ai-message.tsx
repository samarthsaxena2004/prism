'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/agents'
import { ExecutionPanel } from './execution-panel'

type AiMessageProps = {
  status: string
  content?: string
  pipeline: Agent[]
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function AiMessage({ status, content, pipeline }: AiMessageProps) {
  const [expanded, setExpanded] = useState(false)
  const running = pipeline.some((a) => a.status === 'running')

  // Auto-expand when the pipeline starts so judges see agents without clicking
  useEffect(() => {
    if (running) setExpanded(true)
  }, [running])

  return (
    <div className="flex w-full gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-foreground bg-card">
        <Sparkles
          className="size-3.5 text-[var(--processing)]"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* State 1: collapsed status line (interactive) */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-lg border-2 border-transparent px-2 py-1.5 text-left transition-colors',
            'hover:border-foreground/50 hover:bg-secondary/60',
          )}
        >
          {running ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-[var(--processing)]"
              aria-hidden="true"
            />
          ) : (
            <span
              className="animate-breathe size-2 shrink-0 rounded-full bg-[var(--success)]"
              aria-hidden="true"
            />
          )}
          <span className="flex-1 truncate text-xs font-mono uppercase font-bold text-foreground/90">
            {status}
          </span>
          <span className="hidden font-mono text-[10px] tracking-widest uppercase text-muted-foreground sm:inline">
            {expanded ? 'Hide' : 'Details'}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
              expanded && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        {/* State 2: expanded execution panel */}
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring}
              className="overflow-hidden"
            >
              <ExecutionPanel pipeline={pipeline} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {content ? (
          <p className="mt-3 px-2 text-sm leading-relaxed text-foreground/85 font-mono">
            {content}
          </p>
        ) : null}
      </div>
    </div>
  )
}
