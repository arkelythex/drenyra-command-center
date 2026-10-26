import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import type { LoginFormData } from "../LoginForm.types";

export function FormOptions() {
	const { setValue, watch } = useFormContext<LoginFormData>();
	const rememberMe = watch("rememberMe");

	return (
		<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
			{/* A single <label> owns the click: no nested interactive wrapper, so it toggles exactly once. */}
			<label
				htmlFor="rememberMe"
				className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground"
			>
				<Checkbox
					id="rememberMe"
					checked={rememberMe ?? false}
					onCheckedChange={(checked) =>
						setValue("rememberMe", checked === true)
					}
				/>
				Mantener sesión iniciada
			</label>
			<a
				href="/forgot-password"
				className="flex min-h-11 items-center text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:underline"
			>
				¿Olvidaste tu contraseña?
			</a>
		</div>
	);
}
