'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Stethoscope,
  Shield,
  Landmark,
  Building2,
  Truck,
} from 'lucide-react'

const templates = [
  {
    id: 'medical-records',
    label: 'Medical Records',
    icon: Stethoscope,
    color: '#cc785c',
  },
  {
    id: 'insurance-claims',
    label: 'Insurance Claims',
    icon: Shield,
    color: '#a6c97a',
  },
  {
    id: 'gov-forms',
    label: 'Government Forms',
    icon: Landmark,
    color: '#e6b66e',
  },
  {
    id: 'financial-reports',
    label: 'Financial Reports',
    icon: Building2,
    color: '#c9a6d4',
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: Truck,
    color: '#d9a998',
  },
]

interface TemplateCardsProps {
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function TemplateCards({ selectedId, onSelect }: TemplateCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="mt-12 w-full flex flex-col items-center">
      <p className="font-mono uppercase text-[11px] tracking-widest text-muted-foreground mb-8">
        Start with a template...
      </p>

      {/* Fan container */}
      <div className="relative flex justify-center items-center h-40 w-full max-w-xl mx-auto">
        {templates.map((template, index) => {
          const Icon = template.icon
          const isSelected = selectedId === template.id
          const isHovered = hoveredIndex === index || isSelected
          const offset = index - 2 // -2, -1, 0, 1, 2

          // Base styling for the fan
          const baseRotate = offset * 5 // -10deg, -5deg, 0, 5deg, 10deg
          const baseX = offset * 90 // -180px, -90px, 0, 90px, 180px
          const baseY = Math.abs(offset) * 12 // 24px, 12px, 0, 12px, 24px
          const baseZ = 10 - Math.abs(offset)

          return (
            <motion.button
              key={template.id}
              onClick={() => onSelect?.(template.id)}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              initial={false}
              animate={{
                x: baseX,
                y: isHovered ? -20 : baseY,
                rotate: isHovered ? 0 : baseRotate,
                scale: isHovered ? 1.15 : 1,
                zIndex: isHovered ? 50 : baseZ,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                mass: 0.8,
              }}
              className={`absolute w-36 h-32 rounded-xl border-2 flex flex-col items-center justify-center p-3 cursor-pointer transition-shadow
                ${isSelected
                  ? 'bg-card border-[#4ade80] shadow-[4px_4px_0_0_#4ade80]'
                  : isHovered 
                  ? 'bg-card border-foreground shadow-[4px_4px_0_0_var(--color-foreground)]' 
                  : 'bg-card border-foreground/30 hover:border-foreground/60 hover:shadow-[2px_2px_0_0_var(--color-foreground)]'
                }`}
            >
              <div 
                className="w-12 h-10 rounded-md flex items-center justify-center mb-3"
                style={{ backgroundColor: `${template.color}15` }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: template.color }}
                  strokeWidth={2}
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-foreground text-center leading-tight mt-1">
                {template.label}
              </p>
            </motion.button>
          )
        })}
      </div>

      <p className="mt-12 font-mono uppercase text-[11px] tracking-widest text-muted-foreground">
        &uarr; Please select a template above to start
      </p>
    </div>
  )
}
