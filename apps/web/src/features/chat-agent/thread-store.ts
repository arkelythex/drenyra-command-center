/**
 * Thread Store — gestiona múltiples threads con suscripción basada en eventos.
 *
 * Cada thread es una conversación independiente.
 * Los proyectos agrupan threads relacionados.
 */

import type { ChatMessage } from "./agent-types";

export interface Thread {
	id: string;
	title: string;
	projectId?: string;
	messages: ChatMessage[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Project {
	id: string;
	name: string;
	path: string;
	threadIds: string[];
}

let threadCounter = 0;
let projectCounter = 0;

function nextThreadId() {
	threadCounter++;
	return `thread-${String(threadCounter).padStart(3, "0")}`;
}

function nextProjectId() {
	projectCounter++;
	return `proj-${String(projectCounter).padStart(3, "0")}`;
}

type Listener = () => void;

const INITIAL_THREADS: Thread[] = [
	{
		id: "thread-001",
		title: "Bienvenida",
		projectId: "proj-001",
		messages: [
			{
				id: "msg-001",
				role: "assistant" as const,
				text: '👋 **Bienvenido a Drenyra**\n\nSoy tu centro de comando fiscal. Escribí lo que necesitás en lenguaje natural.\n\n*"IGV de julio 2026"*, *"qué hay pendiente"*, *"qué sabes hacer"*',
				timestamp: new Date(),
			},
		],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "thread-002",
		title: "IGV Julio 2026",
		projectId: "proj-001",
		messages: [
			{
				id: "msg-010",
				role: "user" as const,
				text: "IGV de julio 2026 para RUC 20123456789",
				timestamp: new Date(Date.now() - 3600000),
			},
			{
				id: "msg-011",
				role: "assistant" as const,
				text: "📊 **IGV — 2026-07**\n\nRUC: 20123456789\nIGV Compra: PEN 18,234.50\nIGV Venta: PEN 9,876.00\nConfianza: 92%",
				timestamp: new Date(Date.now() - 3590000),
				richContent: {
					kind: "consulta-result",
					data: { igvCompra: 18234.5, igvVenta: 9876.0 },
				},
			},
		],
		createdAt: new Date(Date.now() - 3600000),
		updatedAt: new Date(Date.now() - 3590000),
	},
	{
		id: "thread-003",
		title: "Detracciones pendientes",
		messages: [
			{
				id: "msg-020",
				role: "user" as const,
				text: "qué hay pendiente",
				timestamp: new Date(Date.now() - 7200000),
			},
			{
				id: "msg-021",
				role: "assistant" as const,
				text: "📋 **2 recomendación(es) pendiente(s)**\n\nREC-001: Contabilizar IGV (PEN 18,234.50, 92%)\nREC-002: Aplicar detracción (PEN 450.00, 88%)",
				timestamp: new Date(Date.now() - 7190000),
				richContent: {
					kind: "approval-list",
					data: [
						{
							id: "REC-001",
							descripcion: "Contabilizar IGV",
							monto: 18234.5,
							moneda: "PEN",
							confianza: 0.92,
						},
						{
							id: "REC-002",
							descripcion: "Aplicar detracción",
							monto: 450,
							moneda: "PEN",
							confianza: 0.88,
						},
					],
				},
			},
		],
		createdAt: new Date(Date.now() - 7200000),
		updatedAt: new Date(Date.now() - 7190000),
	},
];

const INITIAL_PROJECTS: Project[] = [
	{
		id: "proj-001",
		name: "Drenyra Fiscal",
		path: "~/Drenyra",
		threadIds: ["thread-001", "thread-002"],
	},
	{ id: "proj-002", name: "Consultas", path: "~/Consultas", threadIds: [] },
];

class ThreadManager {
	threads: Thread[] = [...INITIAL_THREADS];
	projects: Project[] = [...INITIAL_PROJECTS];
	activeThreadId: string = INITIAL_THREADS[0]?.id;
	private listeners = new Set<Listener>();

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) listener();
	}

	get activeThread(): Thread | undefined {
		return this.threads.find((t) => t.id === this.activeThreadId);
	}

	getThreadsByProject(projectId?: string): Thread[] {
		if (!projectId) return this.threads.filter((t) => !t.projectId);
		return this.threads.filter((t) => t.projectId === projectId);
	}

	getProject(id: string): Project | undefined {
		return this.projects.find((p) => p.id === id);
	}

	getThreadsForProject(projectId: string): Thread[] {
		const project = this.projects.find((p) => p.id === projectId);
		if (!project) return [];
		return project.threadIds
			.map((id) => this.threads.find((t) => t.id === id))
			.filter(Boolean) as Thread[];
	}

	createThread(title: string, projectId?: string): Thread {
		const thread: Thread = {
			id: nextThreadId(),
			title,
			projectId,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.threads.unshift(thread);
		if (projectId) {
			const project = this.projects.find((p) => p.id === projectId);
			if (project) project.threadIds.push(thread.id);
		}
		this.activeThreadId = thread.id;
		this.notify();
		return thread;
	}

	addMessage(threadId: string, message: ChatMessage): void {
		const thread = this.threads.find((t) => t.id === threadId);
		if (!thread) return;
		thread.messages.push(message);
		thread.updatedAt = new Date();
		if (
			message.role === "user" &&
			thread.messages.filter((m) => m.role === "user").length <= 1
		) {
			thread.title =
				message.text.length > 40
					? message.text.slice(0, 40) + "..."
					: message.text;
		}
		this.notify();
	}

	setActiveThread(id: string): void {
		this.activeThreadId = id;
		this.notify();
	}

	createProject(name: string, path: string): Project {
		const project: Project = { id: nextProjectId(), name, path, threadIds: [] };
		this.projects.push(project);
		this.notify();
		return project;
	}
}

export const threadStore = new ThreadManager();

/**
 * Hook personalizado para suscribirse al store.
 * Se actualiza automáticamente cuando cambia el estado.
 */
export function useThreadStore() {
	const [snapshot, setSnapshot] = useState(getSnapshot);

	useEffect(() => {
		const unsub = threadStore.subscribe(() => setSnapshot(getSnapshot()));
		return unsub;
	}, []);

	return snapshot;
}

import { useState, useEffect } from "react";

function getSnapshot() {
	return {
		threads: threadStore.threads,
		projects: threadStore.projects,
		activeThread: threadStore.activeThread,
		activeThreadId: threadStore.activeThreadId,
	};
}
