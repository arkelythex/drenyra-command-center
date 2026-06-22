import { AlertCircle, Download, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Report } from './types';

interface ReportCardProps {
  report: Report;
  onOpen: () => void;
  onDownload: () => void;
}

export const ReportCard = ({ report, onOpen, onDownload }: ReportCardProps) => {
  return (
    <div onClick={onOpen} className="group flex-1 cursor-pointer">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card/80 shadow-[0_18px_36px_-14px_rgba(0,0,0,0.24)] transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:bg-card">
        <div className="relative h-56 overflow-hidden bg-foreground/10 transition-[height,background-color] duration-500 group-hover:h-[14.5rem]">
          <img
            src={report.coverImage}
            alt={report.title}
            className="h-full w-full object-cover grayscale opacity-40 transition-[transform,filter,opacity] duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-100" />

          <div className="absolute left-6 top-6 z-10">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/90 px-4 py-2 text-3xs font-black uppercase tracking-[0.2em] text-foreground shadow-lg backdrop-blur-md">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {report.type}
            </div>
          </div>

          {report.hasInconsistencies && (
            <div className="absolute right-6 top-6 z-10 rounded-full border border-background/40 bg-red-500 p-2.5 text-destructive-foreground shadow-xl ring-4 ring-red-500/10">
              <AlertCircle size={16} strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="relative flex flex-1 flex-col p-8">
          <div className="mb-6 h-1 w-16 rounded-full bg-primary/20 transition-[width,background-color] duration-500 group-hover:w-28 group-hover:bg-primary" />

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xs font-black uppercase tracking-[0.25em] text-muted-foreground/80">
                {report.month} {report.year}
              </span>
              <Badge variant={report.isPublished ? 'success' : 'warning'} className="h-6">
                {report.isPublished ? 'Publicado' : 'Borrador'}
              </Badge>
            </div>

            <h3 className="line-clamp-2 text-lg font-black uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              {report.title}
            </h3>

            <p className="line-clamp-2 text-label font-medium uppercase leading-relaxed tracking-wider text-muted-foreground/90">
              Analisis fiscal cognitivo generado automaticamente basado en trazabilidad bancaria.
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-2xs font-black text-primary shadow-inner">
                {report.authorInitials}
              </div>
              <div className="flex flex-col">
                <span className="text-2xs font-black uppercase leading-none tracking-widest text-foreground">
                  {report.author}
                </span>
                <span className="mt-1.5 text-3xs font-black uppercase leading-none tracking-widest text-muted-foreground/70">
                  Analista Core
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="Descargar"
                onClick={(event) => {
                  event.stopPropagation();
                  onDownload();
                }}
                className="h-9 w-9 rounded-xl border-border text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:bg-primary/5 hover:text-primary"
              >
                <Download size={16} strokeWidth={2.5} />
              </Button>
              {report.commentCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-3 py-1.5 text-2xs font-black text-primary shadow-inner">
                  <MessageSquare size={12} strokeWidth={3} />
                  <span>{report.commentCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
