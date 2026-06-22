import type { Money } from "../../value-objects/Money";

export type JournalEntryStatus = "borrador" | "mayorizado" | "declarado";

export interface JournalLineProps {
	id: string;
	accountId: string;
	accountCode: string;
	accountName: string;
	description: string;
	debit: Money;
	credit: Money;
	documentType?: string;
	documentNumber?: string;
	dueDate?: Date;
}

export interface JournalEntryProps {
	id: string;
	organizationId: number;
	entryNumber: string;
	date: Date;
	gloss: string;
	status: JournalEntryStatus;
	lines: import("./entity").JournalLine[];
	postedBy?: string;
	postedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
