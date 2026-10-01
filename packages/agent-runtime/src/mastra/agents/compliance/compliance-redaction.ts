const redactionPatterns: readonly {
	readonly label: string;
	readonly pattern: RegExp;
}[] = [
	{ label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
	{
		label: "token",
		pattern:
			/\b(?:token|secret|api[_-]?key|password)\s*[:=]\s*[A-Za-z0-9._-]{8,}\b/gi,
	},
	{
		label: "accountNumber",
		pattern:
			/\b(?:account(?:Number)?|cuenta)\s*[:=]?\s*[0-9 -]{10,24}\b|\b[0-9 -]{14,24}\b/gi,
	},
	{ label: "ruc", pattern: /\b(?:10|15|17|20)[0-9]{9}\b/g },
	{ label: "dni", pattern: /\b[0-9]{8}\b/g },
];

const sensitiveKeyPattern =
	/token|secret|credential|client[-_]?secret|api[-_]?key|password|account[-_]?number|cuenta/i;

export function redactSensitiveFields<T>(value: T): T {
	return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
	if (typeof value === "string") {
		return redactString(value);
	}

	if (Array.isArray(value)) {
		return value.map((item) => redactValue(item));
	}

	if (typeof value === "object" && value !== null) {
		const output: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) {
			output[key] = sensitiveKeyPattern.test(key)
				? `[REDACTED_${key}]`
				: redactValue(entry);
		}
		return output;
	}

	return value;
}

function redactString(value: string): string {
	return redactionPatterns.reduce(
		(current, item) =>
			current.replace(item.pattern, `[REDACTED_${item.label}]`),
		value,
	);
}
