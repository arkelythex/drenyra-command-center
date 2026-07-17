export class SimpleSessionCondenser {
    condense(records) {
        return records
            .map((record) => record.content.trim())
            .filter((content) => content.length > 0)
            .join("\n");
    }
}
//# sourceMappingURL=session-condenser.js.map