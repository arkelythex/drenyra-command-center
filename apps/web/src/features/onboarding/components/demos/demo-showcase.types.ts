import type React from 'react';

export type DemoId = 'igv-error' | 'sire-auto' | 'detraccion-omitida';

export interface ConversationStep {
  index: number;
  role: 'user' | 'assistant';
  content: string;
  artifactType?: string | null;
  artifactPayload?: Record<string, unknown> | null;
}

export interface OutcomeMetric {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface DemoOutcome {
  metrics: OutcomeMetric[];
  amountSaved: number;
  resolutionTimeSeconds: number;
  legalRef: string;
}

export interface DemoCard {
  id: DemoId;
  title: string;
  tagline: string;
  category: string;
  amountSaved: number;
  resolutionTimeSeconds: number;
  icon: React.ElementType;
  accentColor: string;
}
