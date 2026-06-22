import { siteConfig } from "@/lib/seo/config";

/** Digits only, E.164 without + (Perú: 51 + 9 dígitos móvil). */
function normalizeWhatsAppNumber(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (digits.startsWith("51") && digits.length === 11) return digits;
	if (digits.length === 9 && digits.startsWith("9")) return `51${digits}`;
	return digits;
}

/** Placeholders que no deben usarse en producción (env legacy o demos). */
const PLACEHOLDER_WHATSAPP_NUMBERS = new Set([
	"51999999999",
	"999999999",
	"9999999999",
	"99999999999",
]);

function isPlaceholderWhatsAppNumber(normalized: string): boolean {
	if (PLACEHOLDER_WHATSAPP_NUMBERS.has(normalized)) return true;
	const local = normalized.startsWith("51") ? normalized.slice(2) : normalized;
	return /^9{8,}$/.test(local);
}

function resolveWhatsAppNumber(): string {
	const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
	if (fromEnv) {
		const normalized = normalizeWhatsAppNumber(fromEnv);
		if (!isPlaceholderWhatsAppNumber(normalized)) return normalized;
	}
	return normalizeWhatsAppNumber(siteConfig.whatsappNumber);
}

const DEFAULT_NUMBER = resolveWhatsAppNumber();

const DEFAULT_MESSAGE =
	"Hola Arkelythex, me interesa el piloto Drenyra para mi estudio o empresa. ¿Podemos coordinar una demo?";

/**
 * Builds a WhatsApp click-to-chat URL (wa.me).
 * Opens WhatsApp / WhatsApp Business on mobile and desktop.
 */
function pickWhatsAppNumber(raw?: string): string {
	const normalized = normalizeWhatsAppNumber(raw ?? DEFAULT_NUMBER);
	if (isPlaceholderWhatsAppNumber(normalized)) {
		return normalizeWhatsAppNumber(siteConfig.whatsappNumber);
	}
	return normalized;
}

export function buildWhatsAppUrl(options?: {
	number?: string;
	message?: string;
}): string {
	const number = pickWhatsAppNumber(options?.number);
	const text = encodeURIComponent(options?.message ?? DEFAULT_MESSAGE);
	return `https://wa.me/${number}?text=${text}`;
}

export const whatsappBusinessNumber = DEFAULT_NUMBER;

export const whatsappContactUrl = buildWhatsAppUrl();
