/**
 * Thin apps/web adapter over `@drenyra/domain`'s FEOS-014 `CountryRuntime`.
 *
 * `packages/domain/src/feos/country-runtime.ts` is the canonical source of
 * truth for country-pack fiscal data (currency, locale, tax-ID format, tax
 * rules). This module only adds what is genuinely apps/web-specific — the
 * assistant copy strings and quick-action labels shown in the UI — and
 * resolves everything else (name, currency, locale, tax-ID regex, active tax
 * rates) from the domain runtime instead of re-hardcoding it.
 *
 * @module lib/latam-country-packs
 */

import { CountryRuntime, DRENYRA_COUNTRY_PACKS } from "@drenyra/domain";

export type CountryCode = "pe" | "mx" | "cl" | "co";

export interface CountryAssistantQuickAction {
	label: string;
	command: string;
	emphasis: "high" | "medium";
}

export interface CountryPack {
	code: CountryCode;
	name: string;
	taxIdLabel: string;
	/** Regex (as a string) for the country's tax identifier, sourced from
	 * `CountryRuntime.getPack(code).taxIdentifierFormat` (e.g. "\\d{11}" for
	 * Peru's RUC). Falls back to an always-matching pattern if the domain
	 * runtime has no pack for this code. */
	taxIdRegex: string;
	defaultCurrency: string;
	locale: string;
	assistantPlaceholder: string;
	commandHint: string;
	assistantQuickActions: readonly CountryAssistantQuickAction[];
}

export const DEFAULT_COUNTRY_CODE: CountryCode = "pe";

// apps/web routes/UI use lowercase 2-letter country codes; @drenyra/domain's
// CountryRuntime keys packs by uppercase ISO 3166-1 alpha-2 codes (PE, CO, ...).
const DOMAIN_CODE_BY_COUNTRY_CODE: Record<CountryCode, string> = {
	pe: "PE",
	mx: "MX",
	cl: "CL",
	co: "CO",
};

// `taxIdLabel` (RUC/RFC/RUT/NIT — the *name* of the tax-ID document type) has
// no equivalent field in @drenyra/domain's `CountryPackDef`, which only
// exposes `taxAuthority` (the issuing agency, e.g. SUNAT/DIAN/SII — a
// different concept). This stays apps/web-local until the domain type grows
// one; everything else below is sourced from the domain runtime.
const TAX_ID_LABEL_BY_COUNTRY_CODE: Record<CountryCode, string> = {
	pe: "RUC",
	mx: "RFC",
	cl: "RUT",
	co: "NIT",
};

interface CountryAssistantCopy {
	assistantPlaceholder: string;
	commandHint: string;
	assistantQuickActions: readonly CountryAssistantQuickAction[];
}

// Assistant copy is a genuine apps/web UI concern (Spanish marketing/product
// copy), not fiscal domain data — kept local by design.
const ASSISTANT_COPY_BY_COUNTRY_CODE: Record<
	CountryCode,
	CountryAssistantCopy
> = {
	pe: {
		assistantPlaceholder:
			"Pide una mision: prepara SIRE, valida CPE, cruza XML vs ERP, concilia bancos...",
		commandHint: "PE · Mision",
		assistantQuickActions: [
			{
				label: "Preparar SIRE",
				command:
					"Preparar SIRE RVIE y RCE del periodo actual con diff y evidencia por fila",
				emphasis: "high",
			},
			{
				label: "Validar CPE",
				command:
					"Validar CPE, XML, CDR y reglas SUNAT 2026 para los comprobantes pendientes",
				emphasis: "high",
			},
			{
				label: "Revisar IGV",
				command:
					"Revisar diferencias de IGV, detracciones y percepciones con propuesta de ajuste",
				emphasis: "medium",
			},
			{
				label: "Conciliar bancos",
				command:
					"Conciliar bancos del mes actual y proponer asientos contables",
				emphasis: "high",
			},
			{
				label: "Emitir factura",
				command:
					"Preparar factura electronica con validacion OSE y constancia SUNAT",
				emphasis: "medium",
			},
			{
				label: "Auditar cierre",
				command:
					"Auditar cierre mensual peruano y priorizar bloqueos antes de aprobar",
				emphasis: "medium",
			},
		],
	},
	mx: {
		assistantPlaceholder:
			"Escribe una tarea: timbrar CFDI, validar SAT, revisar IVA...",
		commandHint: "Comandos MX",
		assistantQuickActions: [
			{
				label: "Timbrar CFDI",
				command: "Preparar timbrado CFDI 4.0 del periodo actual",
				emphasis: "high",
			},
			{
				label: "Validar SAT",
				command: "Validar claves SAT y uso CFDI",
				emphasis: "medium",
			},
			{
				label: "Revisar IVA",
				command: "Revisar IVA trasladado y acreditable",
				emphasis: "medium",
			},
			{
				label: "Conciliar bancos",
				command: "Conciliar bancos y cobros del mes actual",
				emphasis: "high",
			},
		],
	},
	cl: {
		assistantPlaceholder:
			"Escribe una tarea: emitir DTE, revisar folios, cuadrar IVA...",
		commandHint: "Comandos CL",
		assistantQuickActions: [
			{
				label: "Emitir DTE",
				command: "Preparar emisión DTE del periodo actual",
				emphasis: "high",
			},
			{
				label: "Revisar folios",
				command: "Revisar folios y pendientes SII",
				emphasis: "medium",
			},
			{
				label: "Cuadrar IVA",
				command: "Cuadrar IVA compras y ventas",
				emphasis: "medium",
			},
			{
				label: "Conciliar bancos",
				command: "Conciliar bancos y pagos del mes actual",
				emphasis: "high",
			},
		],
	},
	co: {
		assistantPlaceholder:
			"Escribe una tarea: validar DIAN, revisar soporte, conciliar...",
		commandHint: "Comandos CO",
		assistantQuickActions: [
			{
				label: "Validar DIAN",
				command: "Validar facturación electrónica DIAN del periodo actual",
				emphasis: "high",
			},
			{
				label: "Documento soporte",
				command: "Revisar documentos soporte pendientes",
				emphasis: "medium",
			},
			{
				label: "Revisar IVA",
				command: "Revisar IVA generado y descontable",
				emphasis: "medium",
			},
			{
				label: "Conciliar bancos",
				command: "Conciliar bancos y recaudos del mes actual",
				emphasis: "high",
			},
		],
	},
};

// Fallback names/currency/locale only apply if the domain runtime is somehow
// missing a pack for one of apps/web's 4 supported codes — it never is today
// (DRENYRA_COUNTRY_PACKS always includes PE/MX/CL/CO), but this keeps
// `buildCountryPack` total instead of throwing.
const FALLBACK_NAME_BY_COUNTRY_CODE: Record<CountryCode, string> = {
	pe: "Perú",
	mx: "México",
	cl: "Chile",
	co: "Colombia",
};
const FALLBACK_CURRENCY_BY_COUNTRY_CODE: Record<CountryCode, string> = {
	pe: "PEN",
	mx: "MXN",
	cl: "CLP",
	co: "COP",
};
const FALLBACK_LOCALE_BY_COUNTRY_CODE: Record<CountryCode, string> = {
	pe: "es-PE",
	mx: "es-MX",
	cl: "es-CL",
	co: "es-CO",
};

// Module-level singleton: CountryRuntime holds no per-request/mutable state
// beyond the static packs map built from DRENYRA_COUNTRY_PACKS, so one shared
// instance is safe and avoids rebuilding that map on every call.
const countryRuntime = new CountryRuntime(DRENYRA_COUNTRY_PACKS);

function buildCountryPack(code: CountryCode): CountryPack {
	const domainPack = countryRuntime.getPack(DOMAIN_CODE_BY_COUNTRY_CODE[code]);
	const copy = ASSISTANT_COPY_BY_COUNTRY_CODE[code];
	return {
		code,
		name: domainPack?.name ?? FALLBACK_NAME_BY_COUNTRY_CODE[code],
		taxIdLabel: TAX_ID_LABEL_BY_COUNTRY_CODE[code],
		taxIdRegex: domainPack?.taxIdentifierFormat ?? ".*",
		defaultCurrency:
			domainPack?.defaultCurrency ?? FALLBACK_CURRENCY_BY_COUNTRY_CODE[code],
		locale: domainPack?.locale ?? FALLBACK_LOCALE_BY_COUNTRY_CODE[code],
		assistantPlaceholder: copy.assistantPlaceholder,
		commandHint: copy.commandHint,
		assistantQuickActions: copy.assistantQuickActions,
	};
}

export const LATAM_COUNTRY_PACKS: Record<CountryCode, CountryPack> = {
	pe: buildCountryPack("pe"),
	mx: buildCountryPack("mx"),
	cl: buildCountryPack("cl"),
	co: buildCountryPack("co"),
};

export function resolveCountryCode(value: unknown): CountryCode {
	if (typeof value !== "string") return DEFAULT_COUNTRY_CODE;
	const normalized = value.trim().toLowerCase();
	if (
		normalized === "pe" ||
		normalized === "mx" ||
		normalized === "cl" ||
		normalized === "co"
	) {
		return normalized;
	}
	return DEFAULT_COUNTRY_CODE;
}

export function getCountryPack(
	code?: CountryCode | string | null,
): CountryPack {
	const normalized = resolveCountryCode(code);
	return LATAM_COUNTRY_PACKS[normalized];
}

/**
 * Returns the active tax rate for a given country/tax name, as a
 * whole-number percentage matching `@drenyra/domain`'s `TaxRule.rate`
 * convention (e.g. `18` means 18%, NOT `0.18`) — callers must divide by 100
 * themselves if they need a fraction.
 *
 * `countryCode` accepts either apps/web's lowercase codes ("pe") or the
 * domain's uppercase ISO codes ("PE") — comparison is case-insensitive.
 *
 * `CountryRuntime.getTaxRules` currently only special-cases "PE"/"CO" in
 * `packages/domain` (CL/MX and others return `[]` there — a known upstream
 * gap, out of scope to fix from apps/web). This helper never throws and
 * never assumes Peru: it returns `undefined` whenever the country has no
 * tax rules yet, or none match `taxName`/are active.
 */
export function getActiveTaxRate(
	countryCode: string,
	taxName: string,
): number | undefined {
	const rules = countryRuntime.getTaxRules(countryCode.toUpperCase());
	return rules.find((rule) => rule.name === taxName)?.rate;
}
