import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getAppQueryClient } from "@/lib/query-client";
import { authSessionKeys } from "../lib/auth-session.query";
import { clearDemoAccess } from "../lib/demo-access";
import { AuthService } from "../services/AuthService";
import type {
	AuthState,
	LoginCredentials,
	Session,
	User,
} from "../types/auth.types";

/**
 * Acciones atómicas para el Store de Autenticación
 * Se separan del estado para mejorar la legibilidad y evitar
 * que el estado sea un "God Object".
 */
interface AuthActions {
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => Promise<void>;
	setSession: (session: { user: User; session: Session | null } | null) => void;
	updateUser: (patch: Partial<User>) => void;
	reset: () => void;
}

const initialState: AuthState = {
	user: null,
	session: null,
	isAuthenticated: false,
	isLoading: false,
};

/**
 * useAuthStore - El Single Source of Truth para la identidad del usuario.
 *
 * Implementa persistencia automática para el usuario e identidad básica.
 * Los tokens de sesión se gestionan exclusivamente vía Cookies HTTP-Only
 * a través de BetterAuth para máxima seguridad contra XSS.
 */
export const useAuthStore = create<AuthState & AuthActions>()(
	persist(
		(set, get) => ({
			...initialState,

			/**
			 * Acción de Login - Delega la infraestructura al AuthService
			 */
			login: async (credentials) => {
				set({ isLoading: true });

				try {
					const { user, session } = await AuthService.login(credentials);

					set({
						user,
						session,
						isAuthenticated: true,
						isLoading: false,
					});

					// Sincronizar con TanStack Query para que otros hooks se enteren
					getAppQueryClient()?.setQueryData(authSessionKeys.all, {
						user,
						session,
					});
				} catch (error) {
					set({ isLoading: false });
					// El error ya fue capturado y mapeado en AuthService
					throw error;
				}
			},

			/**
			 * Acción de Logout - Limpia servidores y estado local
			 */
			logout: async () => {
				set({ isLoading: true });
				try {
					await AuthService.logout();
				} finally {
					clearDemoAccess();
					getAppQueryClient()?.setQueryData(authSessionKeys.all, null);
					set(initialState);
				}
			},

			/**
			 * Permite hidratar la sesión desde eventos externos (ej: BetterAuth callback)
			 */
			setSession: (sessionData) => {
				if (sessionData) {
					set({
						user: sessionData.user,
						session: sessionData.session,
						isAuthenticated: true,
					});
				} else {
					getAppQueryClient()?.setQueryData(authSessionKeys.all, null);
					set(initialState);
				}
			},

			/**
			 * Actualización parcial del usuario (ej: cambio de perfil o empresa activa)
			 */
			updateUser: (patch) => {
				const currentUser = get().user;
				if (!currentUser) return;

				set({
					user: { ...currentUser, ...patch } as User,
				});
			},

			/**
			 * Hard reset del estado (útil en debug o errores fatales de sesión)
			 */
			reset: () => set(initialState),
		}),
		{
			name: "drenyra-auth-storage",
			storage: createJSONStorage(() => window.localStorage),
			// Solo persistimos lo necesario para identificar al usuario
			// BetterAuth gestiona la sesión real vía cookies
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);
