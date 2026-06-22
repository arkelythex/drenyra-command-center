import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationStep } from './demo-showcase.types';

interface ConversationBubbleProps {
  step: ConversationStep;
  visible: boolean;
}

export const ConversationBubble = ({ step, visible }: ConversationBubbleProps) => (
  visible ? (
    <div
      className={cn('flex gap-3', step.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border text-2xs font-black',
          step.role === 'user'
            ? 'border-foreground/50 bg-foreground text-background'
            : 'border-border bg-foreground/5 text-foreground/60',
        )}
      >
        {step.role === 'user' ? 'U' : 'AI'}
      </div>

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed',
          step.role === 'user'
            ? 'rounded-tr-sm bg-foreground text-background'
            : 'rounded-tl-sm border border-border/20 bg-foreground/[0.04] text-foreground/80',
        )}
      >
        <pre className="whitespace-pre-wrap font-sans">{step.content}</pre>

        {step.artifactType ? (
          <div className="mt-3 flex items-center gap-2 border-t border-current/10 pt-3 text-3xs font-black uppercase tracking-widest opacity-60">
            <Sparkles size={10} />
            {step.artifactType.replace('_', ' ')} generado
          </div>
        ) : null}
      </div>
    </div>
  ) : null
);
