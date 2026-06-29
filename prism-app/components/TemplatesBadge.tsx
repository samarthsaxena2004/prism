"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function TemplatesBadge() {
  return (
    <Link href="/templates" className="fixed bottom-8 right-8 z-50 block">
      <div className="relative group cursor-pointer w-36 h-36 flex items-center justify-center transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1">
        
        {/* Starburst SVG Background */}
        <div className="absolute inset-0 drop-shadow-[0_8px_16px_rgba(59,130,246,0.3)] transition-transform duration-700 ease-in-out group-hover:scale-105">
          <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_40s_linear_infinite]">
            <defs>
              <linearGradient id="badge-gradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#DBEAFE" />
                <stop offset="50%" stopColor="#C7D2FE" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <g fill="url(#badge-gradient)">
              <rect x="30" y="30" width="140" height="140" rx="20" transform="rotate(0 100 100)" />
              <rect x="30" y="30" width="140" height="140" rx="20" transform="rotate(22.5 100 100)" />
              <rect x="30" y="30" width="140" height="140" rx="20" transform="rotate(45 100 100)" />
              <rect x="30" y="30" width="140" height="140" rx="20" transform="rotate(67.5 100 100)" />
            </g>
          </svg>
        </div>

        {/* Text Content */}
        <div className="relative flex flex-col items-center justify-center text-center p-4 -rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out z-10 pointer-events-none">
          <Sparkles className="w-5 h-5 text-indigo-950/80 mb-1 animate-pulse" />
          <div className="flex flex-col items-center">
            <span className="text-indigo-950/70 font-mono text-[9px] uppercase tracking-[0.2em] font-semibold mb-0.5">Try a</span>
            <span className="text-indigo-950 font-black leading-none tracking-tight text-base uppercase font-mono drop-shadow-sm">
              Template!
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 opacity-90">
            <span className="text-indigo-950/80 text-[8.5px] font-bold uppercase tracking-widest">Medical</span>
            <div className="w-1 h-1 rounded-full bg-indigo-950/40" />
            <span className="text-indigo-950/80 text-[8.5px] font-bold uppercase tracking-widest">Finance</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
