"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

/* ── scramble text reveal ── */
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./:"

  useEffect(() => {
    if (!inView) return
    let iteration = 0
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " "
            if (i < iteration) return text[i]
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join("")
      )
      iteration += 0.5
      if (iteration >= text.length) {
        setDisplay(text)
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [inView, text])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

/* ── blinking cursor ── */
function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#ea580c] animate-blink" />
}

/* ── stat block ── */
const STATS = [
  { label: "TOKENS / SECOND", value: "1,500" },
  { label: "END-TO-END", value: "12s" },
  { label: "SIMULTANEOUS AGENTS", value: "5" },
]

function StatBlock({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.5, ease }}
      className="flex flex-col gap-1 border-2 border-foreground px-4 py-3"
    >
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
        {label}
      </span>
      <span className="text-xl lg:text-2xl font-mono font-bold tracking-tight">
        <ScrambleText text={value} />
      </span>
    </motion.div>
  )
}

/* ── main about section ── */
export function AboutSection() {
  return (
    <section className="w-full px-6 py-20 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: SPEED_METRICS"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          003
        </span>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-0 border-2 border-foreground">
        {/* Left: Live pipeline terminal */}
        <motion.div
          initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative w-full lg:w-1/2 min-h-[300px] lg:min-h-[500px] border-b-2 lg:border-b-0 lg:border-r-2 border-foreground overflow-hidden bg-foreground flex flex-col"
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between px-4 py-2 bg-foreground/90 border-b border-background/10 flex-shrink-0">
            <span className="text-[10px] tracking-[0.2em] uppercase text-background/50 font-mono">
              prism_pipeline.log
            </span>
            <BlinkDot />
          </div>
          {/* Terminal body */}
          <div className="flex-1 px-5 py-5 font-mono text-[11px] leading-6 overflow-hidden space-y-1">
            <p className="text-background/40">$ prism --analyze dialysis_form.jpg --agents 5</p>
            <p className="text-[#a6c97a]">✓ SAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [2.1s] Extracted 8 sessions · 47 fields</p>
            <p className="text-background/25">  ↳ patient: &quot;Demo Patient&quot; · sessions: 941–948</p>
            <div className="flex gap-6">
              <p className="text-[#e8a882]">✓ ORACLE&nbsp;&nbsp;&nbsp;[1.8s] 1 critical, 2 warnings</p>
            </div>
            <p className="text-background/25">  ↳ session 942: BP 190/110 → CRITICAL</p>
            <p className="text-[#e6b66e]">✓ SENTINEL&nbsp;[1.9s] 2 anomalies · Quality: 81/100</p>
            <p className="text-background/25">  ↳ session 945: post_weight missing</p>
            <p className="text-[#c9a6d4]">✓ COMPASS&nbsp;&nbsp;[2.4s] Structured record generated</p>
            <p className="text-[#d9a998]">✓ ECHO&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1.2s] Intelligence brief ready</p>
            <div className="mt-4 pt-3 border-t border-background/10">
              <p className="text-background/40">Cerebras (Gemma 4 31B)&nbsp;&nbsp;9.4s&nbsp;&nbsp;<span className="text-[#a6c97a]">✓ DONE</span></p>
              <p className="text-background/40">Standard GPU (1 agent)&nbsp;&nbsp;&nbsp;47s&nbsp;&nbsp;&nbsp;<span className="text-background/30">▌ still running</span></p>
            </div>
            <p className="mt-2 text-[#ea580c]">→ Record saved · Supabase · 2 flags for review</p>
          </div>
        </motion.div>

        {/* Right: Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="flex flex-col w-full lg:w-1/2"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              PERFORMANCE.md
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              v1.0.0
            </span>
          </div>

          {/* Content body */}
          <div className="flex-1 flex flex-col justify-between px-5 py-6 lg:py-8">
            <div className="flex flex-col gap-6">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: 0.2, ease }}
                className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-balance"
              >
                Defense in Depth,
                <br />
                <span className="text-[#ea580c]">Not Just Speed.</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="flex flex-col gap-4"
              >
                <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed">
                  Oracle validates BP and weight against clinical reference ranges. Sentinel independently checks for mathematical inconsistencies and data quality errors. Two orthogonal agents catch what one misses — and at Cerebras speeds, the entire pipeline runs in 12 seconds, fast enough for point-of-care use during shift handoff.
                </p>
              </motion.div>

              {/* Processing line */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.8 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease }}
                style={{ transformOrigin: "left" }}
                className="flex items-center gap-3 py-3 border-t-2 border-b-2 border-foreground"
              >
                <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                  STATUS:
                </span>
                <span className="font-mono text-[#ea580c]">Live & Operational</span>
              </motion.div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mt-6">
              {STATS.map((stat, i) => (
                <StatBlock key={stat.label} {...stat} index={i} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
