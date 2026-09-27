export class TaskDecomposer {
    decompose(goal, _context, availableDomains) {
        const goalLower = goal.toLowerCase();
        const steps = [];
        const stepId = () => `step-${steps.length + 1}`;
        steps.push({
            id: stepId(),
            goal: `Extract data for: ${goal}`,
            domain: "scripta",
            tools: ["extract"],
            dependencies: [],
        });
        steps.push({
            id: stepId(),
            goal: `Validate extracted data for: ${goal}`,
            domain: "regula",
            tools: ["validate"],
            dependencies: ["step-1"],
        });
        if (!goalLower.includes("extract") && !goalLower.includes("list")) {
            steps.push({
                id: stepId(),
                goal: `Classify: ${goal}`,
                domain: "cerno",
                tools: ["classify"],
                dependencies: ["step-2"],
            });
        }
        if (availableDomains.includes("regula") &&
            (goalLower.includes("igv") ||
                goalLower.includes("tax") ||
                goalLower.includes("compliance") ||
                goalLower.includes("sunat") ||
                goalLower.includes("fiscal"))) {
            steps.push({
                id: stepId(),
                goal: `Compliance check for: ${goal}`,
                domain: "regula",
                tools: ["comply"],
                dependencies: [steps[steps.length - 1].id],
            });
        }
        if (goalLower.includes("analyz") ||
            goalLower.includes("report") ||
            goalLower.includes("insight") ||
            goalLower.includes("compare")) {
            steps.push({
                id: stepId(),
                goal: `Analyze: ${goal}`,
                domain: "lumen",
                tools: ["analyze"],
                dependencies: [steps[steps.length - 1].id],
            });
        }
        if (steps.length > 3 ||
            goalLower.includes("merge") ||
            goalLower.includes("consolidate") ||
            goalLower.includes("compare")) {
            steps.push({
                id: stepId(),
                goal: `Consolidate results for: ${goal}`,
                domain: "fusio",
                tools: ["consolidate"],
                dependencies: steps.slice(-3).map((s) => s.id),
            });
        }
        const parallelGroups = [];
        const processed = new Set();
        for (const step of steps) {
            if (processed.has(step.id))
                continue;
            if (step.dependencies.length === 0) {
                const parallel = steps
                    .filter((s) => s.dependencies.length === 0 && !processed.has(s.id))
                    .map((s) => s.id);
                if (parallel.length > 0) {
                    parallelGroups.push(parallel);
                    for (const p of parallel)
                        processed.add(p);
                }
            }
            else {
                processed.add(step.id);
                const remaining = steps.filter((s) => !processed.has(s.id) &&
                    s.dependencies.every((d) => processed.has(d)));
                if (remaining.length > 1) {
                    parallelGroups.push(remaining.map((s) => s.id));
                    for (const r of remaining)
                        processed.add(r.id);
                }
                else if (remaining.length === 1) {
                    processed.add(remaining[0].id);
                }
            }
        }
        for (const step of steps) {
            if (!processed.has(step.id)) {
                parallelGroups.push([step.id]);
                processed.add(step.id);
            }
        }
        return {
            goal,
            steps,
            parallelGroups,
        };
    }
}
//# sourceMappingURL=task-decomposer.js.map