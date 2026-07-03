/**
 * Extracted pure functions from client-comms routes for testability.
 */
export interface BatchRecord {
	companyId: string;
	templateId: string;
	clientId: string;
	channel: string;
	recipient: string;
	body: string;
	status: "queued";
}

const VARIABLE_RE = /\{\{(\w+)\}\}/g;

/**
 * Replaces {{variable}} placeholders with provided values.
 * Leaves unresolved variables unchanged.
 */
export function substituteVariables(
	template: string,
	variables: Record<string, string>,
): string {
	return template.replace(VARIABLE_RE, (_, name: string) => {
		return name in variables ? variables[name] : `{{${name}}}`;
	});
}

/**
 * Returns the list of declared variables that are missing from the provided values.
 */
export function getMissingVariables(
	template: string,
	declaredVariables: string[],
	provided: Record<string, string>,
): string[] {
	const usedInBody = new Set<string>();
	let match: RegExpExecArray | null;
	const re = new RegExp(VARIABLE_RE.source);
	while ((match = re.exec(template)) !== null) {
		usedInBody.add(match[1]);
	}

	const declared = new Set(declaredVariables);
	const allRequired = new Set([...usedInBody, ...declared]);

	return [...allRequired].filter((v) => !(v in provided));
}

const VALID_TRANSITIONS: Record<string, string[]> = {
	queued: ["sent", "failed"],
	sent: ["delivered", "failed"],
	delivered: ["read"],
	failed: ["queued"],
};

/**
 * Validates a status transition against allowed state machine.
 */
export function isValidStatusTransition(
	current: string,
	next: string,
): boolean {
	const allowed = VALID_TRANSITIONS[current];
	return allowed?.includes(next) ?? false;
}

/**
 * Check whether an automation trigger matches a given event name.
 */
export function matchesTrigger(trigger: string, event: string): boolean {
	return trigger === event;
}

/**
 * Build batch history records for multiple client IDs.
 */
export function buildBatchRecords(
	companyId: string,
	templateId: string,
	clientIds: string[],
	channel: string,
	variables: Record<string, string> = {},
): BatchRecord[] {
	return clientIds.map((clientId) => ({
		companyId,
		templateId,
		clientId,
		channel,
		recipient: "",
		body: JSON.stringify(variables),
		status: "queued" as const,
	}));
}
