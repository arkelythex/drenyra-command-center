import { isValidRUC } from "@drenyra/shared";
import * as z from "zod";
import { getCountryPack } from "@/lib/latam-country-packs";

export interface PasswordStrength {
	score: number;
	label: string;
	color: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
	let score = 0;

	if (password.length >= 8) score++;
	if (password.length >= 12) score++;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
	if (/[0-9]/.test(password)) score++;
	if (/[^a-zA-Z0-9]/.test(password)) score++;

	const labels = [
		"Muy débil",
		"Débil",
		"Regular",
		"Fuerte",
		"Muy fuerte",
	] as const;
	const colors = [
		"bg-red-500",
		"bg-orange-500",
		"bg-yellow-500",
		"bg-[var(--premium-action-blue)]",
		"bg-[var(--premium-success)]",
	] as const;

	return {
		score,
		label: labels[score] ?? "Muy débil",
		color: colors[score] ?? "bg-red-500",
	};
}

// Re-export for backwards compatibility
export { isValidRUC as validateRucLocal } from "@drenyra/shared";

// Signup is Peru-only today (RUC field). Length/label are sourced from the
// country pack (T2's adapter over @drenyra/domain's CountryRuntime) instead
// of a hardcoded `11`/"RUC" literal — `taxIdLength` falls back to `11` only
// as a defensive default; Peru's pack always resolves it (fixed "\\d{11}").
const peCountryPack = getCountryPack("pe");
const PE_TAX_ID_LENGTH = peCountryPack.taxIdLength ?? 11;
const PE_TAX_ID_LABEL = peCountryPack.taxIdLabel;

export const signupSchema = z
	.object({
		name: z.string().min(3, "Mínimo 3 caracteres"),
		email: z.string().email("Email inválido"),
		ruc: z
			.string()
			.length(
				PE_TAX_ID_LENGTH,
				`${PE_TAX_ID_LABEL} debe tener ${PE_TAX_ID_LENGTH} dígitos`,
			)
			.regex(/^\d+$/, `${PE_TAX_ID_LABEL} debe contener solo números`)
			.refine(
				isValidRUC,
				`${PE_TAX_ID_LABEL} inválido (verificación módulo 11)`,
			),
		password: z
			.string()
			.min(8, "Mínimo 8 caracteres")
			.regex(/[A-Z]/, "Debe contener al menos una mayúscula")
			.regex(/[0-9]/, "Debe contener al menos un número"),
		confirmPassword: z.string(),
		acceptTerms: z
			.boolean()
			.refine(
				(value) => value === true,
				"Debes aceptar los términos y condiciones",
			),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export type SignupFormData = z.infer<typeof signupSchema>;
