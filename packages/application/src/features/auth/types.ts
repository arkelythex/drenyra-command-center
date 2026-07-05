/**
 * Auth — DTO types for frontend consumption.
 *
 * @module @drenyra/application/auth
 */

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: UserDTO;
}

export interface RegisterRequest {
	email: string;
	password: string;
	name: string;
}

export interface UserDTO {
	id: string;
	email: string;
	name: string;
	role: string;
	isActive: boolean;
	createdAt: string;
}

export interface SessionDTO {
	id: string;
	userId: string;
	token: string;
	expiresAt: string;
	createdAt: string;
	ip?: string;
	userAgent?: string;
}

export interface AuthError {
	code: "INVALID_CREDENTIALS" | "SESSION_EXPIRED" | "UNAUTHORIZED" | "FORBIDDEN";
	message: string;
}
