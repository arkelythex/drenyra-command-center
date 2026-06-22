import { isValidRUC } from "@arkelythex/shared";
import * as z from "zod";

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
export { isValidRUC as validateRucLocal } from "@arkelythex/shared";

export const signupSchema = z
	.object({
		name: z.string().min(3, "Mínimo 3 caracteres"),
		email: z.string().email("Email inválido"),
		ruc: z
			.string()
			.length(11, "RUC debe tener 11 dígitos")
			.regex(/^\d{11}$/, "RUC debe contener solo números")
			.refine(isValidRUC, "RUC inválido (verificación módulo 11)"),
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
