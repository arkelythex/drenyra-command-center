import {
	BarChart3,
	CalendarCheck,
	Landmark,
	LayoutDashboard,
	PanelLeftClose,
	PanelRightClose,
	Plus,
	Receipt,
	Settings,
	ShieldCheck,
	Terminal,
	TrendingUp,
} from "lucide-react";
import { useUIStore } from "../../../store/ui-store";
import { useThreadStore } from "../../../stores/thread-store";
import type { ActionItem, NavTarget } from "./CommandPalette.types";

// ---------------------------------------------------------------------------
// Navigation targets
// ---------------------------------------------------------------------------

export const NAV_TARGETS: NavTarget[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		description: "Overview operativo, alertas y colas prioritarias",
		path: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		id: "banking",
		label: "Bancos y caja",
		description: "Cuentas, movimientos y saldos",
		path: "/tesoreria/banking",
		icon: Landmark,
	},
	{
		id: "invoices",
		label: "Cobros",
		description: "Facturas emitidas y cobranza",
		path: "/facturacion/invoices",
		icon: Receipt,
	},
	{
		id: "cashflow",
		label: "Flujo de caja",
		description: "Liquidez y proyeccion inmediata",
		path: "/cashflow",
		icon: TrendingUp,
	},
	{
		id: "cierre-mensual",
		label: "Cierre Mensual",
		description: "Cierres contables mensuales y fiscalidad",
		path: "/contabilidad/cierre-mensual",
		icon: CalendarCheck,
	},
	{
		id: "reportes-financieros",
		label: "Reportes Financieros",
		description: "Informes financieros, balances y estados",
		path: "/reportes/financieros",
		icon: BarChart3,
	},
	{
		id: "compliance",
		label: "Cumplimiento fiscal",
		description: "Riesgos SUNAT y validaciones",
		path: "/cumplimiento/compliance",
		icon: ShieldCheck,
	},
	{
		id: "settings",
		label: "Configuración",
		description: "Empresa, seguridad y preferencias",
		path: "/configuracion",
		icon: Settings,
	},
];

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

export const ACTION_ITEMS: ActionItem[] = [
	{
		id: "new-thread",
		label: "New Thread",
		description: "Create a new conversation thread",
		icon: Plus,
		action: () => useThreadStore.getState().createThread("New Chat"),
	},
	{
		id: "open-terminal",
		label: "Open Terminal",
		description: "Toggle the terminal panel",
		icon: Terminal,
		action: () => useUIStore.getState().toggleTerminal(),
	},
	{
		id: "toggle-sidebar",
		label: "Toggle Sidebar",
		description: "Show or hide the thread sidebar",
		icon: PanelLeftClose,
		action: () => useUIStore.getState().toggleSidebar(),
	},
	{
		id: "toggle-right-panel",
		label: "Toggle Right Panel",
		description: "Show or hide the right panel",
		icon: PanelRightClose,
		action: () => useUIStore.getState().toggleRightRail(),
	},
];

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

export function CommandPaletteStyles() {
	return (
		<style>{`
      [cmdk-overlay] {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 999;
      }

      [cmdk-dialog] {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        width: 90vw;
        max-width: 580px;
        max-height: 70vh;
        background: color-mix(in srgb, var(--surface-1) 95%, transparent);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid var(--border-subtle);
        border-radius: 12px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      [cmdk-input] {
        width: 100%;
        padding: 16px 20px;
        font-size: var(--text-base);
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border-subtle);
        color: var(--text-primary);
        outline: none;
        font-family: inherit;
      }

      [cmdk-input]:focus-visible {
        outline: 2px solid var(--accent-primary, #005fcc);
        outline-offset: 2px;
      }

      [cmdk-input]::placeholder {
        color: var(--text-tertiary);
      }

      [cmdk-list] {
        overflow-y: auto;
        overscroll-behavior: contain;
        max-height: 400px;
        padding: 8px;
      }

      [cmdk-group-heading] {
        padding: 8px 12px 4px;
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
        user-select: none;
      }

      [cmdk-item] {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: var(--text-sm);
        color: var(--text-primary);
        cursor: pointer;
        user-select: none;
        transition: background 0.1s ease;
      }

      [cmdk-item][data-selected="true"] {
        background: var(--surface-2);
      }

      [cmdk-item][data-disabled="true"] {
        opacity: 0.4;
        pointer-events: none;
      }

      [cmdk-empty] {
        padding: 32px 16px;
        text-align: center;
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }

      [cmdk-dialog][data-mobile="true"] {
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        transform: none;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
        border: none;
      }

      @media (max-width: 640px) {
        [cmdk-dialog] {
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          transform: none;
          width: 100%;
          max-width: 100%;
          max-height: 100%;
          border-radius: 0;
          border: none;
        }
      }

      .cmd-item-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: var(--surface-2);
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .cmd-item-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }

      .cmd-item-label {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
      }

      .cmd-item-description {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `}</style>
	);
}
