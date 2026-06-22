import { ArrowRightLeft, Landmark, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';
import type { MobileNavigationItem } from '../types';

export const MOBILE_NAV_ITEMS: readonly MobileNavigationItem[] = [
  { icon: LayoutDashboard, label: 'Inicio', href: '/dashboard' },
  { icon: Landmark, label: 'Bancos', href: '/tesoreria/banking' },
  { icon: ArrowRightLeft, label: 'Conciliar', href: '/tesoreria/reconciliations', isPrimary: true },
  { icon: ShieldCheck, label: 'Compliance', href: '/cumplimiento/compliance' },
  { icon: Settings, label: 'Ajustes', href: '/configuracion' },
];
