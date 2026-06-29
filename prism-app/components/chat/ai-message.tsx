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
  gpuPipeline?: Agent[]
  gpuContent?: string
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function AiMessage({ status, content, pipeline, gpuPipeline, gpuContent }: AiMessageProps) {
  const [expanded, setExpanded] = useState(false)
  const [engine, setEngine] = useState<'cerebras' | 'gpu'>('cerebras')
  
  const activePipeline = engine === 'cerebras' ? pipeline : (gpuPipeline || pipeline)
  const activeContent = engine === 'cerebras' ? content : (gpuContent || content)
  
  const running = activePipeline.some((a) => a.status === 'running')

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
              <div className="flex items-center justify-center py-3 mb-2 border-b border-white/5">
                <div className="flex items-center bg-background rounded-lg p-1 border border-border">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEngine('cerebras'); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all",
                      engine === 'cerebras' ? "bg-[var(--processing)] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    ⚡ Cerebras LPU
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEngine('gpu'); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-md transition-all",
                      engine === 'gpu' ? "bg-card text-foreground border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🐢 Standard GPU
                  </button>
                </div>
              </div>
              <ExecutionPanel pipeline={activePipeline} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {activeContent ? (
          <div className="mt-3 px-2 text-sm font-mono">
            {activeContent.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h3 key={i} className="text-[var(--processing)] font-bold text-[11px] tracking-widest mt-4 mb-1 uppercase">
                    {line.replace('## ', '')}
                  </h3>
                )
              }
              if (line.startsWith('* ') || line.startsWith('- ')) {
                return (
                  <div key={i} className="flex gap-2 text-foreground/80 mt-1 pl-1">
                    <span className="text-[var(--chart-4)] select-none">›</span>
                    <span>{line.substring(2)}</span>
                  </div>
                )
              }
              if (line.trim() === '') {
                return <div key={i} className="h-2" />
              }
              
              const parts = line.split(/(\*\*.*?\*\*)/g)
              return (
                <p key={i} className="text-foreground/85 leading-relaxed mt-1">
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>
                    }
                    return <span key={j}>{part}</span>
                  })}
                </p>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
