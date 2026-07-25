# Identity Federation / SSO — Proposal

## Status
`proposed`

## Intent

Enable Drenyra users to sign in using external identity providers (Google, GitHub) as a first slice, laying the foundation for enterprise SSO (SAML/OIDC) in future iterations. This eliminates the friction of manual email/password signup for firm admins and accelerates onboarding.

---

## 1. Business Problem

Drenyra currently only supports email/password authentication. This creates measurable friction for the primary target audience:

- **Firm admins using Google Workspace or Microsoft 365** must create yet another set of credentials. This is a cognitive burden, a support friction point (password resets, "what email did I use?"), and a security concern (credential reuse).
- **Enterprise prospects** evaluating Drenyra expect SAML or OIDC federation as a baseline procurement requirement. Without it, Drenyra is disqualified from many mid-market and enterprise RFPs.
- **Operational cost**: every password-reset cycle, locked-account escalation, and "I signed up with the wrong email" support ticket has a direct human cost in a small team.

Adding OAuth-based login removes the password barrier for Google/GitHub users immediately and signals to the market that Drenyra has an identity federation roadmap.

## 2. Target Users & Situations

| Persona | Situation | Urgency |
|--------|-----------|---------|
| Firm admin (Google Workspace) | Onboarding a new firm; wants to start immediately without creating a separate Drenyra account | High — onboarding drop-off risk |
| Firm admin (GitHub) | Tech-forward accountant evaluating Drenyra; prefers GitHub as identity provider | Medium — smaller population but high signal |
| Enterprise IT decision-maker | Evaluating Drenyra for their firm; asks "do you support SSO?" in the first sales call | Medium — pipeline blocker, not immediate conversion |
| Existing email/password user | Wants to link a Google account for convenience or switch to SSO-only login | Low — post-MVP, but the linking model must be correct from day one |

## 3. Product Outcome

**"Done" for Slice 1**: a firm admin can visit the Drenyra login page, click "Continue with Google" (or "Continue with GitHub"), authorize, and be logged into their existing company-scoped session — regardless of whether they signed up before or are a brand-new user.

Specifically:
- New users authenticate via Google/GitHub and land in their company context (matched by email domain or explicit invite).
- Existing email/password users can link a Google/GitHub account and use either method thereafter.
- The session produced by OAuth login is functionally identical to an email/password session (same company enrichment, same tenant isolation, same audit log).
- The configuration is cleanly separated so adding Microsoft, SAML, or OIDC later is additive, not a rewrite.

## 4. Scope

### Slice 1 (this change) — Google OAuth + GitHub OAuth

- **Google OAuth**: `better-auth` built-in `socialProviders.google` with env-var configuration.
- **GitHub OAuth**: `better-auth` built-in `socialProviders.github` with env-var configuration.
- **Account linking**: users can link/unlink providers from their profile.
- **Email matching**: if a provider email matches an existing verified user, the accounts are linked automatically.
- **Provider config scoped to server**: no per-tenant provider configuration in slice 1; all tenants use the same Drenyra OAuth apps.

**Out of scope (future slices)**:
- Microsoft 365 / Entra ID OAuth
- SAML 2.0 federation
- OIDC federation
- SCIM provisioning
- Per-tenant OAuth app configuration (multi-tenant IdP apps)
- Just-in-time company provisioning from IdP group claims
- Admin-enforced provider restrictions (e.g., "this firm only allows Google auth")

## 5. Business Rules

### 5.1 Email Uniqueness & Provider Linking

1. The canonical identity in Drenyra is the **verified email address**, not the provider.
2. If `providerEmail === existingVerifiedUser.email` → the provider account is linked to the existing user automatically. No manual linking step needed.
3. If `providerEmail` does not match any verified user → a new Drenyra user is created with `emailVerified: true` (the provider already verified the email).
4. A user may have multiple provider accounts linked (e.g., Google + GitHub) pointing to the same Drenyra user.

### 5.2 Is-Primary Flag

5. The first account created for a user (credential or provider) is marked `isPrimary: true`.
6. When a user links a new provider, it is NOT automatically promoted to primary.
7. A user cannot unlink their primary account unless another account exists to become primary.

### 5.3 Email/Pasword Users Without Verified Email

8. If a provider email matches an **unverified** email/password user, the provider login succeeds and the email is marked verified (the provider verified it). This is an explicit trust delegation to the OAuth provider.

### 5.4 Company Membership

9. OAuth sign-in does NOT bypass company membership resolution. The session enrichment pipeline (`enrichSessionUserWithCompanyContext`) runs identically.
10. A new OAuth user without RUC or company membership follows the same bootstrap path: if their email domain matches a known firm, they can be invited; otherwise they land without an active company until an admin adds them.

### 5.5 Tenant Isolation

11. Provider configuration is global (server-level) in slice 1. Tenant isolation is preserved at the session and data-access layer, not at the authentication layer.
12. The `tenantMiddleware` and `company-scope-guard` remain unchanged; OAuth sessions carry the same tenant headers.

## 6. Affected Areas

| Area | Impact | Risk |
|------|--------|------|
| `apps/api/src/features/auth/auth.config.ts` | Add `socialProviders` block for Google and GitHub | Medium — auth config is the single point of entry for all login flows |
| `apps/api/src/features/auth/handlers/session-company-context.ts` | No code changes expected; verify OAuth user shape compatibility | Low |
| `apps/api/src/features/auth/handlers/company-membership.ts` | No code changes expected; RUC bootstrap may not trigger for OAuth users (they have no RUC field) | Medium — OAuth users without RUC need a company invitation flow |
| `apps/api/src/features/auth/dev/bootstrap-demo-admin.ts` | No changes; dev bootstrap is credential-only | Low |
| `packages/persistence/src/schema/auth.schema.ts` | No DDL changes; `authAccounts` already supports OAuth tokens | Low |
| Frontend login page | Add "Continue with Google" / "Continue with GitHub" buttons | Low — Better Auth provides redirect URLs |
| Environment configuration | New env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Low |
| Session handling | Better Auth handles OAuth session creation natively; custom session plugin enriches identically | Low |
| CI/CD | OAuth redirect URIs must be configured in cloud console; dev/test callbacks differ from production | Medium — needs documentation |

## 7. Edge Cases

| Edge Case | Resolution |
|-----------|------------|
| **Email collision**: OAuth email matches an existing credential user | Auto-link accounts; user logs in with either method |
| **Email collision — unverified**: OAuth email matches an unverified credential user | Auto-link + auto-verify email (trust delegation to provider) |
| **Provider unlinking**: user removes Google from their profile | Delete `authAccounts` row; if it was primary, promote the next available account |
| **Last account unlinking**: user tries to remove their only linked account | Reject with error "Cannot unlink your only sign-in method" |
| **Multiple providers, same email**: user links both Google and GitHub | Both `authAccounts` rows share the same `userId`; login via either yields identical session |
| **Provider email change**: user changes their Google email | Next OAuth login creates a new account for the new email; old `authAccounts` row becomes orphaned (can be cleaned up) |
| **OAuth without company**: new user signs in via Google, no matching company | User lands with empty `availableCompanies`; see "first-access experience" (product decision — out of scope for auth slice) |
| **Token expiry**: OAuth refresh token expires | Better Auth handles refresh; if refresh fails, user is prompted to re-authenticate |
| **Production vs localhost callbacks**: OAuth redirect URI mismatch | Env-var-driven; `BETTER_AUTH_URL` already configures the base URL |
| **Rate-limiting**: distributed login guard | The existing `failedLoginAttempts` / `lockedUntil` mechanism on `authUsers` is credential-only; OAuth attempts are rate-limited by the provider, not by Drenyra |

## 8. Delivery Constraints

- **Review budget**: 400 changed lines (excluding generated files, migrations, and test fixtures).
- **Strict TDD**: all new behavior must have tests written before implementation.
- **Better Auth native**: leverage Better Auth's built-in social provider support; do not build custom OAuth flows.
- **No DDL migrations**: the `authAccounts` table already supports OAuth; no schema changes required.
- **Backward compatibility**: existing email/password users are unaffected; all existing tests must pass.

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OAuth callback URL configuration error in production | Medium | High — login broken for all OAuth users | Environment-var validation at startup; integration test for callback health |
| Better Auth social provider API changes between versions | Low | Medium — build failure on upgrade | Pin Better Auth version; social providers are stable since 1.x |
| Email matching false-positive (different person, same email at different provider) | Low | High — security: account takeover | Auto-linking requires email to already be verified in Drenyra before OAuth login |
| OAuth user without RUC breaks company bootstrap | Medium | Medium — user lands without company context | Graceful handling: `enrichSessionUserWithCompanyContext` already tolerates missing RUC; the `ensureUserCompanyMembershipFromRuc` path simply returns null when RUC is absent |
| Frontend redirect flow breaks existing login UX | Low | Low | OAuth login is additive (new buttons); existing email/password form is untouched |

## 10. Success Criteria

1. **Functional**: A user can sign up and log in using Google OAuth end-to-end.
2. **Functional**: A user can sign up and log in using GitHub OAuth end-to-end.
3. **Linking**: An existing email/password user can link a Google account and log in with either method.
4. **Session parity**: OAuth sessions carry the same company context, tenant isolation, and audit trails as credential sessions.
5. **Tests**: All acceptance criteria have passing automated tests (integration tests for OAuth flows, unit tests for linking logic).
6. **Existing tests**: All existing auth tests (credential login, session enrichment, tenant middleware) continue to pass.
7. **Line budget**: Changed lines ≤ 400 (excluding tests, fixtures, and generated files).

## 11. Rollback

- OAuth providers are configured via environment variables. Removing `GOOGLE_CLIENT_ID` and `GITHUB_CLIENT_ID` from the environment disables OAuth login without code changes.
- No database migrations are introduced; `authAccounts` rows created by OAuth are backward-compatible with credential-only mode.
- The `socialProviders` configuration block can be commented out in `auth.config.ts` as a hard-disable if needed.
