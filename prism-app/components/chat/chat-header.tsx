'use client'

import { Activity, Asterisk, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export function ChatHeader() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Asterisk
              className="size-5 text-[var(--processing)]"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <p className="font-serif text-xl font-medium tracking-tight text-foreground">
              Prism
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1">
            <Activity
              className="size-3 text-[var(--success)]"
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              5 agents online
            </span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Asterisk
            className="size-5 text-[var(--processing)]"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <p className="font-serif text-xl font-medium tracking-tight text-foreground">
            Prism
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {theme === 'light' ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1">
            <Activity
              className="size-3 text-[var(--success)]"
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              5 agents online
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
