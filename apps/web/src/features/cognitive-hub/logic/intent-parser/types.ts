export type HubIntent = 'command' | 'query' | 'task' | 'navigation';

export interface NavigationIntent {
  type: 'navigation';
  target: string;
  title: string;
  params?: Record<string, string>;
}

export interface SlashCommandConfig {
  path: string;
  title: string;
  description: string;
}

export interface NavigationPattern {
  patterns: RegExp[];
  target: string;
  title: string;
  extractParams?: (input: string) => Record<string, string> | undefined;
}
