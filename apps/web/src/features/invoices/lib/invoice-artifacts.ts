export function getOpenableInvoiceArtifactUrl(
	value?: string | null,
): string | null {
	if (!value) {
		return null;
	}

	return /^https?:\/\//i.test(value) ? value : null;
}

export function getPersistedInvoiceTicket(value?: string | null): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

export function getInvoiceRunbookHref(runbook?: {
	path: string;
	anchor?: string;
} | null): string | null {
	if (!runbook?.path) {
		return null;
	}

	const normalizedPath = runbook.path.startsWith("/")
		? runbook.path
		: `/${runbook.path}`;
	const anchor = runbook.anchor?.startsWith("#")
		? runbook.anchor
		: runbook.anchor
			? `#${runbook.anchor}`
			: "";

	return `${normalizedPath}${anchor}`;
}

export function getPersistedSunatStatus(value?: string | null): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toUpperCase();
	return normalized.length > 0 ? normalized : null;
}

export function getPersistedSunatCode(value?: string | null): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toUpperCase();
	return normalized.length > 0 ? normalized : null;
}

export function getPersistedSunatIncidentMessage(input: {
	status?: string | null;
	code?: string | null;
	message?: string | null;
}): string | null {
	const status = getPersistedSunatStatus(input.status);
	const code = getPersistedSunatCode(input.code);
	const message =
		typeof input.message === "string" && input.message.trim().length > 0
			? input.message.trim()
			: null;

	if (!message) {
		return null;
	}

	const hasIncidentStatus =
		status === "REJECTED" || status === "OBSERVED" || status === "ANNULLED";
	const hasIncidentCode = code !== null && code !== "0";

	return hasIncidentStatus || hasIncidentCode ? message : null;
}
