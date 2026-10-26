import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import type {
	FieldErrors,
	UseFormRegister,
	UseFormSetValue,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const INPUT = "h-12 rounded-lg border-border bg-card px-3 text-base";

interface FieldProps {
	id: string;
	label: string;
	error?: string | undefined;
	hint?: ReactNode;
	children: ReactNode;
}

function Field({ id, label, error, hint, children }: FieldProps) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id} className="text-sm font-medium">
				{label}
			</Label>
			{children}
			{error ? (
				<p id={`${id}-error`} role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			{hint}
		</div>
	);
}

function RucStatus({ state }: { state: RucValidationState }) {
	if (state.status === "loading") {
		return (
			<Loader2
				aria-label="Validando RUC"
				className="size-5 animate-spin text-muted-foreground motion-reduce:animate-none"
			/>
		);
	}
	if (state.status === "valid") {
		return <Check aria-hidden="true" className="size-5 text-success" />;
	}
	if (state.status === "invalid") {
		return <X aria-hidden="true" className="size-5 text-destructive" />;
	}
	return null;
}

function RucMessage({ state }: { state: RucValidationState }) {
	if (state.status === "valid" && state.companyName) {
		return <p className="text-sm text-success">{state.companyName}</p>;
	}
	if (state.status === "invalid" && state.error) {
		return <p className="text-sm text-destructive">{state.error}</p>;
	}
	return null;
}

const STRENGTH_STEPS = ["s1", "s2", "s3", "s4", "s5"] as const;

function StrengthMeter({ strength }: { strength: PasswordStrength }) {
	return (
		<div className="space-y-1.5">
			<div className="flex gap-1" aria-hidden="true">
				{STRENGTH_STEPS.map((step, index) => (
					<div
						key={step}
						className={`h-1 flex-1 rounded-full ${
							index < strength.score ? strength.color : "bg-border"
						}`}
					/>
				))}
			</div>
			<p className="text-sm text-muted-foreground">
				Fortaleza: {strength.label}
			</p>
		</div>
	);
}

interface PasswordInputProps {
	id: string;
	visible: boolean;
	onToggle: () => void;
	describedBy: string | undefined;
	registration: ReturnType<UseFormRegister<SignupFormData>>;
}

function PasswordInput({
	id,
	visible,
	onToggle,
	describedBy,
	registration,
}: PasswordInputProps) {
	return (
		<div className="relative">
			<Input
				{...registration}
				id={id}
				type={visible ? "text" : "password"}
				autoComplete="new-password"
				aria-describedby={describedBy}
				className={`${INPUT} pr-12`}
			/>
			<button
				type="button"
				onClick={onToggle}
				aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
				className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
			>
				{visible ? <EyeOff size={18} /> : <Eye size={18} />}
			</button>
		</div>
	);
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
		<Field id="name" label="Nombre completo" error={errors.name?.message}>
			<Input
				{...register("name")}
				id="name"
				autoComplete="name"
				placeholder="Juan Pérez Rodríguez"
				aria-describedby={errors.name ? "name-error" : undefined}
				className={INPUT}
			/>
		</Field>

		<Field id="email" label="Correo electrónico" error={errors.email?.message}>
			<Input
				{...register("email")}
				id="email"
				type="email"
				autoComplete="email"
				placeholder="usuario@empresa.com"
				aria-describedby={errors.email ? "email-error" : undefined}
				className={INPUT}
			/>
		</Field>

		<Field
			id="ruc"
			label="RUC de la empresa"
			error={errors.ruc?.message}
			hint={
				<>
					<RucMessage state={rucValidation} />
					<p className="text-sm text-muted-foreground">
						11 dígitos. Lo validamos con SUNAT.
					</p>
				</>
			}
		>
			<div className="relative">
				<Input
					{...register("ruc")}
					id="ruc"
					inputMode="numeric"
					maxLength={11}
					placeholder="20512345678"
					aria-describedby={errors.ruc ? "ruc-error" : undefined}
					className={`${INPUT} pr-11 tabular-nums`}
				/>
				<div className="absolute top-1/2 right-3 -translate-y-1/2">
					<RucStatus state={rucValidation} />
				</div>
			</div>
		</Field>

		<Field
			id="password"
			label="Contraseña"
			error={errors.password?.message}
			hint={
				password && passwordStrength ? (
					<StrengthMeter strength={passwordStrength} />
				) : null
			}
		>
			<PasswordInput
				id="password"
				visible={showPassword}
				onToggle={onTogglePassword}
				describedBy={errors.password ? "password-error" : undefined}
				registration={register("password")}
			/>
		</Field>

		<Field
			id="confirmPassword"
			label="Confirmar contraseña"
			error={errors.confirmPassword?.message}
		>
			<PasswordInput
				id="confirmPassword"
				visible={showConfirmPassword}
				onToggle={onToggleConfirmPassword}
				describedBy={
					errors.confirmPassword ? "confirmPassword-error" : undefined
				}
				registration={register("confirmPassword")}
			/>
		</Field>

		<div className="flex items-start gap-3">
			<Checkbox
				id="acceptTerms"
				checked={acceptTerms}
				onCheckedChange={(checked) => setValue("acceptTerms", Boolean(checked))}
				className="mt-0.5"
			/>
			<Label
				htmlFor="acceptTerms"
				className="cursor-pointer text-sm leading-relaxed font-normal text-muted-foreground"
			>
				Acepto los{" "}
				<a
					href="/terms"
					className="text-brand underline-offset-4 hover:underline"
				>
					Términos y Condiciones
				</a>{" "}
				y la{" "}
				<a
					href="/privacy"
					className="text-brand underline-offset-4 hover:underline"
				>
					Política de Privacidad
				</a>
				.
			</Label>
		</div>
		{errors.acceptTerms ? (
			<p role="alert" className="text-sm text-destructive">
				{errors.acceptTerms.message}
			</p>
		) : null}
	</>
);
