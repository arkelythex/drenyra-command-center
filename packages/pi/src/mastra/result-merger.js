export class ResultMerger {
    merge(results) {
        const data = {};
        const conflicts = [];
        for (const result of results) {
            if (typeof result.data === "object" && result.data !== null) {
                for (const [key, value] of Object.entries(result.data)) {
                    if (key in data) {
                        conflicts.push({
                            between: [
                                result.domainId,
                                results.find((r) => r.data &&
                                    r.data[key] !== undefined)?.domainId ?? "unknown",
                            ],
                            field: key,
                            values: [data[key], value],
                            resolvedBy: result.confidence > 0.8 ? result.domainId : "lower-confidence",
                        });
                        if (result.confidence > 0.85) {
                            data[key] = value;
                        }
                    }
                    else {
                        data[key] = value;
                    }
                }
            }
        }
        return {
            success: conflicts.length === 0 ||
                conflicts.every((c) => c.resolvedBy !== "unresolved"),
            data,
            conflicts,
        };
    }
}
//# sourceMappingURL=result-merger.js.map