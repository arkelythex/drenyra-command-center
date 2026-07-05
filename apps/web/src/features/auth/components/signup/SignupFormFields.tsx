import {
	AlertCircle,
	Building2,
	Check,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	User,
	X,
} from "lucide-react";
import type {
	FieldErrors,
	UseFormRegister,
	UseFormSetValue,
} from "react-hook-form";
import { Text } from "@/components/atoms/text";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";
import type {
	PasswordStrength,
	SignupFormData,
} from "./signup-form.validation";
import type { RucValidationState } from "./signup-ruc-validation";

interface SignupFormFieldsProps {
	register: UseFormRegister<SignupFormData>;
	errors: FieldErrors<SignupFormData>;
	rucValidation: RucValidationState;
	password: string;
	passwordStrength: PasswordStrength | null;
	acceptTerms: boolean;
	showPassword: boolean;
	showConfirmPassword: boolean;
	onTogglePassword: () => void;
	onToggleConfirmPassword: () => void;
	setValue: UseFormSetValue<SignupFormData>;
}

export const SignupFormFields = ({
	register,
	errors,
	rucValidation,
	password,
	passwordStrength,
	acceptTerms,
	showPassword,
	showConfirmPassword,
	onTogglePassword,
	onToggleConfirmPassword,
	setValue,
}: SignupFormFieldsProps) => (
	<>
		<MotionDiv variants={entranceVariants} className="space-y-3">
			<Text
				variant="label"
				className="ml-1 text-sm font-medium text-foreground"
			>
				Nombre Completo
			</Text>
			<div className="group relative">
				<User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/80 transition-all duration-300 group-focus-within:text-primary" />
				<Input
					{...register("name")}
					placeholder="Juan Pérez Rodríguez"
					aria-describedby={errors.name ? "name-error" : undefined}
					className="h-14 rounded-xl border-border bg-card/70 pl-12 text-base font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/70"
				/>
			</div>
			{errors.name ? (
				<Text
					variant="label"
					id="name-error"
					className="ml-1 text-xs text-red-400"
				>
					{errors.name.message}
				</Text>
			) : null}
		</MotionDiv>

		<MotionDiv variants={entranceVariants} className="space-y-3">
			<Text
				variant="label"
				className="ml-1 text-sm font-medium text-foreground"
			>
				Correo Electrónico
			</Text>
			<div className="group relative">
				<Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/80 transition-all duration-300 group-focus-within:text-primary" />
				<Input
					{...register("email")}
					type="email"
					placeholder="usuario@empresa.com"
					aria-describedby={errors.email ? "email-error" : undefined}
					className="h-14 rounded-xl border-border bg-card/70 pl-12 text-base font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/70"
				/>
			</div>
			{errors.email ? (
				<Text
					variant="label"
					id="email-error"
					className="ml-1 text-xs text-red-400"
				>
					{errors.email.message}
				</Text>
			) : null}
		</MotionDiv>

		<MotionDiv variants={entranceVariants} className="space-y-3">
			<Text
				variant="label"
				className="ml-1 text-sm font-medium text-foreground"
			>
				RUC Empresarial
			</Text>
			<div className="group relative">
				<Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/80 transition-all duration-300 group-focus-within:text-primary" />
				<Input
					{...register("ruc")}
					placeholder="20512345678"
					maxLength={11}
					aria-describedby={errors.ruc ? "ruc-error" : undefined}
					className="h-14 rounded-xl border-border bg-card/70 pl-12 pr-12 text-base font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/70"
				/>
				<div className="absolute right-4 top-1/2 -translate-y-1/2">
					{rucValidation.status === "loading" ? (
						<Loader2 className="h-5 w-5 animate-spin text-primary" />
					) : null}
					{rucValidation.status === "valid" ? (
						<Check className="h-5 w-5 text-[var(--premium-success)]" />
					) : null}
					{rucValidation.status === "invalid" ? (
						<X className="h-5 w-5 text-red-500" />
					) : null}
				</div>
			</div>

			{rucValidation.status === "valid" && rucValidation.companyName ? (
				<div className="ml-1 flex items-center gap-2">
					<Check className="h-3 w-3 text-[var(--premium-success)]" />
					<Text
						variant="label"
						className="text-xs text-[var(--premium-success)]"
					>
						{rucValidation.companyName}
					</Text>
				</div>
			) : null}

			{rucValidation.status === "invalid" && rucValidation.error ? (
				<div className="ml-1 flex items-center gap-2">
					<AlertCircle className="h-3 w-3 text-red-500" />
					<Text variant="label" className="text-xs text-red-400">
						{rucValidation.error}
					</Text>
				</div>
			) : null}

			{errors.ruc ? (
				<Text
					variant="label"
					id="ruc-error"
					className="ml-1 text-xs text-red-400"
				>
					{errors.ruc.message}
				</Text>
			) : null}
			<Text variant="label" className="ml-1 text-xs text-muted-foreground/80">
				RUC de 11 dígitos de su empresa (SUNAT 2026)
			</Text>
		</MotionDiv>

		<MotionDiv variants={entranceVariants} className="space-y-3">
			<Text
				variant="label"
				className="ml-1 text-sm font-medium text-foreground"
			>
				Contraseña
			</Text>
			<div className="group relative">
				<Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/80 transition-all duration-300 group-focus-within:text-primary" />
				<Input
					{...register("password")}
					type={showPassword ? "text" : "password"}
					placeholder="••••••••"
					aria-describedby={errors.password ? "password-error" : undefined}
					className="h-14 rounded-xl border-border bg-card/70 pl-12 pr-12 text-base font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/70"
				/>
				<button
					type="button"
					onClick={onTogglePassword}
					aria-label={
						showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
					}
					className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 transition-colors hover:text-foreground focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:outline-none rounded-md p-1"
				>
					{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
				</button>
			</div>

			{password && passwordStrength ? (
				<div className="space-y-2">
					<div className="flex gap-1">
						{[...Array(5)].map((_, index) => (
							<div
								key={index}
								className={`h-1 flex-1 rounded-full transition-all duration-300 ${
									index < passwordStrength.score
										? passwordStrength.color
										: "bg-border"
								}`}
							/>
						))}
					</div>
					<Text variant="label" className="ml-1 text-xs text-muted-foreground">
						Fortaleza: {passwordStrength.label}
					</Text>
				</div>
			) : null}

			{errors.password ? (
				<Text
					variant="label"
					id="password-error"
					className="ml-1 text-xs text-red-400"
				>
					{errors.password.message}
				</Text>
			) : null}
		</MotionDiv>

		<MotionDiv variants={entranceVariants} className="space-y-3">
			<Text
				variant="label"
				className="ml-1 text-sm font-medium text-foreground"
			>
				Confirmar Contraseña
			</Text>
			<div className="group relative">
				<Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/80 transition-all duration-300 group-focus-within:text-primary" />
				<Input
					{...register("confirmPassword")}
					type={showConfirmPassword ? "text" : "password"}
					placeholder="••••••••"
					aria-describedby={
						errors.confirmPassword ? "confirmPassword-error" : undefined
					}
					className="h-14 rounded-xl border-border bg-card/70 pl-12 pr-12 text-base font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/70"
				/>
				<button
					type="button"
					onClick={onToggleConfirmPassword}
					aria-label={
						showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
					}
					className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 transition-colors hover:text-foreground focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:outline-none rounded-md p-1"
				>
					{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
				</button>
			</div>
			{errors.confirmPassword ? (
				<Text
					variant="label"
					id="confirmPassword-error"
					className="ml-1 text-xs text-red-400"
				>
					{errors.confirmPassword.message}
				</Text>
			) : null}
		</MotionDiv>

		<MotionDiv
			variants={entranceVariants}
			className="flex items-start space-x-3 px-1"
		>
			<Checkbox
				id="acceptTerms"
				checked={acceptTerms}
				onCheckedChange={(checked) => setValue("acceptTerms", Boolean(checked))}
				className="mt-1 border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
			/>
			<label
				htmlFor="acceptTerms"
				className="cursor-pointer select-none text-sm leading-relaxed text-muted-foreground"
			>
				Acepto los{" "}
				<a href="/terms" className="text-primary hover:underline">
					Términos y Condiciones
				</a>{" "}
				y la{" "}
				<a href="/privacy" className="text-primary hover:underline">
					Política de Privacidad
				</a>{" "}
				(Requerido por SUNAT 2026)
			</label>
		</MotionDiv>

		{errors.acceptTerms ? (
			<Text variant="label" className="-mt-2 ml-1 text-xs text-red-400">
				{errors.acceptTerms.message}
			</Text>
		) : null}
	</>
);
