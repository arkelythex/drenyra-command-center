import { z } from "zod";

export const JournalLineBodySchema = z.object({
	accountId: z.string().min(1),
	description: z.string().min(1).max(500),
	debit: z.number().min(0),
	credit: z.number().min(0),
	documentType: z.string().optional(),
	documentNumber: z.string().optional(),
	dueDate: z.string().optional(),
});

export const CreateJournalEntryBody = z.object({
	date: z.string().min(1),
	gloss: z.string().min(1).max(500),
	lines: z.array(JournalLineBodySchema).min(2),
});

export const UpdateJournalEntryBody = z.object({
	date: z.string().min(1).optional(),
	gloss: z.string().min(1).max(500).optional(),
	lines: z.array(JournalLineBodySchema).min(2).optional(),
});

export const ListJournalEntriesQuery = z.object({
	status: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	documentNumber: z.string().optional(),
});

export const JournalEntryParams = z.object({
	id: z.string().min(1),
});
