import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private listeners: Set<(shortcuts: KeyboardShortcut[]) => void> = new Set();

  register(shortcut: KeyboardShortcut) {
    const key = this.createKey(shortcut);
    this.shortcuts.set(key, shortcut);
    this.notifyListeners();
  }

  unregister(shortcut: KeyboardShortcut) {
    const key = this.createKey(shortcut);
    this.shortcuts.delete(key);
    this.notifyListeners();
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  handleKeyDown(event: KeyboardEvent) {
    const key = this.createKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  subscribe(listener: (shortcuts: KeyboardShortcut[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private createKey(shortcut: KeyboardShortcut): string {
    const modifiers = [
      shortcut.ctrl && 'ctrl',
      shortcut.shift && 'shift',
      shortcut.alt && 'alt',
      shortcut.meta && 'meta'
    ].filter(Boolean);

    return [...modifiers, shortcut.key.toLowerCase()].join('+');
  }

  private createKeyFromEvent(event: KeyboardEvent): string {
    const modifiers = [
      event.ctrlKey && 'ctrl',
      event.shiftKey && 'shift',
      event.altKey && 'alt',
      event.metaKey && 'meta'
    ].filter(Boolean);

    return [...modifiers, event.key.toLowerCase()].join('+');
  }

  private notifyListeners() {
    const shortcuts = this.getAllShortcuts();
    this.listeners.forEach(listener => listener(shortcuts));
  }
}

// Global instance
export const keyboardShortcuts = new KeyboardShortcutsManager();

// React hook
export const useKeyboardShortcuts = () => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keyboardShortcuts.handleKeyDown(event);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    keyboardShortcuts.register(shortcut);
    return () => keyboardShortcuts.unregister(shortcut);
  }, []);

  return {
    registerShortcut,
    getAllShortcuts: () => keyboardShortcuts.getAllShortcuts(),
    getShortcutsByCategory: (category: string) => keyboardShortcuts.getShortcutsByCategory(category)
  };
};