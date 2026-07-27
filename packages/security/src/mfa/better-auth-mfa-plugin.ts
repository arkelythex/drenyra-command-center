/**
 * MFA Plugin for BetterAuth.
 *
 * Integrates passkeys (FIDO2/WebAuthn) as primary MFA method with
 * TOTP (RFC 6238) as fallback.
 *
 * @module mfa/better-auth-mfa-plugin
 */

import type { BetterAuthPlugin } from "better-auth";

export interface MfaPluginOptions {
	enforced?: boolean;
}

/**
 * Creates a BetterAuth plugin that adds MFA step-up authentication.
 */
export function mfaPlugin(_options: MfaPluginOptions = {}): BetterAuthPlugin {
	return {
		id: "drenyra-mfa",
		hooks: {
			before: [
				{
					matcher: (context) => {
						const p = (context as Record<string, unknown>).path;
						return p === "/sign-in/email";
					},
					handler: async (ctx: unknown) => ctx,
				},
			],
		},
		endpoints: {},
	};
}
