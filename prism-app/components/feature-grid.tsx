"use client"

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const PIPELINE_STAGES = [
  {
    name: "Sage",
    subtitle: "(Vision)",
    description: "Bypasses traditional OCR. Reads raw handwritten base64 images directly.",
  },
  {
    name: "Oracle",
    subtitle: "(Validation)",
    description: "Validates extracted values against strict reference ranges.",
  },
  {
    name: "Sentinel",
    subtitle: "(Anomalies)",
    description: "Checks temporal continuity, mathematical accuracy, and data quality simultaneously.",
  },
  {
    name: "Compass",
    subtitle: "(Structuring)",
    description: "Synthesizes findings into a standardized JSON record.",
  },
  {
    name: "Echo",
    subtitle: "(Intelligence)",
    description: "Translates the raw data into a human-readable 120-word executive brief.",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease },
  }),
}

export function FeatureGrid() {
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
          {"// SECTION: MULTIVERSE_PIPELINE"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">002</span>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col gap-3 mb-12"
      >
        <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground text-balance">
          The Multiverse Pipeline
        </h2>
        <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-2xl">
          A precisely choreographed architecture where agents communicate seamlessly.
        </p>
      </motion.div>

      {/* Pipeline grid - 5 items */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 border-2 border-foreground"
      >
        {PIPELINE_STAGES.map((stage, i) => (
          <motion.div
            key={stage.name}
            custom={i}
            variants={cardVariants}
            className={`border-foreground flex flex-col p-5 min-h-[240px] ${
              i < PIPELINE_STAGES.length - 1
                ? "border-b-2 md:border-b-0 lg:border-b-0 md:border-r-2 lg:border-r-2"
                : "border-b-0 md:border-b-0"
            } ${i % 2 === 1 && i < PIPELINE_STAGES.length - 1 ? "md:border-r-0 lg:border-r-2" : ""} ${
              i > 2 ? "border-t-2 md:border-t-0 lg:border-t-0" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-mono font-bold tracking-tight text-foreground">
                  {stage.name}
                </h3>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                  {stage.subtitle}
                </p>
              </div>
              <span className="text-[10px] tracking-[0.2em] font-mono text-muted-foreground opacity-50">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="flex-1 border-t-2 border-foreground pt-4">
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {stage.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
