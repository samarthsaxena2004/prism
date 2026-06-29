import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HowItWorksPage() {
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
          <h1 className="text-4xl md:text-5xl font-pixel uppercase tracking-tight mb-6">How It Works</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Prism routes document images through a dynamic five-agent validation pipeline capable of handling multiple complex verticals.
          </p>
        </header>

        <section className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-foreground/10 pb-4 mb-6">Dynamic Agent Swarm</h2>
            <p className="mb-6 leading-relaxed">
              Prism uses a highly orchestrated pipeline of specialized agents. Each agent relies on the output of the previous ones, making it a true <strong>Multiverse Agent</strong> swarm that dynamically adapts to the selected template.
            </p>
            
            <div className="bg-muted/30 p-6 rounded-lg border border-foreground/10 mb-8 overflow-x-auto">
              <pre className="text-xs md:text-sm">
                <code>
{`graph TD
    A[Enterprise Document] -->|Extraction| B(SCOUT: Vision Extraction)
    B --> C(RESEARCHER: Deep Web Search)
    B --> D(NAVIGATOR: API Orchestrator)
    C --> E(PUBLISHER: Artifact Generation)
    D --> E`}
                </code>
              </pre>
            </div>

            <ul className="space-y-6">
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">1</span>
                <div>
                  <h3 className="font-bold text-lg">SCOUT (Vision Extraction)</h3>
                  <p className="text-muted-foreground mt-1">Extracts primary entities and raw structured data from the document.</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">2</span>
                <div>
                  <h3 className="font-bold text-lg">RESEARCHER (Deep Web Search)</h3>
                  <p className="text-muted-foreground mt-1">Scours public datasets and the web for entity verification. (Runs in parallel with Navigator)</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">3</span>
                <div>
                  <h3 className="font-bold text-lg">NAVIGATOR (API Orchestrator)</h3>
                  <p className="text-muted-foreground mt-1">Queries external mapping and registry APIs for data enrichment. (Runs in parallel with Researcher)</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold">4</span>
                <div>
                  <h3 className="font-bold text-lg">PUBLISHER (Artifact Generation)</h3>
                  <p className="text-muted-foreground mt-1">Compiles the extracted and enriched data into a comprehensive interactive markdown report.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
