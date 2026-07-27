# Developer Platform Specification

## Purpose

Define the external developer platform that enables third-party developers, partners, and internal teams to integrate with Drenyra through a coherent, documented, and versioned API surface. This spec covers API key management, rate limiting, webhook delivery, SDK generation, developer portal, API playground, usage analytics, API versioning, and changelog infrastructure.

## Requirements

### Requirement: API Key Lifecycle Management

The system MUST provide a complete API key lifecycle for external developer authentication: generation, activation, rotation, revocation, and audit. Keys MUST be tenant-scoped to a specific company/RUC and MUST support the existing `PrincipalType` union (`"user" | "service" | "webhook"`). Keys MUST never be deleted — revocation MUST preserve the key record for audit.

#### Scenario: Developer generates first API key

- GIVEN a developer is authenticated on the developer portal and belongs to a company
- WHEN the developer creates a new API key with a label and selects the principal type `"service"`
- THEN the system generates a cryptographically random key (minimum 32 bytes, encoded as `dren_` prefix + base64), stores a hashed version, returns the full key exactly once, and the key is immediately active for the developer's company

#### Scenario: Developer rotates an API key

- GIVEN an active API key exists for a company
- WHEN the developer initiates rotation for that key
- THEN the system generates a new key, marks the old key as `rotated` with an expiration timestamp (72 hours grace period), returns the new key once, and the old key continues to work until the grace period expires

#### Scenario: Developer revokes an API key

- GIVEN an active API key exists
- WHEN the developer revokes it
- THEN the key is immediately marked `revoked`, all in-flight requests authenticated with that key receive HTTP 401 within 60 seconds, and the revocation is logged with the actor's identity and timestamp

#### Scenario: API key authenticates a request

- GIVEN a third-party service sends a request with the header `x-api-key: dren_<base64>` and `x-company-id: <company-id>`
- WHEN the API gateway processes the request
- THEN the system validates the key hash, verifies it is `active` and scoped to the given company, resolves the `PrincipalType`, injects `TenantContext` into the request store, and allows the request to proceed to the route handler

#### Scenario: Expired or revoked key is rejected

- GIVEN a request with an API key that has been revoked or whose rotation grace period has expired
- WHEN the API gateway processes the request
- THEN the system returns HTTP 401 with error code `API_KEY_REVOKED` or `API_KEY_EXPIRED`, logs the rejection with the key fingerprint and timestamp, and does not forward the request to the route handler

#### Scenario: API key without company scoping is rejected

- GIVEN a request with a valid API key but no `x-company-id` header, and the key is not scoped to a single default company
- WHEN the API gateway processes the request
- THEN the system returns HTTP 400 with error code `COMPANY_SCOPE_REQUIRED` and a message indicating the `x-company-id` header is mandatory

### Requirement: Unified Rate Limiting

The system MUST consolidate all existing rate limiting implementations into a single tiered system with Redis-backed sliding windows. The system MUST support three tiers (`free`: 100 req/min, `pro`: 1000 req/min, `enterprise`: configurable limit) and MUST enforce limits per API key. Every external-facing endpoint MUST be covered by the rate limiter.

#### Scenario: Rate limit is enforced for free tier

- GIVEN a developer's API key is assigned to the `free` tier (100 req/min)
- WHEN the developer sends 101 requests within a 60-second sliding window
- THEN the system returns HTTP 429 on the 101st request with `X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: <unix-timestamp>`, a `Retry-After` header, and the response body contains error code `RATE_LIMIT_EXCEEDED`

#### Scenario: Rate limit headers are present on every response

- GIVEN any authenticated external request
- WHEN the request completes (whether successful or not, excluding 429 responses which have different semantics)
- THEN the response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers reflecting the current window state

#### Scenario: Enterprise tier has custom limits

- GIVEN a company is on the `enterprise` tier with a configured limit of 5000 req/min
- WHEN a request is made with that company's API key
- THEN the rate limiter reads the configured limit from the company's tier record and enforces 5000 req/min instead of the default

#### Scenario: Internal traffic is excluded from rate limiting

- GIVEN a request arrives with the `x-internal: true` header or from an internal service IP range
- WHEN the rate limiter middleware evaluates the request
- THEN the request bypasses the external rate limiter entirely and is not counted against any tier

#### Scenario: Rate limit state survives API server restart

- GIVEN rate limit counters are stored in Redis
- WHEN the API server restarts
- THEN the counters are immediately available from Redis and no window-reset advantage is gained by senders

### Requirement: Webhook Delivery Infrastructure

The system MUST provide a reliable webhook delivery engine that dispatches events to registered webhook endpoints. The engine MUST use an outbox pattern with job-queue delivery, exponential-backoff retry (up to 7 attempts), HMAC-SHA256 signature generation, and delivery logging visible to the developer.

#### Scenario: Event triggers webhook delivery

- GIVEN a company has a registered webhook for the event type `invoice.created` with a URL `https://partner.example.com/hooks/drenyra`
- WHEN an invoice is created for that company
- THEN the system writes a delivery job to the outbox, the job is picked up by the delivery worker, an HTTP POST is sent to the webhook URL with a JSON payload containing the event type, event ID, timestamp, and resource data, and the request includes `X-Drenyra-Signature: t=<unix>,v1=<hmac-sha256>` header

#### Scenario: Webhook delivery retries on failure

- GIVEN a webhook delivery fails with HTTP 500
- WHEN the failure is recorded
- THEN the system schedules a retry with exponential backoff (1min, 5min, 15min, 1h, 6h, 24h), up to a maximum of 7 attempts, after which the delivery is marked `failed` and moved to the dead letter queue

#### Scenario: Webhook delivery succeeds and is logged

- GIVEN a webhook delivery succeeds with HTTP 200
- WHEN the response is received
- THEN the system records the delivery attempt with status `delivered`, response status code, latency in milliseconds, and timestamp visible in the developer's webhook dashboard

#### Scenario: Developer verifies webhook signature

- GIVEN a developer receives a webhook POST with `X-Drenyra-Signature` header
- WHEN the developer computes HMAC-SHA256 of `t.payload` using their webhook secret
- THEN the computed signature matches `v1` in the header, proving authenticity and integrity

#### Scenario: Webhook dashboard shows delivery history

- GIVEN a developer is authenticated on the developer portal
- WHEN the developer navigates to the webhook dashboard for a registered webhook
- THEN the system displays a list of delivery attempts with event type, timestamp, status (delivered/failed/pending), response code, and latency, and allows filtering by date range and status

#### Scenario: Dead letter queue enables manual replay

- GIVEN a webhook delivery has permanently failed (7 attempts exhausted)
- WHEN the developer views the dead letter queue in the dashboard
- THEN the system shows the failed delivery with the event payload and last error, and provides a "Replay" button that resubmits the delivery with a fresh attempt counter

### Requirement: Webhook Registration Management

The system MUST extend the existing webhook registration CRUD in `api-marketplace` to support the developer portal and MUST include per-webhook secret generation, event type selection from the events catalog, and endpoint verification.

#### Scenario: Developer registers a webhook from the portal

- GIVEN a developer is authenticated on the developer portal
- WHEN the developer registers a webhook with a URL, a human-readable label, and selects event types `["invoice.created", "invoice.updated"]`
- THEN the system creates the webhook registration, generates a unique webhook secret (returned once), stores the hashed secret, and sends a verification ping to the endpoint

#### Scenario: Webhook verification ping

- GIVEN a newly registered webhook
- WHEN the verification ping is sent to the webhook URL
- THEN the system sends a POST with event type `webhook.verification`, a challenge token in the payload, and expects the endpoint to respond with HTTP 200 and the challenge token echoed back within 10 seconds

#### Scenario: Developer deletes a webhook registration

- GIVEN a registered webhook exists
- WHEN the developer deletes it from the portal
- THEN the system marks the webhook as `inactive`, cancels all pending deliveries for that webhook, and returns confirmation

### Requirement: SDK Generation Pipeline

The system MUST provide a CI pipeline that generates a typed TypeScript SDK from the API contracts. The SDK MUST be tree-shakeable with per-domain modules, published as `@drenyra/api-client` on npm, and MUST regenerate automatically when contracts change.

#### Scenario: SDK is generated from OpenAPI spec

- GIVEN the API contracts are expressed as TypeBox/Elysia schemas
- WHEN the SDK generation pipeline runs
- THEN the system generates an OpenAPI 3.1 spec from the contracts, runs codegen to produce a TypeScript client with per-domain modules (`invoices`, `banking`, `ledger`, etc.), and packages it as `@drenyra/api-client`

#### Scenario: SDK regenerates on contract changes

- GIVEN a PR changes an API contract (adds a field to an invoice response schema)
- WHEN the CI pipeline runs
- THEN the SDK generation job detects the contract change, regenerates the SDK, runs the SDK test suite, and fails the PR if SDK compilation breaks

#### Scenario: Developer installs and uses the SDK

- GIVEN a third-party developer's project
- WHEN the developer runs `npm install @drenyra/api-client`
- THEN the SDK is installed with zero required runtime dependencies beyond `fetch`, provides typed methods like `client.invoices.list({ companyId })`, and tree-shaking eliminates unused domain modules from the final bundle

#### Scenario: SDK handles API key authentication

- GIVEN a developer initializes the SDK with `new DrenyraClient({ apiKey: 'dren_...', companyId: '...' })`
- WHEN the SDK makes any API call
- THEN it automatically includes `x-api-key` and `x-company-id` headers on every request

### Requirement: Developer Portal Foundation

The system MUST provide a public-facing developer portal as a separate Next.js application under `apps/dev-portal/`. The portal MUST include a home page, getting-started guide, API reference rendered from the live OpenAPI spec, SDK documentation, webhooks guide, and automated changelog. Developer accounts MUST be separate from main Drenyra user accounts.

#### Scenario: Developer discovers the portal and creates an account

- GIVEN a third-party developer visits `developers.drenyra.com`
- WHEN the developer clicks "Get Started" and creates an account with email and password
- THEN the system creates a developer account (separate from main app users), sends a verification email, and upon verification redirects to the portal dashboard showing the "Create your first API key" call-to-action

#### Scenario: API reference renders live OpenAPI spec

- GIVEN the developer portal is deployed
- WHEN a developer navigates to the API Reference page
- THEN the system fetches the live OpenAPI 3.1 spec from the API server, renders it as interactive documentation with endpoint groups, parameter tables, request/response schemas, and example values, and groups endpoints by domain (invoices, banking, ledger, etc.)

#### Scenario: Getting-started guide walks through first integration

- GIVEN a developer is reading the getting-started guide
- WHEN the developer follows the guide
- THEN the guide covers: account creation, API key generation, making a first API call with curl, installing the SDK, making the same call with the SDK, and subscribing to a webhook — all with copy-pasteable code snippets in curl, TypeScript, and the API playground widget

#### Scenario: Changelog reflects API changes

- GIVEN a new API version or contract change is deployed
- WHEN the developer visits the Changelog page
- THEN the system displays entries grouped by version with date, change type (added/modified/deprecated/removed), affected endpoints, and links to migration guides for breaking changes

### Requirement: API Playground

The system MUST provide an interactive API playground embedded in the developer portal. The playground MUST allow a developer to select any public endpoint, fill in parameters and body, execute the request with their own API key, and inspect the response with syntax highlighting.

#### Scenario: Developer tests an endpoint in the playground

- GIVEN a developer is on the API Reference page looking at `GET /api/v1/invoices`
- WHEN the developer clicks "Try it" and the playground opens with the endpoint pre-selected
- THEN the playground shows the method (GET), URL path, query parameter fields, and the developer's API key auto-filled, and clicking "Send" executes the request and displays the response with status code, headers, and JSON body with syntax highlighting

#### Scenario: Playground generates code snippets

- GIVEN a developer has configured and executed a request in the playground
- WHEN the developer clicks the "Code" tab
- THEN the playground shows equivalent code snippets in curl, TypeScript (SDK), Go, and Python that reproduce the exact request with the same parameters

#### Scenario: Playground handles authentication errors gracefully

- GIVEN a developer has not yet created an API key
- WHEN the developer opens the playground
- THEN the playground shows a banner "You need an API key to test endpoints" with a link to the API Keys page

### Requirement: Usage Analytics for API Consumers

The system MUST collect per-API-key usage metrics and display them in a consumer-facing dashboard. Metrics MUST include request volume, error rates (4xx and 5xx), latency percentiles (p50, p95, p99), and quota consumption percentage.

#### Scenario: Usage dashboard shows request volume

- GIVEN a developer is authenticated on the portal and has an active API key
- WHEN the developer views the Usage Dashboard
- THEN the system displays a time-series chart of request count per hour for the selected date range (last 24h default, 7d and 30d available), with the ability to filter by endpoint domain

#### Scenario: Error rate is tracked separately

- GIVEN a developer's API key has made requests, some of which returned 4xx or 5xx
- WHEN the developer views the error rate panel
- THEN the system shows the percentage of 4xx errors and 5xx errors separately, with a breakdown by endpoint and error code

#### Scenario: Latency percentiles are displayed

- GIVEN request latency data exists for a developer's API key
- WHEN the developer views the latency panel
- THEN the system displays p50, p95, and p99 latency in milliseconds for the selected time range, computed from the middleware-collected timing metrics

#### Scenario: Quota consumption is visible

- GIVEN a developer is on the `free` tier (100 req/min)
- WHEN the developer views the quota panel
- THEN the system shows a gauge with current usage as a percentage of the tier limit, peak requests in the current window, and a warning indicator when usage exceeds 80%

#### Scenario: Analytics data retention respects tier

- GIVEN usage data is being collected
- WHEN the retention period is applied
- THEN `free` tier data is retained for 90 days, `pro` tier for 365 days, and `enterprise` tier according to the configured retention policy

### Requirement: API Versioning Strategy

The system MUST enforce URL-path versioning (`/api/v{N}/`) for all external-facing endpoints. Breaking changes MUST require a new major version. The system MUST send `Sunset` and `Deprecation` headers for deprecated versions and MUST provide a minimum 6-month deprecation notice before sunset.

#### Scenario: New major version is introduced

- GIVEN the current API version is `v1`
- WHEN a breaking change is required (e.g., removing a field from a response)
- THEN the system introduces `v2` endpoints at `/api/v2/`, keeps `v1` operational, adds `Deprecation: true` and `Sunset: <date-6-months-out>` headers to all `v1` responses, and publishes a migration guide in the developer portal

#### Scenario: Non-breaking additions stay in the current version

- GIVEN the current API version is `v1`
- WHEN a new optional field is added to an endpoint response
- THEN the system adds it to the `v1` endpoint without incrementing the version, updates the OpenAPI spec, and the change appears in the changelog as `added` rather than `modified`

#### Scenario: Deprecated version reaches sunset

- GIVEN a deprecated API version's `Sunset` date has passed
- WHEN a request is made to the deprecated version
- THEN the system returns HTTP 410 Gone with a body containing the sunset date, a link to the migration guide, and the new version endpoint URL

#### Scenario: Version is absent from URL path

- GIVEN an external-facing endpoint at `/api/invoices` without a version prefix
- WHEN the versioning strategy is enforced
- THEN the system redirects HTTP 308 to `/api/v1/invoices` with the same method and body, or returns HTTP 400 with error code `API_VERSION_REQUIRED` if the unversioned path is not a recognized legacy alias

### Requirement: API Key Scoping and Permissions

The system MUST scope API keys to a specific company/RUC and MUST support optional endpoint-level permission restrictions. In the initial release, keys grant access to all endpoints for their scoped company. The system MUST be designed to support per-domain scoping (e.g., `invoices` only) as a fast-follow.

#### Scenario: API key is scoped to a single company

- GIVEN an API key is bound to company `C001`
- WHEN a request is made with `x-company-id: C002`
- THEN the system returns HTTP 403 with error code `COMPANY_MISMATCH` — the key cannot access resources outside its scoped company

#### Scenario: API key with per-domain restriction (fast-follow)

- GIVEN a future API key is scoped to company `C001` with allowed domains `["invoices", "customers"]`
- WHEN a request is made to `/api/v1/banking/accounts` with that key
- THEN the system returns HTTP 403 with error code `DOMAIN_NOT_ALLOWED` and lists the allowed domains for that key

### Requirement: External-Facing API Envelope

The system MUST use a consistent external-facing response envelope that differs from the internal envelope. The external envelope MUST include a request ID for tracing and MUST use the standardized public error codes.

#### Scenario: Successful response uses external envelope

- GIVEN an external request authenticated with an API key
- WHEN the request succeeds
- THEN the response body follows the structure `{ "data": <resource>, "meta": { "requestId": "<uuid>", "timestamp": "<iso8601>" } }` with HTTP status reflecting the operation result

#### Scenario: Error response uses external envelope

- GIVEN an external request that results in an error
- WHEN the error is returned
- THEN the response body follows the structure `{ "error": { "code": "INVOICE_NOT_FOUND", "message": "The requested invoice does not exist", "requestId": "<uuid>" } }` and internal stack traces or database details are never exposed

### Requirement: Webhook Events Catalog

The system MUST define and publish a catalog of available webhook event types. The initial catalog MUST include `invoice.created`, `invoice.updated`, `invoice.status_changed`, `siro.status_changed`, `connection.activated`, and `connection.error`.

#### Scenario: Events catalog is published in the developer portal

- GIVEN the developer portal is live
- WHEN a developer navigates to the Webhooks Guide
- THEN the system displays the full events catalog with event type name, description, payload schema, and an example payload for each event type

#### Scenario: New event type is added to the catalog

- GIVEN a new domain event needs to be exposed as a webhook
- WHEN the event type is registered in the system
- THEN it appears in the events catalog, becomes selectable in webhook registration, and the changelog records the addition

### Requirement: Developer Portal Authentication

The system MUST provide authentication for developer portal users that is separate from the main Drenyra application authentication. The system MUST support email/password registration with email verification.

#### Scenario: Developer registers with email and password

- GIVEN a developer visits the portal registration page
- WHEN the developer submits email and password meeting minimum requirements (8+ chars, not in breach database)
- THEN the system creates an unverified developer account, sends a verification email with a time-limited token (24h), and does not allow API key creation until the email is verified

#### Scenario: Developer logs in to the portal

- GIVEN a developer has a verified account
- WHEN the developer logs in with correct credentials
- THEN the system establishes a portal session (separate cookie domain from the main app), redirects to the portal dashboard, and displays the developer's API keys, webhooks, and usage summary

### Requirement: Rate Limiter Consolidation

The system MUST replace the three existing rate limiting implementations (`middleware/rate-limit.ts`, `middleware/rate-limit.middleware.ts`, `shared/plugins/rate-limiter.ts`) with a single unified plugin. The consolidated plugin MUST support both external (per-API-key, tiered) and internal (per-session or per-IP) rate limiting through configuration.

#### Scenario: Existing surfaces adopt the unified rate limiter

- GIVEN the unified rate limiter is deployed
- WHEN the 16 surfaces currently marked `rateLimit: "missing"` are configured
- THEN each surface has rate limiting active with appropriate limits, the deprecated implementations are removed, and no existing endpoint changes its rate limiting behavior for internal traffic

#### Scenario: Deprecated implementations are removed

- GIVEN the unified rate limiter is active on all surfaces
- WHEN the migration is complete
- THEN `middleware/rate-limit.ts`, `middleware/rate-limit.middleware.ts`, and `shared/plugins/rate-limiter.ts` are deleted and all imports are updated to the unified plugin
