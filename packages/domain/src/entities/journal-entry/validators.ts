import { Money } from "../../value-objects/Money";
import type { JournalEntryProps, JournalLineProps } from "./types";

function isBalanced(props: JournalEntryProps): boolean {
	const totalDebit = props.lines.reduce(
		(acc, line) => acc.add(line.debit),
		Money.zero("PEN"),
	);
	const totalCredit = props.lines.reduce(
		(acc, line) => acc.add(line.credit),
		Money.zero("PEN"),
	);
	return totalDebit.equals(totalCredit);
}

function getTotalDebit(props: JournalEntryProps): Money {
	return props.lines.reduce(
		(acc, line) => acc.add(line.debit),
		Money.zero("PEN"),
	);
}

function getTotalCredit(props: JournalEntryProps): Money {
	return props.lines.reduce(
		(acc, line) => acc.add(line.credit),
		Money.zero("PEN"),
	);
}

export function validateJournalLine(props: JournalLineProps): void {
	if (!props.debit.isZero() && !props.credit.isZero()) {
		throw new Error("Una línea no puede tener tanto Debe como Haber");
	}

	if (props.debit.isZero() && props.credit.isZero()) {
		throw new Error("Una línea debe tener Debe o Haber");
	}

	if (!props.description || props.description.trim().length === 0) {
		throw new Error("La descripción de la línea es requerida");
	}
}

export function validateJournalEntry(props: JournalEntryProps): void {
	if (props.lines.length < 2) {
		throw new Error("El asiento debe tener al menos 2 líneas (partida doble)");
	}

	if (!isBalanced(props)) {
		const totalDebit = getTotalDebit(props);
		const totalCredit = getTotalCredit(props);
		throw new Error(
			`El asiento debe estar balanceado. Debe: ${totalDebit.getAmount()}, Haber: ${totalCredit.getAmount()}`,
		);
	}

	if (!props.entryNumber || props.entryNumber.trim().length === 0) {
		throw new Error("El número de asiento es requerido");
	}

	if (!props.gloss || props.gloss.trim().length === 0) {
		throw new Error("La glosa es requerida");
	}

	if (props.date > new Date()) {
		throw new Error("La fecha del asiento no puede ser futura");
	}
}
