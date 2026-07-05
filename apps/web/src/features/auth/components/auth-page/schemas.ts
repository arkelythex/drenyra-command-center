import * as z from "zod";

export const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const signupSchema = z.object({
	name: z.string().min(3, "Mínimo 3 caracteres"),
	email: z.string().email("Email inválido"),
	ruc: z.string().length(11, "RUC debe tener 11 dígitos"),
	password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
