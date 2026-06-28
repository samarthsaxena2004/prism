"use client";

interface Props {
  content: string;
}

export default function IntelBrief({ content }: Props) {
  if (!content) return null;

  // Render markdown-lite: ## headers, bullet points, bold
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm text-[#c4cae8] leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="font-semibold text-[#f472b6] text-xs tracking-widest uppercase mt-3 first:mt-0">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <p key={i} className="flex gap-2 text-xs">
              <span className="text-[#f472b6] flex-shrink-0">·</span>
              <span>{line.slice(2)}</span>
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs">{line}</p>;
      })}
    </div>
  );
}
