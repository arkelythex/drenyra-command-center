import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	MotionDiv,
	containerVariants,
	entranceVariants,
} from "@/components/ui/motion-primitives";
import { Text } from "@/components/atoms/text";
import { useAuthStore } from "../hooks/useAuth";
import {
	RegisterCorporateUserError,
	registerCorporateUser,
} from "../lib/register-corporate-user";
import { AuthBrandHeader } from "./auth-page/AuthBrandHeader";
import { AuthCardFooter } from "./auth-page/AuthCardFooter";
import { AuthTabSwitch } from "./auth-page/AuthTabSwitch";
import { LoginPanel } from "./auth-page/LoginPanel";
import { SignupPanel } from "./auth-page/SignupPanel";
import {
	type LoginFormData,
	loginSchema,
	type SignupFormData,
	signupSchema,
} from "./auth-page/schemas";

const defaultLoginValues: LoginFormData = {
	email: "",
	password: "",
};
const showLocalDevHint = import.meta.env.DEV;

export function AuthPage() {
	const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuthStore();

	useEffect(() => {
		 
		setIsLoading(false);
	}, []);

	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: defaultLoginValues,
	});

	const signupForm = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		defaultValues: { name: "", email: "", ruc: "", password: "" },
	});

	const onLoginSubmit = async (data: LoginFormData) => {
		setIsLoading(true);
		try {
			await login(data);
			toast.success("✅ Bienvenido a Arkelythex");
			window.location.assign("/");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Error al iniciar sesión";
			toast.error(`❌ ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	};

	const onSignupSubmit = async (data: SignupFormData) => {
		setIsLoading(true);
		try {
			const message = await registerCorporateUser({
				email: data.email,
				password: data.password,
				name: data.name,
				ruc: data.ruc,
			});

			toast.success(message || "✅ Cuenta creada exitosamente");
			setActiveTab("login");
			loginForm.setValue("email", data.email);
		} catch (error) {
			if (error instanceof RegisterCorporateUserError) {
				toast.error(error.message || "Error al crear cuenta");
			} else {
				toast.error("Error inesperado al crear cuenta");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
			<div className="absolute inset-0 opacity-30">
				<div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-transparent to-muted/20" />
			</div>

			<MotionDiv
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				className="w-full max-w-[480px] relative z-10"
			>
				<AuthBrandHeader />

				<MotionDiv
					variants={entranceVariants}
					className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5 ring-1 ring-border/50"
				>
					<AuthTabSwitch activeTab={activeTab} onChange={setActiveTab} />

					<MotionDiv
						key={activeTab}
						initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.22, ease: "easeOut" }}
					>
						{activeTab === "login" ? (
							<LoginPanel
								form={loginForm}
								isLoading={isLoading}
								onSubmit={onLoginSubmit}
							/>
						) : (
							<SignupPanel
								form={signupForm}
								isLoading={isLoading}
								onSubmit={onSignupSubmit}
							/>
						)}
					</MotionDiv>

					{showLocalDevHint && activeTab === "login" ? (
						<div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-3">
							<Text
								variant="label"
								className="block text-label tracking-[0.12em] text-foreground/80"
							>
								Local Dev
							</Text>
							<Text
								variant="body"
								className="mt-1 block text-xs text-muted-foreground"
							>
								Si necesitas recrear el acceso demo local, ejecuta{" "}
								<code>bun run db:seed</code>.
							</Text>
						</div>
					) : null}

					<AuthCardFooter />
				</MotionDiv>

				<MotionDiv variants={entranceVariants} className="mt-8 text-center">
					<Text
						variant="label"
						className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
					>
						v2.0.0 • Arkelythex Financial Intelligence Platform
					</Text>
				</MotionDiv>
			</MotionDiv>
		</div>
	);
}
