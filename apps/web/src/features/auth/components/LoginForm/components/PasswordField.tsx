import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FIELD_IDS, LABELS, PLACEHOLDERS } from "../LoginForm.data";
import type { LoginFormData } from "../LoginForm.types";
import {
	fieldErrorClass,
	fieldIconClass,
	fieldInputClass,
} from "./field-styles";

export function PasswordField() {
	const {
		register,
		formState: { errors },
	} = useFormContext<LoginFormData>();
	const [showPassword, setShowPassword] = useState(false);
	const id = FIELD_IDS.password;

	return (
		<div className="space-y-2">
			<Label htmlFor={id} className="text-sm font-medium text-foreground">
				{LABELS.password}
			</Label>
			<div className="relative">
				<Lock aria-hidden="true" className={cn(fieldIconClass, "left-3.5")} />
				<Input
					id={id}
					{...register("password")}
					type={showPassword ? "text" : "password"}
					autoComplete="current-password"
					placeholder={PLACEHOLDERS.password}
					aria-invalid={errors.password ? true : undefined}
					aria-describedby={errors.password ? "password-error" : undefined}
					className={cn(fieldInputClass, "pl-11 pr-12")}
				/>
				<button
					type="button"
					onClick={() => setShowPassword((visible) => !visible)}
					aria-label={
						showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
					}
					aria-pressed={showPassword}
					className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					{showPassword ? (
						<EyeOff className="size-5" />
					) : (
						<Eye className="size-5" />
					)}
				</button>
			</div>
			{errors.password && (
				<p id="password-error" className={fieldErrorClass}>
					{errors.password.message}
				</p>
			)}
		</div>
	);
}
