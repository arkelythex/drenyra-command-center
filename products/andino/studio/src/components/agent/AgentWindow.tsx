'use client';

import { useState, useRef, useEffect } from 'react';
import type { AgentMessage, Mission } from '@/types/drone';
import { mockMessages, mockMissions } from '@/lib/mock-data';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MissionHistory from './MissionHistory';

const mockReply: AgentMessage = {
  id: 'msg-reply',
  role: 'assistant',
  text: "I've analyzed the mission requirements for high-altitude mining inspection. Based on the 4000m altitude constraint, I recommend optimizing for thrust-to-weight ratio above 2.0. The current Pareto-optimal design uses a quad configuration with 280mm arms and 13\" props. Want me to evolve this further?",
  timestamp: '',
};

let msgCounter = mockMessages.length + 1;

export default function AgentWindow() {
  const [messages, setMessages] = useState<AgentMessage[]>(mockMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [missions] = useState<Mission[]>(mockMissions);
  const [activeMissionId, setActiveMissionId] = useState(mockMissions[0].id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  function handleSend(text: string) {
    const userMsg: AgentMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { ...mockReply, id: `msg-${++msgCounter}`, timestamp: new Date().toISOString() },
      ]);
      setIsThinking(false);
    }, 1500);
  }

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r border-border-subtle bg-bg-void flex flex-col">
        <MissionHistory
          missions={missions}
          activeId={activeMissionId}
          onSelect={setActiveMissionId}
        />
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-bg-primary">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isThinking && (
              <div className="flex gap-3 items-start animate-fade-in">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-accent-400/20 text-accent-400">
                  ◆
                </div>
                <div className="bg-bg-surface border-l-2 border-accent-400 rounded-[10px] px-4 py-2.5 text-sm text-text-muted">
                  Thinking
                  <span className="inline-flex gap-0.5 ml-1">
                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
        <ChatInput onSend={handleSend} disabled={isThinking} />
      </div>
    </div>
  );
}
