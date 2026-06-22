import { Keyboard, Plus, ScanLine, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import type { QuickAction, QuickRoute } from './types';

export const QUICK_ROUTES: readonly QuickRoute[] = [
  { label: 'Dashboard', path: '/', icon: Plus },
  { label: 'Invoices', path: '/facturacion/invoices', icon: Plus },
  { label: 'Inventory', path: '/inventory', icon: Plus },
  { label: 'Settings', path: '/settings', icon: Plus },
];

export const QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'scan-invoice', icon: ScanLine, label: 'Escanear Factura', color: 'from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)]' },
  { id: 'command-palette', icon: Search, label: 'Buscar / Comandos', color: 'from-slate-500 to-zinc-500' },
  { id: 'quick-analysis', icon: Sparkles, label: 'Analisis Rapido', color: 'from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)]' },
  { id: 'new-transaction', icon: TrendingUp, label: 'Nueva Transaccion', color: 'from-[var(--premium-success)] to-[rgba(var(--premium-success-rgb),0.25)]' },
  { id: 'invite-user', icon: Users, label: 'Invitar Usuario', color: 'from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)]' },
  { id: 'shortcuts', icon: Keyboard, label: 'Atajos de Teclado', color: 'from-gray-500 to-slate-500' },
];
