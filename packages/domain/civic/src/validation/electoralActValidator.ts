/**
 * electoralActValidator — Pure functions for validating electoral acts
 *
 * All functions are PURE (no side effects, no I/O)
 */

import type { VoteTally } from "../value-object/VoteTally";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export interface ActRecord {
	actNumber: string;
	urnNumber: number;
}

/**
 * validateVoteTally — Sum of votes MUST NOT exceed registered voters
 */
export function validateVoteTally(
	tallies: VoteTally[],
	registeredVoters: number,
): ValidationResult {
	const errors: string[] = [];

	if (tallies.length === 0 && registeredVoters > 0) {
		return {
			valid: false,
			errors: ["No vote tallies provided but registered voters > 0"],
		};
	}

	const totalVotes = tallies.reduce((sum, t) => sum + t.voteCount, 0);

	if (totalVotes > registeredVoters) {
		errors.push(
			`Total votes (${totalVotes}) exceed registered voters (${registeredVoters})`,
		);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * validateDigitIntegrity — No duplicate serial numbers or urn numbers
 */
export function validateDigitIntegrity(acts: ActRecord[]): ValidationResult {
	const errors: string[] = [];
	const seenActNumbers = new Set<string>();
	const seenUrnNumbers = new Set<number>();

	for (const act of acts) {
		if (seenActNumbers.has(act.actNumber)) {
			errors.push(`Duplicate act number: ${act.actNumber}`);
		}
		seenActNumbers.add(act.actNumber);

		if (seenUrnNumbers.has(act.urnNumber)) {
			errors.push(`Duplicate urn number: ${act.urnNumber}`);
		}
		seenUrnNumbers.add(act.urnNumber);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * validateUrnSeal — Verify that the urn seal is intact
 */
export function validateUrnSeal(
	sealId: string,
	isIntact: boolean,
): ValidationResult {
	const errors: string[] = [];

	if (!sealId || sealId.trim().length === 0) {
		errors.push("Seal ID is missing or empty");
	}

	if (!isIntact) {
		errors.push(`Seal is broken for seal ID: ${sealId || "unknown"}`);
	}

	return { valid: errors.length === 0, errors };
}
