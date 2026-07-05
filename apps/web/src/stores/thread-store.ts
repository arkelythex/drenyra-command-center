import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";

export type ThreadStatus = "active" | "archived" | "pinned";

export interface Thread {
	id: string;
	title: string;
	status: ThreadStatus;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
	snippet: string;
	forkedFrom?: string;
	brainThreadId?: string;
	context?: {
		ruc?: string;
		period?: string;
		skills?: string[];
	};
}

interface ThreadStoreState {
	threads: Thread[];
	activeThreadId: string | null;
	setActiveThread: (id: string | null) => void;
	createThread: (title?: string) => Thread;
	archiveThread: (id: string) => void;
	unarchiveThread: (id: string) => void;
	pinThread: (id: string) => void;
	deleteThread: (id: string) => void;
	addThread: (thread: Thread) => void;
	updateThread: (id: string, updates: Partial<Thread>) => void;
	forkThread: (id: string) => Thread;
	renameThread: (id: string, title: string) => void;
	setThreadBrainId: (id: string, brainThreadId: string) => void;
	reorderThreads: (orderedIds: string[]) => void;
}

export const useThreadStore = create<ThreadStoreState>()(
	persist(
		(set, get) => ({
			threads: [],
			activeThreadId: null,

			setActiveThread: (id) => set({ activeThreadId: id }),

			createThread: (title) => {
				const now = new Date().toISOString();
				const thread: Thread = {
					id: generateId(),
					title: title ?? "New Chat",
					status: "active",
					createdAt: now,
					updatedAt: now,
					messageCount: 0,
					snippet: "",
				};
				set((state) => ({
					threads: [thread, ...state.threads],
					activeThreadId: thread.id,
				}));
				return thread;
			},

			archiveThread: (id) =>
				set((state) => ({
					threads: state.threads.map((t) =>
						t.id === id
							? {
									...t,
									status: "archived" as const,
									updatedAt: new Date().toISOString(),
								}
							: t,
					),
				})),

			unarchiveThread: (id) =>
				set((state) => ({
					threads: state.threads.map((t) =>
						t.id === id
							? {
									...t,
									status: "active" as const,
									updatedAt: new Date().toISOString(),
								}
							: t,
					),
				})),

			pinThread: (id) =>
				set((state) => ({
					threads: state.threads.map((t) =>
						t.id === id
							? {
									...t,
									status: "pinned" as const,
									updatedAt: new Date().toISOString(),
								}
							: t,
					),
				})),

			deleteThread: (id) =>
				set((state) => ({
					threads: state.threads.filter((t) => t.id !== id),
					activeThreadId:
						state.activeThreadId === id ? null : state.activeThreadId,
				})),

			addThread: (thread) =>
				set((state) => ({
					threads: [thread, ...state.threads],
				})),

			updateThread: (id, updates) =>
				set((state) => ({
					threads: state.threads.map((t) =>
						t.id === id
							? { ...t, ...updates, updatedAt: new Date().toISOString() }
							: t,
					),
				})),

			forkThread: (id) => {
				const original = get().threads.find((t) => t.id === id);
				if (!original) throw new Error(`Thread ${id} not found`);
				const now = new Date().toISOString();
				const thread: Thread = {
					id: generateId(),
					title: `Fork: ${original.title}`,
					status: "active",
					createdAt: now,
					updatedAt: now,
					messageCount: 0,
					snippet: "",
					forkedFrom: id,
					context: original.context ? { ...original.context } : undefined,
				};
				set((state) => ({
					threads: [thread, ...state.threads],
					activeThreadId: thread.id,
				}));
				return thread;
			},

			renameThread: (id, title) =>
				set((state) => ({
					threads: state.threads.map((t) =>
						t.id === id
							? { ...t, title, updatedAt: new Date().toISOString() }
							: t,
					),
				})),

			setThreadBrainId: (id, brainThreadId) =>
				set((state) => ({
					threads: state.threads.map((t) =>
						t.id === id
							? { ...t, brainThreadId, updatedAt: new Date().toISOString() }
							: t,
					),
				})),

			reorderThreads: (orderedIds) =>
				set((state) => {
					const threadMap = new Map(state.threads.map((t) => [t.id, t]));
					const reordered = orderedIds
						.filter((id) => threadMap.has(id))
						.map((id) => threadMap.get(id)!);
					const remaining = state.threads.filter(
						(t) => !orderedIds.includes(t.id),
					);
					return { threads: [...reordered, ...remaining] };
				}),
		}),
		{
			name: "codex-thread-state",
			partialize: (state) => ({
				threads: state.threads,
				activeThreadId: state.activeThreadId,
			}),
		},
	),
);
