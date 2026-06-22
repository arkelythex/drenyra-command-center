import type { RefObject } from 'react';
import type { ArtifactInteractionEvent } from '@/features/artifacts/types/artifact.types';
import type { CommandItem } from './constants';

export type OmniMode = 'default' | 'navigation' | 'actions' | 'voice';

export interface EmbeddedOmniAgentProps {
  activeTraceId: string | null;
  artifactEvents: ArtifactInteractionEvent[];
  clearArtifactEvents: () => void;
  cot: string[];
  ghostCompletion: string;
  ghostSuggestion: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isThinking: boolean;
  onSubmit: () => void;
  query: string;
  setQuery: (value: string) => void;
}

export interface FloatingOmniAgentProps {
  activeTraceId: string | null;
  cot: string[];
  filteredList: CommandItem[];
  ghostCompletion: string;
  ghostSuggestion: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isThinking: boolean;
  mode: OmniMode;
  onSubmit: () => void;
  placeholder: string;
  query: string;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  selectedIndex: number;
  setQuery: (value: string) => void;
  toggleActions: () => void;
  handleVoice: () => void;
  navigateToItem: (item: CommandItem) => void;
}
