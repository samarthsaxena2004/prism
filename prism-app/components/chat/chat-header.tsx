'use client'

import { Activity, Cpu, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export function ChatHeader() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <header className="sticky top-0 z-10 border-b-2 border-foreground bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Cpu
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
              SYS.INT
            </span>
          </div>
          <div className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-1">
            <Activity
              className="size-3 text-[var(--success)]"
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              5 agents online
            </span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-10 border-b-2 border-foreground bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Cpu
            className="size-4"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
            SYS.INT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-8 items-center justify-center border-2 border-transparent text-muted-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            {theme === 'light' ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </button>
          <div className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-1">
            <Activity
              className="size-3 text-[var(--success)]"
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              5 agents online
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
