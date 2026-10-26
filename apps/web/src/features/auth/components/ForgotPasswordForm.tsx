import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Text } from "@/components/atoms/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { authClient } from "@/lib/auth-client";
import { captureError } from "@/lib/monitoring";
import {
	type ForgotPasswordFormData,
	forgotPasswordSchema,
} from "../schemas/forgot-password.schema";
import { AuthLayout } from "./AuthLayout";
import { AuthSubmitButton } from "./AuthSubmitButton";

export const ForgotPasswordForm = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async (data: ForgotPasswordFormData) => {
		setIsLoading(true);

		try {
			const { error } = await authClient.requestPasswordReset({
				email: data.email,
				redirectTo: `${window.location.origin}/reset-password`,
			});

			if (error) {
				toast.error("Error al enviar email", {
					description: error.message || "Por favor intenta nuevamente.",
				});
				return;
			}

			setEmailSent(true);
			toast.success("Email enviado", {
				description: "Revisa tu bandeja de entrada para continuar.",
			});
		} catch (error) {
			captureError(
				error instanceof Error
					? error
					: new Error("Forgot password request failed"),
				{
					emailDomain: data.email.split("@")[1] ?? null,
					source: "features/auth/ForgotPasswordForm.onSubmit",
				},
			);
			toast.error("Error inesperado");
		} finally {
			setIsLoading(false);
		}
	};

	if (emailSent) {
		return (
			<AuthLayout
				title="Email Enviado"
				subtitle="Revisa tu bandeja de entrada."
			>
				<MotionDiv
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="space-y-6 text-center"
				>
					<MotionDiv
						variants={entranceVariants}
						className="flex justify-center"
					>
						<CheckCircle className="h-16 w-16 text-success" />
					</MotionDiv>

					<MotionDiv variants={entranceVariants}>
						<Text className="text-foreground/90 text-base">
							Hemos enviado un enlace para restablecer tu contraseña a tu correo
							electrónico.
						</Text>
					</MotionDiv>

					<MotionDiv variants={entranceVariants}>
						<Text variant="label" className="text-muted-foreground text-sm">
							Si no recibes el email en 5 minutos, revisa tu carpeta de spam.
						</Text>
					</MotionDiv>

					<MotionDiv variants={entranceVariants}>
						<Button variant="outline" asChild className="w-full">
							<a href="/login">Volver al inicio de sesión</a>
						</Button>
					</MotionDiv>
				</MotionDiv>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			title="Recuperar Contraseña"
			subtitle="Ingresa tu email para restablecer tu contraseña."
		>
			<MotionDiv
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				onSubmit={handleSubmit(onSubmit)}
				className="space-y-8"
				tagName="form"
			>
				<MotionDiv variants={entranceVariants} className="space-y-3">
					<Text
						variant="label"
						className="text-foreground ml-1 text-sm font-medium"
					>
						Correo Electrónico
					</Text>
					<div className="relative group">
						<Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/80 group-focus-within:text-primary transition-colors duration-300" />
						<Input
							{...register("email")}
							type="email"
							placeholder="usuario@empresa.com"
							className="h-14 rounded-xl border-border bg-card/70 pl-12 text-base font-medium text-foreground transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-muted-foreground/70"
						/>
					</div>
					{errors.email && (
						<Text variant="label" className="text-destructive ml-1 text-xs">
							{errors.email.message}
						</Text>
					)}
				</MotionDiv>

				<MotionDiv variants={entranceVariants}>
					<AuthSubmitButton isLoading={isLoading}>
						Enviar enlace
					</AuthSubmitButton>
				</MotionDiv>

				<MotionDiv variants={entranceVariants} className="text-center pt-2">
					<Text variant="label" className="text-muted-foreground/80 text-sm">
						¿Recordaste tu contraseña?{" "}
						<a
							href="/login"
							className="ml-1 border-b border-border pb-0.5 font-medium text-muted-foreground transition-[color,border-color] duration-200 hover:text-foreground hover:border-border"
						>
							Iniciar Sesión
						</a>
					</Text>
				</MotionDiv>
			</MotionDiv>
		</AuthLayout>
	);
};
