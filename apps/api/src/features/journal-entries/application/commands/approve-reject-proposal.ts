/**
 * Approve or reject journal entry proposals (PR-style accounting flow).
 */

import { UpdateJournalEntryStatusUseCase } from "@arkelythex/application/use-cases/journal";
import { journalRepository } from "../_helpers";

export async function approveJournalEntryProposal(
	id: string,
	actorId = "system",
) {
	const useCase = new UpdateJournalEntryStatusUseCase(journalRepository);
	return useCase
		.execute(id, "mayorizado", actorId)
		.then((entry) => entry.toJSON());
}

export async function rejectJournalEntryProposal(
	id: string,
	actorId = "system",
) {
	const entry = await journalRepository.findById(id);
	if (!entry) {
		throw new Error("Asiento no encontrado");
	}
	if (entry.status !== "borrador") {
		throw new Error("Solo se pueden rechazar asientos en borrador");
	}
	await journalRepository.delete(id);
	return { id, rejected: true, rejectedBy: actorId };
}
