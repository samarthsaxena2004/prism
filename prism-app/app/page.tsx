import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#06060f] text-[#e8eaf6] flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-[0.25em] text-[#454e70] uppercase">
            Gemma 4 31B × Cerebras
          </p>
          <h1 className="font-mono text-5xl font-bold tracking-[0.15em] text-[#e8eaf6]">PRISM</h1>
          <p className="text-[#8a94b8] text-lg leading-relaxed">
            Five AI agents that turn paper medical records into structured intelligence — in seconds.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center py-4">
          {[
            { label: "Agents", value: "5" },
            { label: "Seconds", value: "~12" },
            { label: "Tokens/s", value: "1,500" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#0e0f1a] p-4">
              <p className="font-mono text-2xl font-bold text-[#4ade80]">{value}</p>
              <p className="text-xs text-[#454e70] mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/analyze"
            className="px-6 py-3 rounded-lg bg-[#4ade80] text-[#06060f] font-bold text-sm hover:bg-[#22c55e] transition-colors"
          >
            ⚡ Start Investigation
          </Link>
          <Link
            href="/records"
            className="px-6 py-3 rounded-lg border border-white/15 text-[#8a94b8] font-medium text-sm hover:text-[#e8eaf6] hover:border-white/25 transition-colors"
          >
            Browse Records
          </Link>
        </div>

        <p className="text-xs text-[#454e70]">
          Demonstrated on dialysis monitoring forms from Indore, India
        </p>
      </div>
    </main>
  );
}
