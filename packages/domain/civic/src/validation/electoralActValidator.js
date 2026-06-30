export function validateVoteTally(tallies, registeredVoters) {
    const errors = [];
    if (tallies.length === 0 && registeredVoters > 0) {
        return {
            valid: false,
            errors: ["No vote tallies provided but registered voters > 0"],
        };
    }
    const totalVotes = tallies.reduce((sum, t) => sum + t.voteCount, 0);
    if (totalVotes > registeredVoters) {
        errors.push(`Total votes (${totalVotes}) exceed registered voters (${registeredVoters})`);
    }
    return { valid: errors.length === 0, errors };
}
export function validateDigitIntegrity(acts) {
    const errors = [];
    const seenActNumbers = new Set();
    const seenUrnNumbers = new Set();
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
export function validateUrnSeal(sealId, isIntact) {
    const errors = [];
    if (!sealId || sealId.trim().length === 0) {
        errors.push("Seal ID is missing or empty");
    }
    if (!isIntact) {
        errors.push(`Seal is broken for seal ID: ${sealId || "unknown"}`);
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=electoralActValidator.js.map