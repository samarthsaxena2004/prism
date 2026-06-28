'use client'

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, ImagePlus, Paperclip, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Attachment = { id: string; url: string; name: string }

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function ChatInput({
  onSend,
  docked = false,
  processing = false,
}: {
  onSend?: (value: string, images: string[]) => void
  docked?: boolean
  processing?: boolean
}) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function autoGrow() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  async function addFiles(files: FileList | null) {
    if (!files) return
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    
    const next = await Promise.all(
      fileArray.map(async (f) => {
        return new Promise<Attachment>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              id: `${f.name}-${Math.random().toString(36).slice(2)}`,
              url: e.target?.result as string,
              name: f.name,
            })
          }
          reader.readAsDataURL(f)
        })
      })
    )
    if (next.length) setAttachments((prev) => [...prev, ...next])
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files)
    e.target.value = ''
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed && attachments.length === 0) return
    onSend?.(
      trimmed || 'Analyze the attached documents.',
      attachments.map((a) => a.url),
    )
    setValue('')
    setAttachments([])
    requestAnimationFrame(autoGrow)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = value.trim().length > 0 || attachments.length > 0
  const showDropzone = !docked && attachments.length === 0

  return (
    <div
      className="relative"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragging(false)
      }}
      onDrop={onDrop}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={onFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Slow-moving processing glow — appears once agents are working */}
      <div
        aria-hidden="true"
        className={cn(
          'input-glow pointer-events-none absolute -inset-1.5 rounded-3xl blur-[5px] transition-opacity duration-700',
          processing ? 'opacity-80' : 'opacity-0',
        )}
      />

      <div className={cn(
        "relative rounded-2xl transition-all",
        dragging ? "p-[2px] bg-[var(--processing)]" : "p-[2px] blue-laser-glow"
      )}>
        <form
          onSubmit={submit}
          className={cn(
            'relative rounded-[calc(var(--radius-2xl)-2px)] overflow-hidden bg-card transition-colors w-full h-full'
          )}
        >
        {/* Zero-state image dropzone */}
        {showDropzone ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              'group m-2 mb-0 flex w-[calc(100%-1rem)] flex-col items-center justify-center gap-2 border-2 rounded-xl border-dashed px-4 py-7 text-center transition-colors',
              dragging
                ? 'border-[var(--processing)] bg-[var(--processing)]/[0.07]'
                : 'border-foreground/40 hover:border-[var(--processing)]/50 hover:bg-secondary/60',
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-none bg-secondary border border-foreground text-foreground transition-colors group-hover:text-foreground">
              <ImagePlus className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-foreground/90">
              Drop document images or click to upload
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              PNG, JPG · multiple files supported
            </span>
          </button>
        ) : null}

        {/* Attachment thumbnails */}
        <AnimatePresence initial={false}>
          {attachments.length > 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="flex flex-wrap gap-2 px-3 pt-3"
            >
              <AnimatePresence initial={false}>
                {attachments.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={spring}
                    className="group relative size-14 overflow-hidden border-2 rounded-lg border-foreground"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url || '/placeholder.svg'}
                      alt={a.name}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      aria-label={`Remove ${a.name}`}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-md bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            autoGrow()
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={
            docked ? 'Reply to the console…' : 'ADD A NOTE FOR THE AGENTS…'
          }
          aria-label="Message input"
          className="font-mono block max-h-52 w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach image"
              className="flex size-8 items-center justify-center rounded-lg border-2 border-transparent text-muted-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <Paperclip className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              Enter to send
            </span>
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                'flex size-8 items-center justify-center transition-all border-2 rounded-lg border-foreground',
                canSend
                  ? 'bg-[#ea580c] text-background hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed bg-muted text-muted-foreground/50',
              )}
            >
              <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  )
}
