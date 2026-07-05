import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import {
	clearActiveCompanyContext,
	mergeUserWithStoredCompanyContext,
	syncActiveCompanyContextFromUser,
} from "@/lib/company-context";
import { captureError } from "@/lib/monitoring";
import { readAuthSessionSnapshot } from "../lib/auth-session-snapshot";
import type { LoginCredentials, Session, User } from "../types/auth.types";

const enableDemoAuth =
	import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === "true";

const DEMO_USER: User = {
	id: "demo-admin-001",
	name: "Albert Admin",
	email: "admin@drenyrafounders.com",
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	role: "ADMIN",
	companyId: "demo-company-001",
	companyName: "Drenyra Demo SAC",
	ruc: "20123456789",
};

const DEMO_SESSION: Session = {
	id: "demo-session-001",
	userId: "demo-admin-001",
	expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	token: "demo-token-mock",
	ipAddress: "127.0.0.1",
	userAgent: "Demo Mode",
};

function messageFromTreatyError(error: unknown): string {
	if (typeof error === "string") return error;
	if (typeof error === "object" && error !== null) {
		const o = error as Record<string, unknown>;
		if (typeof o.error === "string") return o.error;
		if (typeof o.message === "string") return o.message;
	}
	return "Error desconocido";
}

/**
 * AuthService - Capa de Infraestructura para Autenticación
 *
 * Centraliza todas las llamadas a red y lógica de sincronización
 * de sesión para evitar fugas de lógica en los stores de estado.
 */
export const AuthService = {
	/**
	 * Realiza el login usando la API de Elysia (Type-Safe via Eden)
	 */
	async login(
		credentials: LoginCredentials,
	): Promise<{ user: User; session: Session | null }> {
		if (enableDemoAuth) {
			return { user: DEMO_USER, session: DEMO_SESSION };
		}

		try {
			// 1. Llamada a la API de Auth personalizada (que a su vez usa BetterAuth en el backend)
			const { error, status } = await api.api.auth.login.post(credentials);

			if (error) {
				throw this.handleApiError(error, status);
			}

			// 2. Obtener Snapshot de la sesión (BetterAuth sincroniza cookies)
			let user: User | null = null;
			let session: Session | null = null;

			const sessionSnapshot = await readAuthSessionSnapshot();
			if (sessionSnapshot?.user) {
				user = sessionSnapshot.user as User;
				session = sessionSnapshot.session as Session;
			}

			// 3. Fallback: Si no hay snapshot, intentar obtener sesión directamente de BetterAuth
			if (!user) {
				const { data: betterAuthData } = await authClient.getSession();
				user = betterAuthData?.user as User | null;
				session = betterAuthData?.session as Session | null;
			}

			if (!user) {
				throw new Error(
					"AUTH_SESSION_MISSING: No se pudo recuperar la sesión después del login.",
				);
			}

			// 4. Hidratar contexto de empresa (Lógica de negocio)
			const hydratedUser = mergeUserWithStoredCompanyContext(user);
			if (hydratedUser) {
				syncActiveCompanyContextFromUser(hydratedUser);
			}

			return {
				user: hydratedUser || user,
				session,
			};
		} catch (error) {
			captureError(error instanceof Error ? error : new Error("Login failed"), {
				email: credentials.email,
				source: "AuthService.login",
			});
			throw error;
		}
	},

	/**
	 * Cierra la sesión en el servidor y limpia el estado local
	 */
	async logout(): Promise<void> {
		try {
			await authClient.signOut();
			clearActiveCompanyContext();
		} catch (error) {
			captureError(
				error instanceof Error ? error : new Error("Logout failed"),
				{
					source: "AuthService.logout",
				},
			);
			throw error;
		}
	},

	/**
	 * Mapea errores técnicos a mensajes legibles o códigos de error semánticos
	 */
	handleApiError(error: unknown, status: number): Error {
		const message = messageFromTreatyError(error);

		if (status === 401 && /verifica|verificar|verified|email/i.test(message)) {
			return new Error(message);
		}
		if (status === 401)
			return new Error(
				"Credenciales inválidas. Por favor verifique su correo y contraseña.",
			);
		if (status === 403 && message !== "Error desconocido") {
			return new Error(message);
		}
		if (status === 403)
			return new Error("Cuenta suspendida o sin permisos de acceso.");
		if (status >= 500)
			return new Error(
				"Error interno del servidor. Intente nuevamente más tarde.",
			);

		if (message.includes("failed to fetch")) {
			return new Error(
				"No se pudo conectar con el servidor. Verifique su conexión a internet.",
			);
		}

		return new Error(message);
	},
};
