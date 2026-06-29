import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Sparkles, Check, X, TerminalSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useMemo } from 'react'
import { ReportVisualizer } from './report-visualizer'

export function ArtifactSidebar({ 
  content, 
  title = "Interactive Report",
  isGpu = false,
  onClose 
}: { 
  content: string; 
  title?: string;
  isGpu?: boolean;
  onClose?: () => void 
}) {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const [width, setWidth] = useState(500)

  // Extract visualization JSON block if it exists
  const { cleanContent, visualizationJson } = useMemo(() => {
    let clean = content;
    let jsonText = null;
    const match = content.match(/```json visualize\n([\s\S]*?)\n```/);
    if (match) {
      jsonText = match[1];
      clean = content.replace(match[0], '');
    }
    return { cleanContent: clean, visualizationJson: jsonText };
  }, [content]);

  useEffect(() => {
    // Clamp initial width on mount
    setWidth(prev => Math.max(window.innerWidth * 0.30, Math.min(window.innerWidth * 0.60, prev)))
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = Math.max(window.innerWidth * 0.30, Math.min(window.innerWidth * 0.60, window.innerWidth - e.clientX))
      setWidth(newWidth)
    }
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleMouseDown = () => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <AnimatePresence>
      {content ? (
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width }}
          className="h-full border-l-2 border-foreground bg-background flex flex-col shrink-0 shadow-2xl relative z-40 overflow-hidden"
        >
          {/* Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--processing)]/50 active:bg-[var(--processing)] z-50 transition-colors"
          />

          <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b-2 border-foreground shrink-0 w-full pl-6">
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-foreground font-bold flex items-center gap-2 truncate">
              {isGpu ? <TerminalSquare className="size-3 text-foreground" /> : <Sparkles className="size-3 text-foreground" />}
              {title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => alert("Artifact saved to your Supabase workspace!")}
                className="flex items-center gap-1.5 px-3 py-1 bg-foreground text-background text-[10px] uppercase font-mono tracking-wider transition-transform hover:scale-105 active:scale-95"
              >
                <Check className="size-3" /> Save
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-1 border-2 border-transparent hover:border-foreground text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin w-full">
            <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:font-pixel prose-headings:text-foreground prose-headings:tracking-tight prose-headings:uppercase prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-a:text-blue-400 prose-table:border-2 prose-table:border-foreground prose-th:bg-foreground prose-th:text-background prose-th:p-3 prose-th:font-mono prose-th:uppercase prose-th:tracking-wider prose-td:p-3 prose-td:border-b-2 prose-td:border-foreground prose-tr:border-b-2 prose-tr:border-foreground prose-p:font-mono prose-li:font-mono">
              {isGpu ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">{cleanContent}</pre>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                >
                  {cleanContent}
                </ReactMarkdown>
              )}
            </div>
            {visualizationJson && (
              <ReportVisualizer jsonText={visualizationJson} />
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
