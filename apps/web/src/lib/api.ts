/**
 * API Helpers & Context Management
 *
 * Este archivo centraliza el acceso al estado de autenticación y tenant
 * para ser inyectado en las cabeceras de los requests.
 */

import { useAuthStore } from "../features/auth/hooks/useAuth";
import type { User } from "../features/auth/types/auth.types";

export { api } from "./api-client";

interface AuthContext {
	user: User | null;
	isAuthenticated: boolean;
	companyId: string;
}

export interface TenantContext {
	companyId: string;
	organizationId: string;
	isAuthenticated: boolean;
	authUserId: string;
	legacyUserId: string;
	userRole: string;
}

/**
 * Helper to extract current auth and tenant state from Zustand.
 * Usamos getState() para evitar el overhead de hooks en utilitarios
 * que se llaman fuera de componentes React.
 */
const getAuthContext = (): AuthContext => {
	const state = useAuthStore.getState();
	const companyId =
		state.user?.activeCompanyId?.trim() || state.user?.companyId?.trim() || "";

	return {
		user: state.user,
		isAuthenticated: state.isAuthenticated,
		companyId,
	};
};

export const getTenantContext = (): TenantContext => {
	const { user, isAuthenticated, companyId } = getAuthContext();
	return {
		companyId,
		organizationId: user?.companyId ?? "",
		isAuthenticated,
		authUserId: user?.id ?? "anonymous",
		legacyUserId: user?.legacyUserId ?? user?.id ?? "anonymous",
		userRole: user?.role ?? "VIEWER",
	};
};

/**
 * Tenant Headers - Inyectados en el core de la plataforma para RLS (Row Level Security)
 */
export const getTenantHeaders = (): Record<string, string> => {
	const { companyId } = getAuthContext();
	if (!companyId) {
		return {};
	}

	return {
		"x-company-id": companyId,
		"x-active-company-id": companyId,
	};
};

/**
 * Governance & Audit Headers - Trazabilidad total de operaciones
 */
export const getGovernanceAuditHeaders = (): Record<string, string> => {
	const { user } = getAuthContext();
	return {
		...getTenantHeaders(),
		"x-auth-user-id": user?.id || "anonymous",
		"x-user-id": user?.legacyUserId || user?.id || "anonymous",
		"x-user-role": user?.role || "VIEWER",
	};
};

/**
 * Legacy Helpers - Mantener compatibilidad mientras se migra a AuthStore
 */
export const getCompanyId = (): string => getAuthContext().companyId;
export const getAuthUserId = (): string =>
	getAuthContext().user?.id || "anonymous";
export const getLegacyUserId = (): string =>
	getAuthContext().user?.legacyUserId ||
	getAuthContext().user?.id ||
	"anonymous";
export const getUserId = (): string => getLegacyUserId();
export const getUserRole = (): string =>
	getAuthContext().user?.role || "VIEWER";
export const getUserDisplayName = (): string =>
	getAuthContext().user?.name || "Usuario Operaciones";

export const getOrganizationId = (): string => {
	const organizationId = getAuthContext().user?.companyId;
	return organizationId || "";
};
