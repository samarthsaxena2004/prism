'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { type ChatMessage, type Agent } from '@/lib/agents'
import { ChatHeader } from './chat-header'
import { UserMessage } from './user-message'
import { AiMessage } from './ai-message'
import { ChatInput } from './chat-input'
import { TemplateCards } from './template-cards'
import SpeedPanel from '../SpeedPanel'
import StructuredTable from '../StructuredTable'

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 }

const INITIAL_PIPELINE: Agent[] = [
  { id: 'sage', name: 'Sage', role: 'Vision Extraction', status: 'pending', detail: 'Waiting...', accent: 'hsl(88, 44%, 59%)' },
  { id: 'oracle', name: 'Oracle', role: 'Clinical Validation', status: 'pending', detail: 'Waiting...', accent: '#cc785c', group: 'parallel' },
  { id: 'sentinel', name: 'Sentinel', role: 'Anomaly Detection', status: 'pending', detail: 'Waiting...', accent: 'hsl(36, 60%, 60%)', group: 'parallel' },
  { id: 'compass', name: 'Compass', role: 'Data Structuring', status: 'pending', detail: 'Waiting...', accent: 'hsl(278, 32%, 68%)' },
  { id: 'echo', name: 'Echo', role: 'Intelligence Brief', status: 'pending', detail: 'Waiting...', accent: 'hsl(12, 40%, 66%)' },
]

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [geminiMs, setGeminiMs] = useState<number | null>(null)
  const [docId, setDocId] = useState<string | null>(null)
  
  const [compassContent, setCompassContent] = useState('')
  const [echoContent, setEchoContent] = useState('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const active = messages.length > 0

  useEffect(() => {
    if (active) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, active, compassContent, echoContent])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    if (timerRef.current) clearInterval(timerRef.current)
    setElapsedMs(0)
    setGeminiMs(null)
    setProcessing(false)
    setDone(false)
    setDocId(null)
    setCompassContent('')
    setEchoContent('')
  }, [])

  // Cleanup on unmount
  useEffect(() => () => reset(), [reset])

  async function handleSend(value: string, images: string[]) {
    if (processing) return
    if (!images.length && !value) return

    reset()
    await new Promise((r) => setTimeout(r, 50))
    setProcessing(true)
    startRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 100)
    abortRef.current = new AbortController()

    const now = Date.now()
    const assistantId = `a-${now}`
    
    setMessages((prev) => [
      ...prev,
      { id: `u-${now}`, role: 'user', content: value, images },
      { id: assistantId, role: 'assistant', status: 'Validating clinical records...', pipeline: JSON.parse(JSON.stringify(INITIAL_PIPELINE)), content: '' },
    ])

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    const imageB64 = images[0]?.split(',')[1] // Get base64 part

    try {
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: imageB64 || "", facility_name: "Demo Facility" }),
        signal: abortRef.current.signal,
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done: d, value } = await reader.read()
        if (d) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))

            setMessages((prev) => {
              return prev.map(msg => {
                if (msg.id !== assistantId || msg.role !== 'assistant') return msg
                
                const newPipeline = [...msg.pipeline]
                const agentIdx = newPipeline.findIndex(a => a.id === ev.agent)
                
                let newStatusMsg = msg.status
                let newContent = msg.content ?? ''

                if (ev.type === 'status' && agentIdx >= 0) {
                  newPipeline[agentIdx] = { ...newPipeline[agentIdx], status: 'running', detail: ev.content }
                  newStatusMsg = ev.content
                } else if (ev.type === 'streaming' && agentIdx >= 0) {
                  // Only Echo streams the main content body visually
                  if (ev.agent === 'echo') {
                    newContent += ev.content
                    setEchoContent(c => c + ev.content)
                  }
                  if (ev.agent === 'compass') {
                    setCompassContent(c => c + ev.content)
                  }
                } else if (ev.type === 'done' && agentIdx >= 0) {
                  newPipeline[agentIdx] = { 
                    ...newPipeline[agentIdx], 
                    status: 'completed', 
                    duration: ev.ms ? `${(ev.ms / 1000).toFixed(1)}s` : undefined
                  }
                  if (ev.agent === 'echo') newStatusMsg = 'Analysis Complete.'
                } else if (ev.type === 'timing' && agentIdx >= 0) {
                  // Ignore for now in pipeline UI
                } else if (ev.type === 'speed_data' && ev.gemini_ms) {
                  setGeminiMs(ev.gemini_ms)
                } else if (ev.type === 'complete') {
                  setDocId(ev.doc_id ?? null)
                }

                return { ...msg, pipeline: newPipeline, status: newStatusMsg, content: newContent }
              })
            })
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') console.error(err)
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
      setProcessing(false)
      setDone(true)
      setElapsedMs(Date.now() - startRef.current)
    }
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <ChatHeader />

      {active ? (
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 pb-32">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                >
                  {message.role === 'user' ? (
                    <UserMessage
                      content={message.content}
                      images={message.images}
                    />
                  ) : (
                    <AiMessage
                      status={message.status}
                      content={message.content}
                      pipeline={message.pipeline}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {(processing || done) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8"
                >
                  <SpeedPanel
                    cerebrasMs={elapsedMs}
                    geminiMs={geminiMs}
                    cerebrasDone={done}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {done && docId && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <StructuredTable
                    docId={docId}
                    compassContent={compassContent}
                    echoContent={echoContent}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={endRef} />
          </div>
        </main>
      ) : (
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              className="w-full text-center"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--processing)]">
                Clinical Intelligence
              </span>
              <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                Think clearly, decide faster
              </h1>
              <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
                Prism routes your clinical images through a five-agent validation
                pipeline — extraction, validation, anomaly detection, structuring,
                and briefing.
              </p>
            </motion.div>

            <motion.div
              layoutId="composer"
              transition={spring}
              className="mt-12 w-full"
            >
              <ChatInput onSend={handleSend} processing={processing} />
            </motion.div>

            <TemplateCards />
          </div>
        </main>
      )}

      {active ? (
        <motion.div
          layoutId="composer"
          transition={spring}
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl"
        >
          <div className="mx-auto w-full max-w-3xl px-4 pb-5 pt-4">
            <ChatInput onSend={handleSend} docked processing={processing} />
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground/70">
              Prism orchestrates a 5-agent pipeline. Outputs require clinician
              review before use.
            </p>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
