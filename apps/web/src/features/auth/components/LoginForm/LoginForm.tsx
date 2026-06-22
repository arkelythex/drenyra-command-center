import { useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../hooks/useAuth";
import { toast } from "sonner";
import { AuthLayout } from "../AuthLayout";
import { loginSchema, type LoginFormData } from "./LoginForm.types";
import { resolveSafeLoginRedirect } from "./LoginForm.utils";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import { FormOptions } from "./components/FormOptions";
import { SubmitButton } from "./components/SubmitButton";
import { FormFooter } from "./components/FormFooter";

export { resolveSafeLoginRedirect };

export const LoginForm = () => {
	const { login, isLoading: isAuthLoading } = useAuthStore();
	const navigate = useNavigate();
	const [isPending, startTransition] = useTransition();

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: true,
		},
	});

	const isLoading = isAuthLoading || isPending;

	const onSubmit = (data: LoginFormData) => {
		startTransition(async () => {
			try {
				await login({ email: data.email, password: data.password });

				toast.success("Acceso Autorizado", {
					description: "Sincronizando entorno de trabajo...",
					icon: <ShieldCheck className="h-4 w-4 text-primary" />,
				});

				navigate({
					from: "/login",
					to: resolveSafeLoginRedirect(window.location.search),
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Error de autenticación";
				toast.error("Fallo en el Protocolo", {
					description: errorMessage,
				});
			}
		});
	};

	return (
		<AuthLayout
			title="Acceso seguro"
			subtitle="Ingresa al centro operativo de finanzas, impuestos y auditoría."
		>
			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					noValidate
					className="space-y-5"
				>
					<EmailField />
					<PasswordField />
					<FormOptions />
					<SubmitButton isLoading={isLoading} />
					<FormFooter />
				</form>
			</FormProvider>
		</AuthLayout>
	);
};
