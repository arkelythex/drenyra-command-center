"use client";

import type { ReactElement } from "react";
import {
	InboxAgentFeed,
	InboxConversationInput,
	InboxInvoiceList,
	InboxResultSummary,
	InboxUploadZone,
} from "../components";
import { useInboxAgentStream } from "../hooks/useInboxAgentStream";
import { useInboxConversation } from "../hooks/useInboxConversation";

/**
 * Smart Inbox Conversacional — canonical surface at /inbox.
 * @see docs/superpowers/specs/2026-05-23-smart-inbox-design.md
 */
export function InboxPage(): ReactElement {
	const { phase, events, batch, error, progress, processFiles, reset } =
		useInboxAgentStream();
	const { messages, ask, suggestions } = useInboxConversation(batch);

	return (
		<div className="mx-auto flex h-full max-w-4xl flex-col gap-4 overflow-y-auto p-4 lg:p-8">
			<header>
				<p className="text-2xs font-bold uppercase tracking-[0.2em] text-[var(--color-info)]">
					Inbox inteligente
				</p>
				<h1 className="mt-1 text-2xl font-bold tracking-tight">
					Subí facturas → agentes debaten → listo para declarar
				</h1>
				<p className="mt-2 text-sm text-[var(--text-tertiary)]">
					Una pantalla. Batch en paralelo. Validación SUNAT visible en vivo.
				</p>
			</header>

			{phase === "complete" && batch ? (
				<>
					<InboxResultSummary batch={batch} onReset={reset} />
					<InboxInvoiceList invoices={batch.invoices} />
				</>
			) : (
				<InboxUploadZone
					phase={phase}
					onFilesSelected={(files) => void processFiles(files)}
				/>
			)}

			<InboxAgentFeed phase={phase} events={events} progress={progress} />

			{error ? (
				<p className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
					{error}
				</p>
			) : null}

			<InboxConversationInput
				messages={messages}
				suggestions={suggestions}
				onAsk={ask}
			/>
		</div>
	);
}
