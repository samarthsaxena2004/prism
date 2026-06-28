"use client"

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const TAGS = ["ABDM Compatible", "PostgreSQL Storage", "SSE Real-Time Streaming", "Async Parallel Execution"]

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className="w-full border-t-2 border-foreground px-6 py-12 lg:px-12"
    >
      <div className="flex flex-col gap-8">
        {/* Enterprise Impact Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl lg:text-2xl font-mono font-bold tracking-tight uppercase text-foreground">
            Real-World Operational Impact
          </h3>
          <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-3xl">
            Solving the physical-world problem of paper-to-digital translation. Demonstrated on complex industrial and medical forms, Prism saves an estimated 5 hours of administrative time per unit per day.
          </p>
        </div>

        {/* Tags/Pills */}
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease }}
              className="inline-block border-2 border-foreground text-foreground text-[10px] tracking-[0.15em] uppercase font-mono px-3 py-2 hover:bg-foreground hover:text-background transition-colors"
            >
              {tag}
            </motion.span>
          ))}
        </div>

        {/* Footer bottom */}
        <div className="border-t-2 border-foreground pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
              PRISM
            </span>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
              {"Enterprise Document Intelligence"}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Status", href: "https://status.samarthsaxena.dev/" },
              { label: "GitHub", href: "http://github.com/samarthsaxena2004/prisma" },
            ].map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease }}
                className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
