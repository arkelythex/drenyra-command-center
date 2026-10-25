/** Company registration for a signed-in user without a company yet. */

export interface RegisteredCompany {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode: string;
	membershipRole: string;
	isDefault: boolean;
}

export interface NewCompany {
	ruc: string;
	businessName: string;
	address?: string | undefined;
}

export interface RucLookup {
	legalName?: string | undefined;
	address?: string | undefined;
}

interface ApiEnvelope<T> {
	success?: boolean;
	data?: T;
	error?: string;
	code?: string;
	field?: string;
}

export class CompanyOnboardingError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly field?: string,
	) {
		super(message);
		this.name = "CompanyOnboardingError";
	}
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
	return ((await response.json().catch(() => null)) ?? {}) as ApiEnvelope<T>;
}

/** Registers the company; the signed-in user becomes its owner. */
export async function registerCompany(
	company: NewCompany,
): Promise<RegisteredCompany> {
	const response = await fetch("/api/onboarding/company", {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		credentials: "include",
		body: JSON.stringify(company),
	});
	const payload = await readEnvelope<RegisteredCompany>(response);
	if (!response.ok || !payload.success || !payload.data) {
		throw new CompanyOnboardingError(
			payload.error ?? "No se pudo registrar la empresa.",
			payload.code,
			payload.field,
		);
	}
	return payload.data;
}

interface RucOnlineResult {
	valid?: boolean;
	razonSocial?: string;
	direccion?: string;
}

function present(value: string | undefined): string | undefined {
	const text = value?.trim();
	return text ? text : undefined;
}

/**
 * Business name and address SUNAT has for the RUC, when the lookup service
 * answers. `null` means nothing was found and the user types them in.
 */
export async function lookupRuc(ruc: string): Promise<RucLookup | null> {
	try {
		const response = await fetch("/api/sunat/validate-ruc-online", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ ruc }),
		});
		const payload = await readEnvelope<RucOnlineResult>(response);
		const legalName = present(payload.data?.razonSocial);
		if (!payload.success || !legalName) return null;
		return { legalName, address: present(payload.data?.direccion) };
	} catch {
		return null;
	}
}
