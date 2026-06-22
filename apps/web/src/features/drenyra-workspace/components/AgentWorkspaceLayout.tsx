/**
 * AgentWorkspaceLayout
 *
 * Layout principal del workspace Drenyra — estructura sidebar + contenido.
 *
 * Design influences:
 * - **Codex App**: Shell with sidebar + content, tool-first paradigm, information density
 * - **Digits AI**: AI-native workspace, modular tool organization, progressive disclosure
 *
 * Peruvian adaptation: Toda acción sensible requiere trazabilidad y evidencia visible.
 *
 * @see docs/design/design-influences-2026.md
 */
import type { ReactNode } from "react";
import { AgentChatPanel } from "./AgentChatPanel";

interface AgentWorkspaceLayoutProps {
	agentName: string;
	agentIcon?: ReactNode;
	description: string;
	tools: Array<{ name: string; description: string }>;
	children?: ReactNode;
}

export function AgentWorkspaceLayout({
	agentName,
	agentIcon,
	description,
	tools,
	children,
}: AgentWorkspaceLayoutProps) {
	return (
		<div className="flex h-full flex-col">
			<header className="flex items-center gap-3 border-b border-[var(--color-stroke-2)] px-6 py-4">
				{agentIcon && (
					<div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
						{agentIcon}
					</div>
				)}
				<div>
					<h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{agentName}</h1>
					<p className="text-sm text-[var(--color-text-muted)]">{description}</p>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex flex-1 flex-col">
					<AgentChatPanel agentName={agentName} />
				</div>

				<aside className="hidden w-72 border-l border-[var(--color-stroke-2)] p-4 lg:block">
					<h2 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
						Tools disponibles
					</h2>
					<div className="space-y-2">
						{tools.map((tool) => (
							<div
								key={tool.name}
								className="rounded-lg border border-[var(--color-stroke-2)] bg-[var(--color-surface-1)]/50 p-3"
							>
								<div className="text-sm font-medium text-[var(--color-text-primary)]">
									{tool.name}
								</div>
								<div className="mt-1 text-xs text-[var(--color-text-muted)]">
									{tool.description}
								</div>
							</div>
						))}
					</div>
					{children}
				</aside>
			</div>
		</div>
	);
}
