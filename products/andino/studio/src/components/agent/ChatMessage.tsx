'use client';

import type { AgentMessage } from '@/types/drone';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatMessage({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 items-start animate-fade-in ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isUser
            ? 'bg-bg-elevated text-text-secondary'
            : 'bg-accent-400/20 text-accent-400'
        }`}
      >
        {isUser ? 'U' : '◆'}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`rounded-[10px] px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-accent-400/8 border-r-2 border-accent-400/30 text-text-primary'
              : 'bg-bg-surface border-l-2 border-accent-400 text-text-primary'
          }`}
        >
          {message.text}
        </div>
        <div className="text-xs text-text-muted mt-1 px-1 font-mono">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
