"use client"

import { WorkflowDiagram } from "@/components/workflow-diagram"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const ease = [0.22, 1, 0.36, 1] as const

export function HeroSection() {
  return (
    <section className="relative w-full px-12 pt-6 pb-12 lg:px-24 lg:pt-10 lg:pb-16 min-h-[70vh] flex flex-col justify-center">
      <div className="flex flex-col items-center text-center">
        {/* Badge/eyebrow text */}
        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease }}
          className="mb-6"
        >
          <span className="inline-block text-[10px] tracking-[0.2em] uppercase font-mono text-muted-foreground border border-foreground px-3 py-2">
            Gemma 4 31B × Cerebras Inference
          </span>
        </motion.div>

        {/* Main headline: PRISM */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease }}
          className="font-pixel text-5xl sm:text-7xl lg:text-8xl xl:text-9xl tracking-tight text-foreground mb-6 select-none"
        >
          PRISM
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="text-xs lg:text-sm text-muted-foreground max-w-2xl mb-8 leading-relaxed font-mono"
        >
          Enterprise Document Intelligence. Paper forms. Handwritten.<br />
          Digitized by 5 AI agents. In 12 seconds.
        </motion.p>

        {/* Workflow Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease }}
          className="w-full max-w-3xl my-8 lg:my-12"
        >
          <WorkflowDiagram />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
        >
          <Link href="/analyze" className="group flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase hover:scale-105 active:scale-95 transition-transform shadow-md">
            <span className="flex items-center justify-center w-10 h-10 bg-[#ea580c]">
              <motion.span
                className="inline-flex"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <ArrowRight size={16} strokeWidth={2} className="text-background" />
              </motion.span>
            </span>
            <span className="px-5 py-2.5">
              ⚡ Try Prism
            </span>
          </Link>

          <Link href="/how-it-works" className="group flex items-center bg-muted text-foreground text-sm font-mono tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors shadow-sm px-6 py-2.5 h-10 border border-foreground/20">
            How It Works
          </Link>

          <Link href="/architecture" className="group flex items-center bg-muted text-foreground text-sm font-mono tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors shadow-sm px-6 py-2.5 h-10 border border-foreground/20">
            Architecture
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
