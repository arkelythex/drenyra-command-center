import { Lock, Mail } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { LoginFormData } from "./schemas";
import { FormField } from "./FormField";
import { AuthSubmitButton } from "./AuthSubmitButton";

interface LoginPanelProps {
	form: UseFormReturn<LoginFormData>;
	isLoading: boolean;
	onSubmit: (data: LoginFormData) => void;
}

export function LoginPanel({ form, isLoading, onSubmit }: LoginPanelProps) {
	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<FormField
				label="Email"
				placeholder="usuario@empresa.com"
				icon={Mail}
				error={form.formState.errors.email?.message}
				inputProps={form.register("email")}
			/>
			<FormField
				label="Contraseña"
				placeholder="••••••••"
				icon={Lock}
				type="password"
				error={form.formState.errors.password?.message}
				inputProps={form.register("password")}
			/>
			<AuthSubmitButton label="ENTRAR" isLoading={isLoading} />
		</form>
	);
}
