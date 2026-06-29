import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 font-mono">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-pixel uppercase tracking-tight mb-6">Architecture</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Prism is built to be production-ready and scalable for enterprise systems, utilizing modern web frameworks and ultra-fast AI inference.
          </p>
        </header>

        <section className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-foreground/10 pb-4 mb-6">Tech Stack</h2>
            
            <ul className="space-y-6">
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">1</span>
                <div>
                  <h3 className="font-bold text-lg">AI Inference</h3>
                  <p className="text-muted-foreground mt-1">
                    Powered by the <a href="https://cerebras.ai/" className="underline hover:text-foreground">Cerebras Inference API</a> running <code>gemma-4-31b</code> for industry-leading speed (1,500+ TPS).
                  </p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">2</span>
                <div>
                  <h3 className="font-bold text-lg">Backend</h3>
                  <p className="text-muted-foreground mt-1">Python, FastAPI, and Asyncio for parallel agent execution. Uses Server-Sent Events (SSE) for real-time UI updates.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">3</span>
                <div>
                  <h3 className="font-bold text-lg">Frontend</h3>
                  <p className="text-muted-foreground mt-1">Next.js 14, React, TailwindCSS, Shadcn UI, and Framer Motion for a fluid, responsive client experience.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">4</span>
                <div>
                  <h3 className="font-bold text-lg">Database</h3>
                  <p className="text-muted-foreground mt-1">Supabase (PostgreSQL) for persistent record storage and scalable data management.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-12 bg-muted/20 p-8 rounded-xl border border-foreground/10">
            <h2 className="text-xl font-bold mb-4">Why Cerebras?</h2>
            <p className="leading-relaxed text-muted-foreground">
              At standard GPU speeds, running a 5-agent pipeline on a document is a background batch job (taking 47+ seconds). 
              At <strong>Cerebras speeds</strong>, it becomes a <strong>real-time interactive UX</strong>. Enterprise teams can take a photo of a form and instantly get structured, validated records before the client even leaves the room.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
