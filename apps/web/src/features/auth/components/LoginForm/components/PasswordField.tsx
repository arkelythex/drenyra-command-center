import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
	MotionDiv,
	entranceVariants,
} from "@/components/ui/motion-primitives";
import { FIELD_IDS, LABELS, PLACEHOLDERS } from "../LoginForm.data";
import type { LoginFormData } from "../LoginForm.types";

export function PasswordField() {
	const {
		register,
		formState: { errors },
	} = useFormContext<LoginFormData>();
	const [showPassword, setShowPassword] = useState(false);
	const id = FIELD_IDS.password;

	return (
		<MotionDiv variants={entranceVariants} className="space-y-3">
			<div className="flex justify-between items-end px-1">
				<Label
					htmlFor={id}
					className="text-3xs font-black uppercase tracking-[0.28em] text-white/90"
				>
					{LABELS.password}
				</Label>
			</div>
			<div className="relative group">
				<div className="absolute inset-0 rounded-full bg-white/10 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100 pointer-events-none" />
				<Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/85 transition-all duration-300 group-focus-within:text-white" />
				<Input
					id={id}
					{...register("password")}
					type={showPassword ? "text" : "password"}
					autoComplete="current-password"
					placeholder={PLACEHOLDERS.password}
					aria-describedby={errors.password ? "password-error" : undefined}
					className={cn(
						"h-14 rounded-full border-white/85 bg-white/[0.035] pl-14 pr-14 text-base font-bold text-white transition-all duration-300",
						"placeholder:text-white/35 focus:border-white focus:ring-2 focus:ring-white/15",
						errors.password &&
							"border-destructive/70 focus:ring-destructive/20 focus:border-destructive",
					)}
				/>
				<button
					type="button"
					onClick={() => setShowPassword(!showPassword)}
					aria-label={
						showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
					}
					className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white focus:outline-none transition-colors p-1 rounded-md focus:ring-2 focus:ring-white/20"
				>
					{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			</div>
			{errors.password && (
				<p
					id="password-error"
					className="ml-1 text-label font-bold uppercase tracking-wider text-destructive animate-in fade-in slide-in-from-left-1"
				>
					{errors.password.message}
				</p>
			)}
		</MotionDiv>
	);
}
