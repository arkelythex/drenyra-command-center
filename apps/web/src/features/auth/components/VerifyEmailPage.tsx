import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { Text } from "@/components/atoms/text";
import { authClient } from "@/lib/auth-client";
import { captureError } from "@/lib/monitoring";
import { useAuthSession } from "../hooks/useAuthSession";
import { AuthLayout } from "./AuthLayout";

export const VerifyEmailPage = () => {
	const navigate = useNavigate();
	const { user } = useAuthSession();
	const [status, setStatus] = useState<"verifying" | "success" | "error">(
		"verifying",
	);
	const [canResend, setCanResend] = useState(false);
	const [countdown, setCountdown] = useState(60);
	const [isResending, setIsResending] = useState(false);

	const searchParams = new URLSearchParams(window.location.search);
	const token = searchParams.get("token");

	const verifyEmail = async () => {
		if (!token) {
			setStatus("error");
			return;
		}

		try {
			const { error } = await authClient.verifyEmail({
				query: { token: token! },
			});

			if (error) {
				setStatus("error");
				toast.error("Error al verificar email", {
					description: error.message || "Token inválido o expirado",
				});
				return;
			}

			setStatus("success");
			toast.success("Email verificado", {
				description: "Redirigiendo al dashboard...",
			});

			setTimeout(() => {
				navigate({ to: "/" });
			}, 2000);
		} catch (error) {
			captureError(
				error instanceof Error ? error : new Error("Email verification failed"),
				{
					hasToken: Boolean(token),
					source: "features/auth/VerifyEmailPage.verifyEmail",
				},
			);
			setStatus("error");
		}
	};

	useEffect(() => {
		verifyEmail();
	}, [token]);

	useEffect((): void | (() => void) => {
		if (status === "error" && countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}

		if (countdown === 0) {
			setCanResend(true);
		}

		return undefined;
	}, [countdown, status]);

	const handleResend = async () => {
		// SECURITY FIX: Use authenticated user's email instead of empty string
		if (!user?.email) {
			toast.error("No se pudo obtener tu email", {
				description: "Por favor inicia sesión nuevamente.",
			});
			navigate({ to: "/login" });
			return;
		}

		setIsResending(true);

		try {
			const { error } = await authClient.sendVerificationEmail({
				email: user.email,
				callbackURL: `${window.location.origin}/verify-email`,
			});

			if (error) {
				toast.error("Error al reenviar email", {
					description: error.message || "No pudimos enviar el email",
				});
				return;
			}

			toast.success("Email reenviado", {
				description: `Revisa tu bandeja de entrada en ${user.email}`,
			});

			setCountdown(60);
			setCanResend(false);
		} catch (error) {
			captureError(
				error instanceof Error
					? error
					: new Error("Verification email resend failed"),
				{
					emailDomain: user.email.split("@")[1] ?? null,
					source: "features/auth/VerifyEmailPage.handleResend",
				},
			);
			toast.error("Error inesperado");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<AuthLayout
			title={
				status === "verifying"
					? "Verificando..."
					: status === "success"
						? "Email Verificado"
						: "Error de Verificación"
			}
			subtitle={
				status === "verifying"
					? "Por favor espera"
					: status === "success"
						? "Tu email ha sido verificado"
						: "No pudimos verificar tu email"
			}
		>
			<MotionDiv
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				className="space-y-6 text-center"
			>
				{status === "verifying" && (
					<MotionDiv
						variants={entranceVariants}
						className="flex justify-center"
					>
						<Loader2 className="h-16 w-16 animate-spin text-primary" />
					</MotionDiv>
				)}

				{status === "success" && (
					<>
						<MotionDiv
							variants={entranceVariants}
							className="flex justify-center"
						>
							<CheckCircle className="h-16 w-16 text-[var(--premium-success)]" />
						</MotionDiv>
						<MotionDiv variants={entranceVariants}>
							<Text className="text-foreground/90">
								Tu email ha sido verificado exitosamente. Ahora tienes acceso
								completo a todas las funcionalidades de Arkelythex.
							</Text>
						</MotionDiv>
					</>
				)}

				{status === "error" && (
					<>
						<MotionDiv
							variants={entranceVariants}
							className="flex justify-center"
						>
							<XCircle className="h-16 w-16 text-red-500" />
						</MotionDiv>
						<MotionDiv variants={entranceVariants}>
							<Text className="text-foreground/90">
								El enlace de verificación es inválido o ha expirado.
							</Text>
						</MotionDiv>

						{!canResend && (
							<MotionDiv variants={entranceVariants}>
								<Text variant="label" className="text-muted-foreground text-sm">
									Podrás reenviar el email en {countdown} segundos
								</Text>
							</MotionDiv>
						)}

						{canResend && (
							<MotionDiv
								variants={entranceVariants}
								className="flex flex-col gap-3"
							>
								<Button
									onClick={handleResend}
									disabled={isResending}
									className="w-full"
								>
									{isResending ? (
										<Loader2 className="animate-spin" />
									) : (
										"Reenviar email de verificación"
									)}
								</Button>
								<Button variant="outline" asChild>
									<a href="/login">Volver al inicio de sesión</a>
								</Button>
							</MotionDiv>
						)}
					</>
				)}
			</MotionDiv>
		</AuthLayout>
	);
};
