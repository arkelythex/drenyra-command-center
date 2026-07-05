import { z } from "zod";

export const resetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(8, "Mínimo 8 caracteres")
			.regex(/[A-Z]/, "Debe contener al menos una mayúscula")
			.regex(/[0-9]/, "Debe contener al menos un número"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
