/**
 * useNotifications — Zustand store para notificaciones del Command Center.
 *
 * Usa sonner (ya instalado en el proyecto) para toasts visibles en UI
 * y mantiene un historial persistente de notificaciones en memoria.
 *
 * @since Jun 2026
 */

import { create } from "zustand";

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
	| "agent_complete"
	| "case_created"
	| "case_status"
	| "approval_requested"
	| "approval_decided"
	| "evidence_added"
	| "error"
	| "info";

export interface NotificationAction {
	label: string;
	onClick: () => void;
	variant?: "primary" | "secondary" | "danger";
}

export interface NotificationEntry {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
	caseId?: string;
	action?: NotificationAction;
	secondaryAction?: NotificationAction;
}

// ── Store ────────────────────────────────────────────────────────────────────

interface NotificationsState {
	/** Historial completo (máx 50 entradas) */
	history: NotificationEntry[];
	/** IDs sin leer */
	unreadIds: Set<string>;

	// Actions
	add: (entry: Omit<NotificationEntry, "id" | "timestamp" | "read">) => string;
	dismiss: (id: string) => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	clearAll: () => void;
	getUnreadCount: () => number;
	getLatest: (count?: number) => NotificationEntry[];
}

const MAX_HISTORY = 50;

export const useNotifications = create<NotificationsState>((set, get) => ({
	history: [],
	unreadIds: new Set(),

	add: (entry) => {
		const id = crypto.randomUUID();
		const full: NotificationEntry = {
			...entry,
			id,
			timestamp: new Date(),
			read: false,
		};

		set((state) => {
			const next = [full, ...state.history].slice(0, MAX_HISTORY);
			const unread = new Set(state.unreadIds);
			unread.add(id);
			return { history: next, unreadIds: unread };
		});

		return id;
	},

	dismiss: (id) => {
		set((state) => {
			const unread = new Set(state.unreadIds);
			unread.delete(id);
			return {
				history: state.history.filter((n) => n.id !== id),
				unreadIds: unread,
			};
		});
	},

	markAsRead: (id) => {
		set((state) => {
			const unread = new Set(state.unreadIds);
			unread.delete(id);
			return {
				history: state.history.map((n) =>
					n.id === id ? { ...n, read: true } : n,
				),
				unreadIds: unread,
			};
		});
	},

	markAllAsRead: () => {
		set((state) => ({
			history: state.history.map((n) => ({ ...n, read: true })),
			unreadIds: new Set(),
		}));
	},

	clearAll: () => {
		set({ history: [], unreadIds: new Set() });
	},

	getUnreadCount: () => get().unreadIds.size,

	getLatest: (count = 5) => get().history.slice(0, count),
}));

// ── Sonner toast factory ────────────────────────────────────────────────────

import { toast } from "sonner";

/**
 * Crea una notificación + toast (sonner) en un solo paso.
 * Usá esto desde mutations y callbacks del CommandCenter.
 */
export function notify(
	entry: Omit<NotificationEntry, "id" | "timestamp" | "read">,
): string {
	const id = useNotifications.getState().add(entry);

	const sonnerType =
		entry.type === "error"
			? "error"
			: entry.type === "agent_complete" || entry.type === "case_created"
				? "success"
				: entry.type === "approval_requested"
					? "warning"
					: undefined;

	if (sonnerType) {
		toast[sonnerType](entry.title, {
			description: entry.message,
			duration: 5000,
			action: entry.action
				? {
						label: entry.action.label,
						onClick: entry.action.onClick,
					}
				: undefined,
			cancel: entry.secondaryAction
				? {
						label: entry.secondaryAction.label,
						onClick: entry.secondaryAction.onClick,
					}
				: undefined,
			onDismiss: () => useNotifications.getState().markAsRead(id),
		});
	} else {
		toast(entry.title, {
			description: entry.message,
			duration: 4000,
			action: entry.action
				? {
						label: entry.action.label,
						onClick: entry.action.onClick,
					}
				: undefined,
			onDismiss: () => useNotifications.getState().markAsRead(id),
		});
	}

	return id;
}
