/**
 * useMobileMenu Hook
 * Responsabilidad: Estado del menú mobile + scroll lock + Escape + focus trap básico
 *
 * Buenas prácticas aplicadas (NN/g + WCAG 2.1):
 * - Lock de scroll en body cuando está abierto
 * - Escape cierra el menú
 * - Restaura foco al elemento que lo abrió
 * - Mueve foco al primer elemento interactivo al abrir
 * - Focus trap con Tab/Shift+Tab
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseMobileMenuReturn {
  readonly isOpen: boolean;
  readonly toggle: () => void;
  readonly close: () => void;
  readonly open: () => void;
  readonly menuRef: React.RefObject<HTMLDivElement | null>;
  readonly menuId: string;
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useMobileMenu(): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const menuId = "mobile-nav-menu";

  const open = useCallback(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Restore focus when closing
  useEffect(() => {
    if (!isOpen && lastFocusedRef.current) {
      // Small delay to allow transition to finish
      const timer = setTimeout(() => {
        lastFocusedRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Move focus to first focusable element when opening
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const timer = setTimeout(() => {
        const focusable = menuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key closes menu
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    function handleTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || !menuRef.current) return;

      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  return { isOpen, toggle, close, open, menuRef, menuId, triggerRef };
}
