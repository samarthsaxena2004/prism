"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function TemplatesBadge() {
  return (
    <Link href="/templates" className="fixed bottom-8 right-8 z-50 block">
      <div className="relative group cursor-pointer w-36 h-36 flex items-center justify-center transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1">
        
        {/* Starburst SVG Background */}
        <div className="absolute inset-0 text-blue-200 transition-transform duration-500 ease-out -rotate-12 group-hover:rotate-0 drop-shadow-xl">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-current">
            <path d="M100 0L114.39 30.6865L147.553 15.4508L150.366 49.3135L183.189 45.399L171.729 76.518L200 90.4508L178.681 114.735L197.553 140.451L166.435 151.464L173.344 183.337L140.669 179.379L133.024 210L103.585 192.515L74.1465 210L66.5015 179.379L33.8268 183.337L40.7358 151.464L9.61741 140.451L28.4897 114.735L7.17062 90.4508L35.4419 76.518L23.9818 45.399L56.8048 49.3135L59.6174 15.4508L92.7801 30.6865L107.171 0H100Z" />
          </svg>
        </div>

        {/* Text Content */}
        <div className="relative flex flex-col items-center justify-center text-center p-4 -rotate-6 group-hover:-rotate-3 transition-transform duration-300 ease-out z-10">
          <Sparkles className="w-5 h-5 text-gray-900 mb-1" />
          <h3 className="text-gray-900 font-bold leading-tight tracking-tight text-sm uppercase font-mono shadow-sm">
            Try a<br/>Template!
          </h3>
          <p className="text-gray-900/80 text-[9px] font-medium mt-1.5 leading-tight uppercase tracking-wider">
            Medical &bull; Finance
          </p>
        </div>
      </div>
    </Link>
  );
}
