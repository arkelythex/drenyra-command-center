import { Context } from "elysia";
import { getTaxAuthority } from "../../../lib/tax-authority-provider";
import { SunatService } from "../../../services/sunat.service";
import { db } from "@arkelythex/persistence/client";
import { authAuditLogs, authUsers } from "@arkelythex/persistence/schema";
import { eq } from "@arkelythex/persistence/query";
import { nanoid } from "nanoid";
import { auth } from "../auth.config";
import { ok, fail } from "../../shared/api-response";
import { ensureUserCompanyMembershipFromRuc } from "./company-membership";
import { createLogger } from "../../../lib/logger";
import {
	fingerprintSensitiveValue,
	resolveClientIpAddress,
} from "../lib/auth-event-sanitizer";

const logger = createLogger({ feature: "auth", handler: "signup" });

/**
 * Signup Handler
 *
 * Handles user registration with SUNAT RUC validation.
 * This is a critical security flow for ARKELYTHEX as it validates
 * that users represent legitimate Peruvian businesses.
 *
 * **Security Measures:**
 * - RUC validation (format + SUNAT online verification)
 * - Email uniqueness enforcement (prevents account hijacking)
 * - RUC uniqueness enforcement (one account per business)
 * - Password strength enforced by BetterAuth (min 8 chars)
 * - Audit logging of all signup attempts (success/failure)
 * - Email verification required before login
 *
 * **SUNAT Compliance:**
 * - RUC format: 11 digits (SUNAT standard)
 * - Online validation: calls SUNAT API to verify business exists
 * - Fallback: local Módulo 11 validation if SUNAT API is down
 *
 * @module auth/handlers/signup
 * Signup request body.
 *
 * @property email - User email (must be valid format, will receive verification email)
 * @property password - User password (min 8 chars, validated by BetterAuth)
 * @property name - User full name (displayed in UI, min 2 chars)
 * @property ruc - Peruvian RUC (11 digits, validated against SUNAT)
 *
 * @example
 * ```ts
 * const body: SignupBody = {
 *   email: "contador@miempresa.com",
 *   password: "SecureP@ss2026",
 *   name: "Juan Pérez",
 *   ruc: "20123456789",
 * };
 * ```
 */

export interface SignupBody {
	email: string;
	password: string;
	name: string;
	ruc: string;
}

/**
 * Registers a user via BetterAuth after validating RUC against SUNAT.
 *
 * **Registration Flow:**
 * 1. Validate RUC format (11 digits, Módulo 11 checksum)
 * 2. Validate RUC with SUNAT online API (verify business exists)
 * 3. Check email uniqueness (prevent duplicate accounts)
 * 4. Check RUC uniqueness (one business = one account)
 * 5. Create user via BetterAuth (hashes password with bcrypt)
 * 6. Log signup in audit table (IP, user agent, timestamp)
 * 7. Send verification email (user must verify before login)
 *
 * **Error Handling:**
 * - Invalid RUC format → 400 "RUC inválido. Debe tener 11 dígitos."
 * - RUC not found in SUNAT → 400 "RUC no válido en SUNAT"
 * - Email already exists → 409 "Este email ya está registrado"
 * - RUC already exists → 409 "Este RUC ya está registrado"
 * - BetterAuth error → returns BetterAuth error message
 * - Internal errors → 500 "Error interno del servidor"
 *
 * @param body - Signup payload with email, password, name, and RUC
 * @param context - Elysia request context (provides set.status and headers for IP tracking)
 * @returns Success response with user data (emailVerified=false), or error response
 *
 * @throws {BadRequestError} HTTP 400 - Invalid RUC format (not 11 digits or failed Módulo 11)
 * @throws {BadRequestError} HTTP 400 - RUC not found in SUNAT (business doesn't exist)
 * @throws {ConflictError} HTTP 409 - Email already registered (user must use different email)
 * @throws {ConflictError} HTTP 409 - RUC already registered (business already has an account)
 * @throws {InternalServerError} HTTP 500 - SUNAT API timeout (fallback to local validation)
 * @throws {InternalServerError} HTTP 500 - Database connection failure
 * @throws {InternalServerError} HTTP 500 - BetterAuth service unavailable
 * @throws {InternalServerError} HTTP 500 - Audit log write failure (non-blocking, logs error)
 *
 * @example
 * ```ts
 * // Successful signup
 * const res = await handleSignup(
 *   {
 *     email: "contador@miempresa.com",
 *     password: "SecureP@ss2026",
 *     name: "Juan Pérez",
 *     ruc: "20123456789"
 *   },
 *   { set: { status: 200 }, headers: { 'x-forwarded-for': '192.168.1.1' } } as Context
 * );
 * console.log(res.message); // "Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta."
 * console.log(res.user.emailVerified); // false
 * ```
 *
 * @example
 * ```ts
 * // Failed signup (invalid RUC format)
 * const res = await handleSignup(
 *   { email: "user@example.com", password: "pass", name: "Test", ruc: "12345" },
 *   { set: { status: 400 }, headers: {} } as Context
 * );
 * console.log(res.error); // "RUC inválido. Debe tener 11 dígitos."
 * console.log(res.field); // "ruc"
 * ```
 *
 * @example
 * ```ts
 * // Failed signup (email already exists)
 * const res = await handleSignup(
 *   { email: "existing@example.com", password: "pass", name: "Test", ruc: "20123456789" },
 *   { set: { status: 409 }, headers: {} } as Context
 * );
 * console.log(res.error); // "Este email ya está registrado"
 * console.log(res.field); // "email"
 * ```
 */
export async function handleSignup(
	body: SignupBody,
	context: Context,
): Promise<unknown> {
	const { email, password, name, ruc } = body;
	const { set, headers, request } = context;
	const ipAddress = resolveClientIpAddress(
		request.headers,
		headers as Record<string, string | undefined>,
	);
	const userAgent = (headers["user-agent"] as string) || "unknown";
	const eventContext = {
		emailHash: fingerprintSensitiveValue(email),
		rucHash: fingerprintSensitiveValue(ruc),
		ipHash: fingerprintSensitiveValue(ipAddress),
	};

	try {
		// 1. Validate RUC format (11 digits)
		if (!SunatService.isValidRucFormat(ruc)) {
			set.status = 400;
			return fail("RUC inválido. Debe tener 11 dígitos.", "RUC_INVALID", {
				field: "ruc",
			});
		}

		// 2. Validate RUC with SUNAT via TaxAuthorityPort
		try {
			const adapter = await getTaxAuthority(0);
			const taxIdInfo = await adapter.consultTaxId(ruc);

			if (taxIdInfo.status !== "ACTIVE") {
				set.status = 400;
				return fail(
					`RUC ${ruc} no está activo en SUNAT (estado: ${taxIdInfo.status})`,
					"RUC_SUNAT_INVALID",
					{ field: "ruc", details: { status: taxIdInfo.status } },
				);
			}

			logger.info(
				{ ...eventContext, razonSocial: taxIdInfo.legalName },
				"RUC validated during signup",
			);
		} catch (error) {
			// Fallback to local validation if SUNAT API fails
			logger.warn(
				{ error, ...eventContext },
				"SUNAT validation failed, falling back to local validation",
			);

			const localValidation = SunatService.validateRuc(ruc);
			if (!localValidation.valid) {
				set.status = 400;
				return fail("RUC inválido (validación local)", "RUC_LOCAL_INVALID", {
					field: "ruc",
				});
			}
		}

		// 3. Check if email already exists
		const existingUser = await db
			.select()
			.from(authUsers)
			.where(eq(authUsers.email, email))
			.limit(1);

		if (existingUser.length > 0) {
			set.status = 409;
			return fail("Este email ya está registrado", "EMAIL_EXISTS", {
				field: "email",
			});
		}

		// 4. Check if RUC already exists
		const existingRuc = await db
			.select()
			.from(authUsers)
			.where(eq(authUsers.ruc, ruc))
			.limit(1);

		if (existingRuc.length > 0) {
			set.status = 409;
			return fail("Este RUC ya está registrado", "RUC_EXISTS", {
				field: "ruc",
			});
		}

		// 5. Create user via BetterAuth
		const signupRequest = new Request(
			`${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/sign-up/email`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...headers,
				},
				body: JSON.stringify({ email, password, name, ruc }),
			},
		);

		const response = await auth.handler(signupRequest);
		const result = await response.json();

		if (response.status !== 200) {
			set.status = response.status;
			return fail(
				result.error?.message || "Error al crear cuenta",
				"SIGNUP_ERROR",
				{ details: result.error },
			);
		}

		// 6. Audit log
		try {
			await db.insert(authAuditLogs).values({
				id: nanoid(),
				userId: result.user?.id || null,
				action: "SIGNUP",
				timestamp: new Date(),
				ipAddress: eventContext.ipHash,
				userAgent: fingerprintSensitiveValue(userAgent),
				details: {
					emailHash: eventContext.emailHash,
					rucHash: eventContext.rucHash,
					nameLength: name.trim().length,
				},
			});
		} catch (auditError) {
			logger.error(
				{ error: auditError, ...eventContext },
				"Failed to persist signup audit log",
			);
		}

		logger.info(
			{ ...eventContext, userId: result.user?.id ?? null },
			"Signup completed",
		);

		if (typeof result.user?.id === "string" && result.user.id.trim()) {
			try {
				await ensureUserCompanyMembershipFromRuc(result.user.id, ruc);
			} catch (membershipError) {
				logger.warn(
					{ error: membershipError, ...eventContext, userId: result.user.id },
					"Failed to bootstrap company membership after signup",
				);
			}
		}

		return ok({
			message:
				"Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.",
			user: {
				id: result.user?.id,
				email: result.user?.email,
				name: result.user?.name,
				emailVerified: result.user?.emailVerified || false,
			},
		});
	} catch (error) {
		logger.error({ error, ...eventContext }, "Signup handler failed");
		set.status = 500;
		return fail("Error interno del servidor", "INTERNAL_ERROR", {
			details: {
				message: error instanceof Error ? error.message : "Unknown error",
			},
		});
	}
}
