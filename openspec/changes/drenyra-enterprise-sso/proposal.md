# Enterprise SSO — Proposal (Slice 2)

## Status

`proposed`

## Intent

Extend Drenyra's identity federation with enterprise-grade SAML 2.0 and OIDC SSO support, allowing organizations to use their corporate identity provider (Okta, Microsoft Entra ID, Google Workspace, Any SAML 2.0 IdP) for authentication. This is Slice 2 of the Identity Federation roadmap, building on the Google + GitHub OAuth foundation (Slice 1).

## 1. Business Problem

Slice 1 (Google + GitHub OAuth) covers individual developer and small-firm use cases. Enterprise firms — the primary Drenyra market — require:

- **SAML 2.0 support**: Mandatory for firms using Okta, Azure AD, or any standards-compliant IdP. Without SAML, Drenyra is disqualified from mid-market procurement.
- **OIDC support**: Required for Google Workspace and Microsoft Entra ID enterprise tenants where the firm controls the IdP configuration.
- **Just-in-Time (JIT) provisioning**: When a user logs in via corporate SSO, their Drenyra account and company membership should be created automatically — no separate invitation flow.
- **Per-tenant IdP configuration**: Each firm must configure their own IdP (their Okta tenant, their Entra ID), not use a shared Drenyra-managed app.

## 2. Target Users & Situations

| Persona                          | Situation                                                                      | Urgency                         |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------- |
| IT admin at a mid-market firm    | Configuring Okta or Entra ID as the corporate identity provider for Drenyra    | High — procurement blocker      |
| Accountant at an enterprise firm | Logging into Drenyra via corporate SSO (Okta dashboard, Entra ID app launcher) | High — daily workflow           |
| Firm owner                       | Onboarding their entire team without sending individual invitations            | Medium — operational efficiency |
| Drenyra sales engineering        | Responding to "Do you support SAML?" in enterprise RFPs                        | High — pipeline conversion      |

## 3. Product Outcome

**When Slice 2 is done**:

1. A firm admin can configure their corporate IdP (SAML 2.0 or OIDC) from Drenyra organization settings by providing the IdP metadata URL or uploading metadata XML.
2. Employees can log in via their corporate IdP — either SP-initiated (from Drenyra login page, click "Log in with company SSO") or IdP-initiated (from Okta dashboard, Azure AD app gallery).
3. First-time SSO users get JIT provisioned: Drenyra account created, company membership assigned, role mapped from SAML attributes.
4. IdP certificate rotation is handled gracefully — metadata refresh before cert expiry; dual-cert support during rotation window.

## 4. Scope

### In scope (Slice 2)

- SAML 2.0 SP-initiated SSO (redirect binding, POST binding)
- SAML 2.0 IdP-initiated SSO (IdP sends unsolicited response)
- OIDC provider support (Google Workspace, Microsoft Entra ID)
- Per-organization IdP configuration storage (in OrganizationSettings JSONB or new idp_configs table)
- JIT provisioning: auto-create user + membership on first SSO login
- Role mapping: configurable SAML attribute → MembershipRole mapping per org
- Domain enforcement: restrict SSO to specific email domains per org
- Certificate rotation support: accept both old and new cert during transition

### Out of scope (Slice 2)

- SCIM directory sync (user provisioning/deprovisioning) — Slice 3
- Automated deprovisioning on IdP account removal — Slice 3
- Multiple simultaneous IdPs per organization — follow-up
- IdP-initiated logout (SLO) — follow-up

## 5. Business Rules

### 5.1 Domain Enforcement

1. Each org registers one or more email domains for SSO (e.g., `acme.com`, `acme.pe`)
2. Only users with emails matching configured domains are allowed to SSO into that org
3. If a domain is not registered, the SSO login is rejected with "No organization found for your domain"
4. Domain matching is case-insensitive

### 5.2 JIT Provisioning

5. First SSO login: creates `authUsers` row with email from SAML assertion, `emailVerified: true`
6. Creates `authUserCompanies` membership with role determined by role mapping
7. If user email already exists (was invited or signed up via email/password): links SSO provider to existing account
8. JIT-created users have no RUC field — they inherit company context from the IdP mapping

### 5.3 Role Mapping

9. Each org defines a mapping: SAML attribute value → Drenyra `MembershipRole`
10. Default mapping if none configured: ACCOUNTANT
11. Example: `{ "groups": { "admin": "OWNER", "accountant": "ACCOUNTANT", "viewer": "VIEWER" } }`
12. If SAML attribute is missing or value doesn't match: default role is assigned + audit warning

### 5.4 Certificate Management

13. IdP certificate is obtained from the metadata XML (uploaded or fetched from metadata URL)
14. During rotation: accept both old and new cert simultaneously for a configurable overlap period (default 7 days)
15. Cert validation: verify signature, check NotBefore/NotOnOrAfter, validate against fingerprint

### 5.5 Tenant Isolation

16. IdP configuration is per-organization, stored in organization-scoped settings
17. SSO callback URL includes organization identifier to route to correct IdP config
18. After authentication, the standard session enrichment and tenant-scoping chain applies

## 6. Affected Areas

| Area                                            | Impact                                                         | Risk   |
| ----------------------------------------------- | -------------------------------------------------------------- | ------ |
| `packages/domain/src/settings/`                 | New IdpConfig type for org-level IdP configuration             | Low    |
| `apps/api/src/features/auth/auth.config.ts`     | New SAML plugin registration                                   | Medium |
| `apps/api/src/features/auth/handlers/`          | New SSO callback handler for SAML/OIDC                         | Medium |
| `apps/api/src/features/organization-lifecycle/` | Settings endpoint needs IdP config CRUD                        | Low    |
| `packages/persistence/src/schema/`              | Optional `idp_configs` table (if not stored in settings JSONB) | Low    |
| Frontend login page                             | "Log in with company SSO" button + org identifier input        | Low    |
| Environment configuration                       | New env vars for SAML cert/decryption keys                     | Low    |

## 7. Architecture Decision

Better Auth v1.6.16 has NO built-in SAML or generic OIDC support. The `socialProviders` API only supports specific OAuth 2.0 providers (Google, GitHub, etc.).

**Decision**: Build a custom SAML/OIDC plugin for Drenyra wrapping `samlify` (SAML 2.0) or `openid-client` (OIDC). The plugin:

- Registers custom callback routes (e.g., `/api/auth/saml/:orgId/callback`)
- Handles SAML assertion validation, attribute extraction
- Creates/links user accounts (JIT provisioning)
- Issues a Drenyra session cookie (reuses Better Auth session format)

This is similar to how Better Auth's `customSession` plugin works — it's an additive plugin, not a modification of Better Auth internals.

## 8. Delivery Plan (Chained PRs)

| PR   | Scope                                                                                 | Est. Lines |
| ---- | ------------------------------------------------------------------------------------- | ---------- |
| PR 1 | SAML base: IdP config types, SAML plugin skeleton, SP-initiated flow, metadata import | ~350       |
| PR 2 | JIT provisioning + role mapping + domain enforcement                                  | ~250       |
| PR 3 | OIDC provider support (Google Workspace, Entra ID)                                    | ~200       |
| PR 4 | IdP-initiated SSO, callback routing, frontend "SSO login" button                      | ~200       |

## 9. Edge Cases

| Edge Case                                                            | Resolution                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Clock skew**: IdP and SP clocks differ                             | Allow configurable skew tolerance (default 5 minutes) per SAML spec      |
| **Cert rotation**: old cert expires during overlap                   | Accept both certs; log which one was used for verification               |
| **Replayed assertion**: attacker replays SAML response               | Enforce `NotOnOrAfter` + assertion ID uniqueness cache (5-minute window) |
| **Unsolicited response**: IdP-initiated without SP request           | Validate audience, recipient, destination; proceed if valid              |
| **Multiple orgs, same domain**: two firms claim the same domain      | Reject on setup; first org to register the domain owns it                |
| **Email already exists**: SSO email matches existing credential user | Link provider to existing account (same policy as Slice 1)               |
| **IdP metadata URL unreachable** during config                       | Allow manual XML upload as fallback                                      |
| **SAML logout**: user expects single logout                          | Explicitly out of scope for Slice 2; document as follow-up               |

## 10. Delivery Constraints

- Review budget: 400 lines per PR (chained PRs avoid overload)
- Strict TDD: all new behavior must have tests
- Backward compatible: existing email/password + OAuth users unaffected
- SAML library: `samlify` (battle-tested, TypeScript-native) or `node-saml` (Passport-based)
- OIDC library: `openid-client` (industry standard)

## 11. Risks & Mitigations

| Risk                                                       | Likelihood | Impact   | Mitigation                                                                   |
| ---------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------- |
| SAML protocol complexity (binding, encoding, signature)    | Medium     | Medium   | Use established library; integration test with real IdP (Okta dev account)   |
| JIT provisioning creates user with no RUC                  | High       | Medium   | SSO users inherit company via IdP domain mapping; RUC follow-up via settings |
| Multiple orgs with same email domain                       | Low        | High     | Domain-first-wins policy; admin override via support ticket                  |
| IdP metadata changes (cert renewal, endpoint change)       | Medium     | Low      | Cache metadata TTL-friendly; admin can re-upload on notification             |
| SAML plugin security (XML parsing, signature verification) | Low        | Critical | Use library defaults; add XML eXternal entity (XXE) protection               | `   |
