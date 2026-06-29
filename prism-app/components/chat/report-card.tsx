import { Sparkles, TerminalSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportCardProps {
  onViewCerebras: () => void
  onViewGpu: () => void
  activeReport: 'cerebras' | 'gpu' | null
}

export function ReportCard({ onViewCerebras, onViewGpu, activeReport }: ReportCardProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-foreground bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-pixel text-xl uppercase tracking-tight text-foreground">
            Analysis Complete
          </h3>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Reports generated successfully
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onViewCerebras}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-mono text-xs uppercase tracking-widest font-bold",
              activeReport === 'cerebras' 
                ? "border-foreground bg-foreground text-background" 
                : "border-foreground/20 bg-background text-foreground hover:border-foreground/50 hover:bg-secondary"
            )}
          >
            <Sparkles className="size-4" />
            Interactive Report
          </button>
          
          <button
            onClick={onViewGpu}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-mono text-xs uppercase tracking-widest font-bold",
              activeReport === 'gpu' 
                ? "border-foreground bg-foreground text-background" 
                : "border-foreground/20 bg-background text-foreground hover:border-foreground/50 hover:bg-secondary"
            )}
          >
            <TerminalSquare className="size-4" />
            Raw GPU Output
          </button>
        </div>
      </div>
    </div>
  )
}
