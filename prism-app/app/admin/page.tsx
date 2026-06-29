'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Activity, Search, X, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Workflow {
  id: string
  facility_name: string
  form_type: string
  status: string
  created_at: string
}

interface AgentOutput {
  id: string
  agent_name: string
  content: any
  processing_time_ms: number
  created_at: string
}

export default function AdminDashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [docDetails, setDocDetails] = useState<{document: any, agents: AgentOutput[], record: any} | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8000/api/admin/workflows')
      .then(res => res.json())
      .then(data => {
        setWorkflows(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const loadDetails = async (id: string) => {
    setSelectedDocId(id)
    setDetailsLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/admin/workflows/${id}`)
      const data = await res.json()
      setDocDetails(data)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-foreground selection:text-background p-8">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/" className="hover:bg-foreground hover:text-background p-2 transition-colors border-2 border-transparent hover:border-foreground">
          <ArrowLeft className="size-6" />
        </Link>
        <div>
          <h1 className="text-4xl font-pixel uppercase tracking-tight">[System Admin]</h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground mt-2 flex items-center gap-2">
            <Activity className="size-4" /> Workflow Telemetry & Active Sessions
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Workflows List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-4 border-b-2 border-foreground pb-2">Active Workflows</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin size-4" /> Loading telemetry...</div>
          ) : workflows.map(w => (
            <button
              key={w.id}
              onClick={() => loadDetails(w.id)}
              className={`w-full text-left p-4 border-2 transition-all ${
                selectedDocId === w.id 
                  ? 'border-foreground bg-foreground text-background' 
                  : 'border-border/50 hover:border-foreground'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs opacity-70 font-bold">{w.id.split('-')[0]}</span>
                <span className={`text-[10px] uppercase px-2 py-0.5 font-bold ${w.status === 'processing' ? 'bg-orange-500/20 text-orange-500 animate-pulse' : 'bg-green-500/20 text-green-500'}`}>
                  {w.status}
                </span>
              </div>
              <div className="font-bold uppercase tracking-wide truncate">{w.facility_name}</div>
              <div className="text-xs opacity-70 mt-1">{w.form_type}</div>
            </button>
          ))}
        </div>

        {/* Workflow Details */}
        <div className="lg:col-span-2 border-2 border-foreground bg-secondary/10 min-h-[600px] relative p-6">
          {!selectedDocId ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground uppercase tracking-widest text-sm flex-col gap-4">
              <Terminal className="size-8 opacity-50" />
              Select a workflow to inspect telemetry
            </div>
          ) : detailsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-foreground uppercase tracking-widest text-sm flex-col gap-4">
              <Loader2 className="animate-spin size-8" />
              Fetching Agent Logs...
            </div>
          ) : docDetails ? (
            <div className="space-y-8">
              <div className="border-b-2 border-foreground pb-4">
                <h3 className="text-2xl font-bold uppercase tracking-widest">{docDetails.document.facility_name}</h3>
                <div className="text-sm mt-2 text-muted-foreground">ID: {docDetails.document.id}</div>
              </div>

              <div className="space-y-6">
                <h4 className="font-bold uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="size-4" /> Agent Outputs
                </h4>
                
                {docDetails.agents.map(agent => (
                  <div key={agent.id} className="border-2 border-foreground bg-background p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-foreground text-background text-[10px] font-bold px-2 py-1 uppercase">
                      {agent.processing_time_ms}ms
                    </div>
                    <div className="font-pixel uppercase text-xl mb-4">{agent.agent_name}</div>
                    
                    {agent.agent_name === 'researcher' && agent.content?._telemetry ? (
                      <div className="mb-6 p-4 border-2 border-orange-500/50 bg-orange-500/10">
                        <div className="flex items-center gap-2 text-orange-500 font-bold uppercase text-xs mb-3">
                          <Search className="size-4" /> Deep Web Search Telemetry
                        </div>
                        <div className="mb-4">
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Generated Query:</span>
                          <code className="bg-background px-2 py-1 text-orange-400 font-bold border border-orange-500/30">"{agent.content._telemetry.search_query}"</code>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-2">Tavily Raw Results:</span>
                          <div className="max-h-48 overflow-y-auto border border-border/50 bg-background/50 p-3 text-[10px] scrollbar-thin">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(agent.content._telemetry.search_results, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-xs max-h-64 overflow-y-auto scrollbar-thin pr-2">
                      <pre className="whitespace-pre-wrap opacity-70">
                        {JSON.stringify(
                          Object.fromEntries(Object.entries(agent.content).filter(([k]) => k !== '_telemetry')), 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                ))}
                
                {docDetails.agents.length === 0 && (
                  <div className="text-muted-foreground italic text-sm">No agent telemetry recorded yet.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
