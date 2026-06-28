import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase">
            Gemma 4 31B × Cerebras
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-[0.15em] text-foreground">PRISM</h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-serif">
            Five AI agents that turn complex documents into structured intelligence — in seconds.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center py-4">
          {[
            { label: "Agents", value: "5" },
            { label: "Seconds", value: "~12" },
            { label: "Tokens/s", value: "1,500" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="font-mono text-2xl font-bold text-blue-500 dark:text-blue-400">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-sans">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-6">
          <Link
            href="/analyze"
            className="px-6 py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity"
          >
            ⚡ Start Investigation
          </Link>
          <Link
            href="/records"
            className="px-6 py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm hover:text-foreground transition-colors"
          >
            Browse Records
          </Link>
        </div>

        <p className="text-xs text-muted-foreground font-serif pt-4">
          Demonstrated on real-world industrial and medical forms
        </p>
      </div>
    </main>
  );
}
