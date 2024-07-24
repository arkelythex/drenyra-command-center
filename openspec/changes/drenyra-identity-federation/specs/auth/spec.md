# Auth Specification — Identity Federation (Slice 1)

## Purpose

Enable Drenyra users to authenticate via external OAuth 2.0 identity providers (Google, GitHub) using Better Auth v1.6.16 native `socialProviders` API. This spec defines the functional requirements, data contracts, error handling, and test expectations for the first identity federation slice.

---

## Requirements

### Requirement: OAuth Provider Configuration

The system MUST support Google and GitHub as OAuth 2.0 identity providers via Better Auth's built-in `socialProviders` API, driven entirely by environment variables with no per-tenant configuration in Slice 1.

#### Scenario: Google OAuth provider is configured from environment

- GIVEN the environment variables `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- WHEN the auth server starts
- THEN `auth.config.ts` SHALL include `socialProviders.google` with `clientId` and `clientSecret` bound to those environment variables
- AND the provider MUST authenticate users against Google's OAuth 2.0 endpoint

#### Scenario: GitHub OAuth provider is configured from environment

- GIVEN the environment variables `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
- WHEN the auth server starts
- THEN `auth.config.ts` SHALL include `socialProviders.github` with `clientId` and `clientSecret` bound to those environment variables
- AND the provider MUST authenticate users against GitHub's OAuth 2.0 endpoint

#### Scenario: OAuth is silently disabled when provider env vars are absent

- GIVEN `GOOGLE_CLIENT_ID` is not set
- WHEN the auth server starts
- THEN the Google social provider SHALL NOT be registered
- AND email/password authentication MUST continue to function normally
- AND no error SHALL be thrown at startup

#### Scenario: OAuth redirect URI is derived from BETTER_AUTH_URL

- GIVEN `BETTER_AUTH_URL` is set to `https://app.drenyrafounders.com`
- WHEN the auth server constructs OAuth callback URLs
- THEN the callback URL SHALL be `{BETTER_AUTH_URL}/api/auth/callback/{providerId}`
- AND the same base URL SHALL be used for all configured providers

---

### Requirement: OAuth Login Flow

The system MUST expose sign-in endpoints that redirect users to the configured OAuth providers and handle the callback to create or link accounts and establish a session.

#### Scenario: New user signs in with Google for the first time

- GIVEN a user with email `admin@firmaperuana.pe` does not exist in Drenyra
- WHEN the user clicks "Continue with Google" and completes the Google OAuth consent flow
- THEN a new `authUsers` row SHALL be created with `emailVerified: true` and `email: "admin@firmaperuana.pe"`
- AND an `authAccounts` row SHALL be created with `providerId: "google"`, `isPrimary: true`
- AND a valid session SHALL be established

#### Scenario: Existing email/password user signs in with Google (verified email match)

- GIVEN a verified Drenyra user exists with email `admin@firmaperuana.pe`
- WHEN that same user completes Google OAuth login with the same email address
- THEN the existing `authUsers` row SHALL NOT be duplicated
- AND an `authAccounts` row SHALL be linked to the existing user with `providerId: "google"`
- AND `isPrimary` on the new `authAccounts` row SHALL be `false` (existing credential account remains primary)
- AND a valid session SHALL be established for the existing user

#### Scenario: Existing unverified email/password user signs in with matching OAuth email

- GIVEN an unverified Drenyra user exists with email `admin@firmaperuana.pe` and `emailVerified: false`
- WHEN that user completes Google OAuth login with the same email address
- THEN the existing user's `emailVerified` SHALL be set to `true` (trust delegation to the OAuth provider)
- AND an `authAccounts` row SHALL be linked to the existing user

#### Scenario: User signs in with GitHub after already having a Google-linked account

- GIVEN a Drenyra user already has a linked Google `authAccounts` row
- WHEN the same user completes GitHub OAuth login with the same email address
- THEN a second `authAccounts` row SHALL be created with `providerId: "github"` and `isPrimary: false`
- AND both `authAccounts` rows SHALL reference the same `userId`

---

### Requirement: Account Linking and Unlinking

The system MUST allow users to link additional OAuth providers to their existing account and unlink providers while preserving at least one sign-in method.

#### Scenario: User links a new OAuth provider from their profile

- GIVEN an authenticated user with an existing credential account (primary)
- WHEN the user initiates a provider link flow for GitHub
- THEN a new `authAccounts` row SHALL be created with `providerId: "github"` and `isPrimary: false`
- AND the existing primary account's `isPrimary` SHALL remain `true`

#### Scenario: User unlinks a non-primary provider account

- GIVEN a user has a credential account (primary) and a linked Google account
- WHEN the user unlinks the Google account
- THEN the Google `authAccounts` row SHALL be deleted
- AND the credential account SHALL remain as primary

#### Scenario: User attempts to unlink their only sign-in method

- GIVEN a user has exactly one `authAccounts` row (their only sign-in method)
- WHEN the user attempts to unlink that account
- THEN the operation SHALL be rejected
- AND an error message SHALL state "Cannot unlink your only sign-in method"

#### Scenario: User unlinks the primary account when another account exists

- GIVEN a user has a primary Google account and a secondary credential account
- WHEN the user unlinks the Google (primary) account
- THEN the Google `authAccounts` row SHALL be deleted
- AND the next available account (credential) SHALL be promoted to `isPrimary: true`

---

### Requirement: Session Parity

The system MUST ensure OAuth-derived sessions are functionally identical to credential-derived sessions, carrying the same company context, tenant isolation, and audit trails.

#### Scenario: OAuth session carries company context

- GIVEN a user has company memberships via `authUserCompanies`
- WHEN the user authenticates via Google OAuth
- THEN the session object SHALL include `activeCompanyId`, `companyId`, `companyName`, and `availableCompanies`
- AND the enrichment SHALL be performed by the same `enrichSessionUserWithCompanyContext` pipeline used for credential sessions

#### Scenario: OAuth user without RUC or company membership lands gracefully

- GIVEN a new OAuth user has no RUC field and no company memberships
- WHEN the session is enriched via `enrichSessionUserWithCompanyContext`
- THEN `availableCompanies` SHALL be an empty array
- AND `activeCompanyId` SHALL be undefined
- AND no error SHALL be thrown
- AND the user's session SHALL still be valid

#### Scenario: Tenant isolation is preserved for OAuth sessions

- GIVEN an OAuth-authenticated user belongs to company A
- WHEN the user makes an API request scoped to company B (where they are not a member)
- THEN the `company-scope-guard` middleware SHALL reject the request
- AND the rejection behavior SHALL be identical to credential-authenticated sessions

#### Scenario: OAuth login creates an audit log entry

- GIVEN a user authenticates via Google OAuth
- WHEN the session is created
- THEN an `authAuditLogs` row SHALL be created with `action: "login_oauth"`
- AND the entry SHALL include `providerId` in the `details` JSONB column

---

### Requirement: Backward Compatibility

The system MUST NOT alter the behavior of existing email/password authentication flows. All existing credential-based tests must continue to pass without modification.

#### Scenario: Email/password login is unaffected by OAuth configuration

- GIVEN OAuth providers are configured in `auth.config.ts`
- WHEN an existing user logs in with email and password via `POST /api/auth/login`
- THEN the login SHALL succeed with the same response shape as before OAuth was added
- AND `GET /api/auth/session` SHALL return the same session shape

#### Scenario: Email/password signup is unaffected by OAuth configuration

- GIVEN OAuth providers are configured in `auth.config.ts`
- WHEN a new user signs up with email, password, name, and RUC via `POST /api/auth/signup`
- THEN the signup SHALL succeed with the same response shape as before OAuth was added

---

### Requirement: Environment Variable Validation

The system SHOULD validate OAuth-related environment variables at startup to prevent misconfiguration in production.

#### Scenario: Missing client secret with present client ID produces a clear warning

- GIVEN `GOOGLE_CLIENT_ID` is set but `GOOGLE_CLIENT_SECRET` is empty
- WHEN the auth server starts
- THEN a warning SHALL be logged indicating the incomplete Google OAuth configuration
- AND the Google provider SHALL NOT be registered
- AND the server SHALL still start successfully

#### Scenario: All OAuth env vars are properly configured

- GIVEN both `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` are set
- WHEN the auth server starts
- THEN no warnings SHALL be emitted for OAuth configuration
- AND both providers SHALL be registered

---

## Data Contracts

### Environment Variables

| Variable | Required | Format | Example |
|----------|----------|--------|---------|
| `GOOGLE_CLIENT_ID` | No (provider disabled if missing) | OAuth 2.0 client ID string | `123456789-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No (but required if `GOOGLE_CLIENT_ID` is set) | OAuth 2.0 client secret string | `GOCSPX-xxxx` |
| `GITHUB_CLIENT_ID` | No (provider disabled if missing) | OAuth App client ID string | `Iv1.xxxx` |
| `GITHUB_CLIENT_SECRET` | No (but required if `GITHUB_CLIENT_ID` is set) | OAuth App client secret string | `xxxx` |

All OAuth variables MUST be treated as secrets and MUST NOT be logged, exposed in error messages, or committed to version control.

### SocialProviders Configuration Shape

```typescript
// Const object first, then extract type (TypeScript strict pattern)
const SOCIAL_PROVIDER_IDS = {
  GOOGLE: "google",
  GITHUB: "github",
} as const;

type SocialProviderId = (typeof SOCIAL_PROVIDER_IDS)[keyof typeof SOCIAL_PROVIDER_IDS];

interface SocialProviderEnv {
  clientId: string;
  clientSecret: string;
}

interface SocialProvidersConfig {
  google?: { clientId: string; clientSecret: string };
  github?: { clientId: string; clientSecret: string };
}
```

### Callback URL Contract

```
GET /api/auth/callback/:providerId?code={authorization_code}&state={csrf_state}
```

Better Auth handles the callback internally. The route MUST be served by the existing `ALL /api/auth/*` catch-all handler in `auth.routes.ts`. No new Elysia route definitions are required for OAuth callbacks.

### Session Shape (post-enrichment, unchanged)

The session object after OAuth login MUST match the existing credential session shape:

```typescript
{
  session: { id, userId, expiresAt, token, ... },
  user: {
    id, email, name, emailVerified, image?,
    ruc?,                    // undefined for OAuth-only users
    activeCompanyId?,        // set by session enrichment
    companyId?,              // alias for activeCompanyId
    companyName?,            // set by session enrichment
    availableCompanies?,     // AccessibleCompany[]
  }
}
```

---

## Error Scenarios

### ES-01: OAuth provider returns an error

- GIVEN the user denies consent on the Google OAuth screen
- WHEN Google redirects back with `error=access_denied`
- THEN Better Auth SHALL NOT create a user or session
- AND the user SHALL be redirected to the login page
- AND a user-visible error SHALL NOT expose OAuth configuration details

### ES-02: OAuth callback with invalid or expired state parameter

- GIVEN an attacker replays a stale OAuth callback URL with an expired `state` parameter
- WHEN the callback is processed
- THEN Better Auth SHALL reject the request
- AND no session SHALL be created

### ES-03: OAuth token refresh failure

- GIVEN an authenticated OAuth session whose provider refresh token has expired or been revoked
- WHEN Better Auth attempts to refresh the access token
- AND the refresh fails
- THEN the user SHALL be prompted to re-authenticate
- AND the session SHALL NOT be silently invalidated

### ES-04: Database constraint violation on email collision race condition

- GIVEN two concurrent OAuth sign-in attempts with the same new email address
- WHEN both attempts try to create a new `authUsers` row
- THEN the database unique constraint on `email` SHALL cause one to fail
- AND the failing flow SHALL gracefully fall back to linking the existing user
- AND no 500 error SHALL leak to the client

### ES-05: Provider email is not verified by the OAuth provider

- GIVEN an OAuth provider response where the email is not marked as verified
- WHEN the callback is processed
- THEN Drenyra SHALL NOT trust the email for auto-linking
- AND a new user SHALL be created only if no verified user with that email exists
- AND `emailVerified` SHALL be set based on the provider's email verification claim

### ES-06: OAuth callback with malformed or missing authorization code

- GIVEN the OAuth callback URL is hit without a valid `code` query parameter
- WHEN the callback is processed
- THEN Better Auth SHALL reject the request
- AND the response SHALL NOT expose internal stack traces

---

## Out of Scope (Explicit Non-Goals for Slice 1)

This slice explicitly does NOT cover:

1. **Microsoft 365 / Entra ID OAuth**: Not in scope. Google and GitHub only.
2. **SAML 2.0 federation**: Future slice.
3. **OIDC federation**: Future slice.
4. **SCIM provisioning**: Future slice.
5. **Per-tenant OAuth app configuration**: All tenants share the same Drenyra OAuth apps in Slice 1.
6. **Just-in-time company provisioning from IdP group claims**: OAuth users without company membership land with an empty company context.
7. **Admin-enforced provider restrictions**: Firms cannot restrict which providers their members use in Slice 1.
8. **Frontend login page changes**: The login page UI (buttons, redirect flow) is a frontend concern gated by its own spec and is not part of this auth-domain spec.
9. **OAuth rate-limiting at Drenyra level**: Rate-limiting for OAuth attempts is delegated to the provider; the existing `failedLoginAttempts` / `lockedUntil` mechanism on `authUsers` is credential-only and is not extended in this slice.

---

## Test Requirements

### TR-01: Provider configuration unit tests

Tests SHALL exist in `apps/api/src/features/auth/__tests__/` verifying:
- `socialProviders` block is constructed correctly when env vars are present.
- `socialProviders` block omits a provider when its `CLIENT_ID` is missing.
- Provider is omitted when `CLIENT_ID` is set but `CLIENT_SECRET` is missing (with warning).
- `BETTER_AUTH_URL` correctly derives callback URLs.

### TR-02: OAuth callback handling integration tests

Integration tests SHALL verify:
- Successful Google OAuth callback creates user + account + session.
- Successful GitHub OAuth callback creates user + account + session.
- Existing verified user email match triggers auto-link (no duplicate user).
- Existing unverified user email match triggers auto-link + auto-verify.
- Users with both Google and GitHub linked share the same `userId`.
- OAuth session enrichment produces `availableCompanies` and `activeCompanyId`.

### TR-03: Account linking/unlinking unit tests

Unit tests SHALL verify:
- Linking a new provider creates `authAccounts` row with `isPrimary: false`.
- Unlinking a non-primary account succeeds and primary remains unchanged.
- Unlinking the only account is rejected.
- Unlinking the primary account promotes the next available account.

### TR-04: Backward compatibility regression tests

All existing auth tests (`demo-admin-bootstrap.integration.test.ts` and any credential-login tests) MUST pass without modification after OAuth changes are applied.

### TR-05: Environment variable validation tests

Unit tests SHALL verify:
- Missing `GOOGLE_CLIENT_ID` produces no error and provider is omitted.
- `GOOGLE_CLIENT_ID` without `GOOGLE_CLIENT_SECRET` produces a warning and provider is omitted.
- All four variables present registers both providers cleanly.
