import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  source: 'FFI' | 'SQL' | 'SUNAT' | 'AUTH';
  message: string;
  level: 'info' | 'warn' | 'error';
}

/**
 * IntelligenceStream: Low-level telemetry terminal.
 * Binary Elite 2026 - Engineering Grade.
 */
export const IntelligenceStream = ({ isOpen }: { isOpen: boolean }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulated live logs for engineering feel
  useEffect(() => {
    if (!isOpen) return;

    const sources: LogEntry['source'][] = ['FFI', 'SQL', 'SUNAT', 'AUTH'];
    const messages = [
      'Executing Rust FFI: validate_ubl_consistency()',
      'SELECT * FROM "ledger_entries" WHERE "company_id" = $1',
      'SUNAT API: GET /v1/contribuyentes/validar',
      'Memory cached: session_token validated in 0.2ms',
      'Neural Swarm: Arbiter consensus reached on Run #442'
    ];

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        level: Math.random() > 0.9 ? 'warn' : 'info'
      };
      setLogs(prev => [...prev.slice(-50), newLog]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="z-30 flex h-full flex-col border-l border-border/20 bg-background/95 font-mono"
        >
          <header className="flex items-center justify-between border-b border-border/80 bg-card/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Terminal size={12} className="text-primary" />
              <span className="text-2xs font-black uppercase tracking-widest text-foreground/60">Intelligence Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[var(--premium-success)] animate-pulse" />
              <span className="text-[8px] text-[var(--premium-success)] uppercase">Live</span>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar selection:bg-primary/30"
          >
            {logs.map((log) => (
              <div key={log.id} className="text-2xs leading-relaxed group">
                <span className="mr-2 text-muted-foreground/45">[{log.timestamp}]</span>
                <span className={cn(
                  "mr-2 rounded px-1.5 py-0.5 font-black",
                  log.source === 'FFI' ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                )}>{log.source}</span>
                <span className={cn(
                  "transition-colors",
                  log.level === 'warn' ? "text-amber-500" : "text-foreground/70 group-hover:text-foreground"
                )}>{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="flex h-full items-center justify-center text-3xs uppercase tracking-[0.3em] text-muted-foreground/35">
                Initializing Link...
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-border/80 bg-muted/10 p-4">
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground/45">Buffer: 50/500</span>
            <button
              onClick={() => setLogs([])}
              className="text-[8px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
            >
              Clear Buffer
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
