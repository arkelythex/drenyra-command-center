import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Text } from "@/components/atoms/text";
import { Button } from "@/components/ui/button";
import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { captureError } from "@/lib/monitoring";
import {
	RegisterCorporateUserError,
	registerCorporateUser,
} from "../lib/register-corporate-user";
import { AuthLayout } from "./AuthLayout";
import { SignupFormFields } from "./signup/SignupFormFields";
import {
	calculatePasswordStrength,
	type SignupFormData,
	signupSchema,
} from "./signup/signup-form.validation";
import { useRucValidation } from "./signup/signup-ruc-validation";

export const SignupForm = () => {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: "",
			email: "",
			ruc: "",
			password: "",
			confirmPassword: "",
			acceptTerms: false,
		},
	});

	const password = watch("password");
	const ruc = watch("ruc");
	const acceptTerms = watch("acceptTerms");
	const passwordStrength = password
		? calculatePasswordStrength(password)
		: null;
	const rucValidation = useRucValidation(ruc);

	const onSubmit = async (data: SignupFormData) => {
		setIsLoading(true);

		try {
			const message = await registerCorporateUser({
				email: data.email,
				password: data.password,
				name: data.name,
				ruc: data.ruc,
			});

			toast.success("¡Cuenta creada exitosamente!", {
				description:
					message || "Te estamos redirigiendo al inicio de sesión...",
			});

			navigate({ to: "/login" });
		} catch (error) {
			if (error instanceof RegisterCorporateUserError) {
				if (error.code === "EMAIL_EXISTS" || error.field === "email") {
					toast.error("Este email ya está registrado", {
						description: "Por favor usa otro email o inicia sesión.",
					});
					return;
				}

				if (error.code?.includes("RUC") || error.field === "ruc") {
					toast.error("Error con RUC", {
						description: error.message,
					});
					return;
				}

				toast.error("Error al crear cuenta", {
					description: error.message || "Por favor intenta nuevamente.",
				});
				return;
			}

			captureError(
				error instanceof Error ? error : new Error("Signup failed"),
				{
					emailDomain: data.email.split("@")[1] ?? null,
					rucLength: data.ruc.length,
					source: "features/auth/SignupForm.onSubmit",
				},
			);
			toast.error("Error inesperado al crear cuenta");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthLayout
			title="Registro"
			subtitle="Cree su cuenta para acceder a la plataforma."
		>
			<MotionDiv
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				onSubmit={handleSubmit(onSubmit)}
				className="space-y-6"
				tagName="form"
			>
				<SignupFormFields
					register={register}
					errors={errors}
					rucValidation={rucValidation}
					password={password}
					passwordStrength={passwordStrength}
					acceptTerms={acceptTerms}
					showPassword={showPassword}
					showConfirmPassword={showConfirmPassword}
					onTogglePassword={() => setShowPassword((prev) => !prev)}
					onToggleConfirmPassword={() =>
						setShowConfirmPassword((prev) => !prev)
					}
					setValue={setValue}
				/>

				<MotionDiv variants={entranceVariants}>
					<Button
						type="submit"
						disabled={isLoading}
						className="group relative h-14 w-full overflow-hidden rounded-xl border-none bg-primary text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition-[background-color,box-shadow,opacity] duration-200 hover:opacity-90 motion-reduce:transition-none"
					>
						{isLoading ? (
							<Loader2 className="animate-spin" />
						) : (
							<span className="relative z-10 flex items-center gap-3">
								CREAR CUENTA
								<ArrowRight
									size={20}
									strokeWidth={2.5}
									className="transition-colors"
								/>
							</span>
						)}
					</Button>
				</MotionDiv>

				<MotionDiv variants={entranceVariants} className="pt-2 text-center">
					<Text variant="label" className="text-sm text-muted-foreground/80">
						¿Ya tienes cuenta?{" "}
						<a
							href="/login"
							className="ml-1 border-b border-border pb-0.5 font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground"
						>
							Iniciar Sesión
						</a>
					</Text>
				</MotionDiv>
			</MotionDiv>
		</AuthLayout>
	);
};
