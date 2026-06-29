"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Activity, Landmark, Truck } from "lucide-react";
import { motion } from "framer-motion";

const templates = [
  {
    id: "medical",
    title: "Medical Record",
    description: "Extract vital signs, patient info, and session data from a handwritten clinical dialysis flow sheet.",
    icon: Activity,
    prompt: "Extract all clinical observations from this dialysis record.",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    color: "text-green-700 dark:text-green-400",
  },
  {
    id: "financial",
    title: "Financial Statement",
    description: "Analyze financial tables, balance sheets, and quarterly reports for structured extraction.",
    icon: Landmark,
    prompt: "Extract all Q3 financial metrics into a structured JSON.",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    color: "text-blue-700 dark:text-blue-400",
  },
  {
    id: "gov",
    title: "Government Form",
    description: "Process standardized tax forms, applications, and ID documents securely.",
    icon: FileText,
    prompt: "Extract applicant name, ID number, and declared income.",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    color: "text-purple-700 dark:text-purple-400",
  },
  {
    id: "logistics",
    title: "Logistics Waybill",
    description: "Parse shipping manifests, tracking numbers, and delivery signatures.",
    icon: Truck,
    prompt: "Extract shipping origin, destination, weight, and tracking ID.",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    color: "text-orange-700 dark:text-orange-400",
  }
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 font-mono">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-pixel uppercase tracking-tight mb-2">Prompt Templates</h1>
            <p className="text-muted-foreground">Example documents and extraction prompts to test with the Swarm.</p>
          </div>
          <Link 
            href="/analyze" 
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity bg-foreground text-background px-4 py-2 rounded shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Chat
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template, idx) => (
            <motion.div 
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 border-2 ${template.border} ${template.bg} rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.4)] transition-all cursor-pointer`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-background shadow-sm ${template.color}`}>
                  <template.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-sans tracking-tight">{template.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
                </div>
              </div>
              
              <div className="bg-background/50 dark:bg-background/30 p-4 rounded-md border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Suggested Prompt</span>
                <code className="text-sm font-mono text-foreground break-words">
                  "{template.prompt}"
                </code>
              </div>

              <div className="mt-6 flex justify-end">
                <Link 
                  href="/analyze" 
                  className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded bg-background shadow-sm hover:bg-muted/50 border ${template.border} ${template.color} transition-colors`}
                >
                  Try this template &rarr;
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
