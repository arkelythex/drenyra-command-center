/**
 * @drenyra/security — Core security primitives.
 *
 * Packages all security concerns into a single dependency-free module:
 * - RBAC: role hierarchy, permission namespaces, guard functions
 * - MFA: TOTP (RFC 6238), recovery codes, passkey config
 * - Secrets: provider abstraction, env-var implementation, validation
 */

export * from "./rbac";
export * from "./mfa";
