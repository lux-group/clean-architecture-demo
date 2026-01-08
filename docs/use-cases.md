# Application Use Cases (CQRS)

This document is generated from the application’s use-case functions under `src/application/use-cases/**`.

- **Commands**: state-changing use cases
- **Queries**: read-only use cases

Common cross-cutting rules you’ll see repeatedly:
- **Domain validation**: entities validate props with Zod (e.g. UUID formats, string lengths).
- **Audit/eventing**: most state changes publish an `EntityChangeEvent`, and auth/token flows publish `AuthenticationEvent` / `AuthorizationEvent` / `SessionEvent`.

## Admin / User

- **Create user** (`createUser`)
  - **Description**: Creates a new local user account with a password.
  - **Business logic / rules**:
    - Password is **hashed** before storage (no plaintext persistence).
    - New users are created with `emailVerified = false`.
    - Defaults `isEnabled` to `true` if not provided.
    - User attributes are validated (selected highlights):
      - `email` must be a valid email, max 255 chars.
      - `brand` 1–50 chars; `givenName`/`surname` 1–50 chars.
      - `roles[]` entries 1–50 chars.
      - `passwordHash` may be nullable at the domain level, but this use case sets it to a non-null hash.

- **Update user** (`updateUser`)
  - **Description**: Updates mutable user attributes (e.g. names, roles, enabled flag).
  - **Business logic / rules**:
    - Only properties allowed by `UpdateUserProps` are mutable (notably excludes `brand`, `email`, `emailVerified`, `phone`, `passwordHash`, `identities`).
    - Domain validation is re-applied after merge (Zod schema validation).

- **Delete user** (`deleteUser`)
  - **Description**: Deletes a user by ID.

- **Get user by id** (`getUserById`)
  - **Description**: Fetches a user record by ID.

- **Search users** (`searchUsers`)
  - **Description**: Searches/paginates users via repository query abstraction.

## Admin / Session

- **Terminate session (admin)** (`terminateSession`)
  - **Description**: Terminates a session as an admin action.
  - **Business logic / rules**:
    - Session termination rules:
      - If session is not `ACTIVE`, termination is effectively a no-op (returns the session unchanged).
      - Termination clears `refreshToken`.
      - If the session is already past `expiresAt`, it is marked `EXPIRED` and `terminatedAt = expiresAt`.
      - Otherwise it is marked `TERMINATED_BY_ADMIN` and `terminatedAt = now`.

- **Get session by id** (`getSessionById`)
  - **Description**: Fetches a session record by ID.

- **Search sessions** (`searchSessions`)
  - **Description**: Searches/paginates sessions via repository query abstraction.

## Admin / Identity Provider

- **Create identity provider** (`createIdentityProvider`)
  - **Description**: Creates a new identity provider configuration.
  - **Business logic / rules**:
    - Identity provider attributes are validated (selected highlights):
      - `name` 5–50 chars; `issuerUrl` must be a URL.
      - `audience` 10–100 chars; `identifierClaimName` 3–20 chars.
      - `authSettings` may be null; if present:
        - `type` in {ENTRA, GOOGLE, APPLE, FACEBOOK}
        - `redirectUrls` is 1–20 URLs
        - `sessionLifetimeHours` is 1–8760

- **Update identity provider** (`updateIdentityProvider`)
  - **Description**: Updates an existing identity provider configuration.
  - **Business logic / rules**:
    - Domain validation is re-applied after update.

- **Delete identity provider** (`deleteIdentityProvider`)
  - **Description**: Deletes an identity provider by ID.

- **Get identity provider by id** (`getIdentityProviderById`)
  - **Description**: Fetches an identity provider record by ID.

- **Search identity providers** (`searchIdentityProviders`)
  - **Description**: Searches/paginates identity providers via repository query abstraction.

## Admin / Signing Key

- **Create new signing key (rotate)** (`createNewSigningKey`)
  - **Description**: Generates a new signing keypair and rotates out the currently active key (if any).
  - **Business logic / rules**:
    - A new keypair is generated and stored as a new `SigningKey` (public + private).
    - If a current active signing key exists, it is **deactivated**:
      - Deactivation sets `privateKey = null` (making the key inactive for signing, but still usable for validation).
    - Domain validation enforces key string size limits (public/private key max 10000 chars).

- **Delete signing key** (`deleteSigningKey`)
  - **Description**: Deletes a signing key by ID.
  - **Business logic / rules**:
    - A signing key **cannot be deleted while active** (i.e. while `privateKey != null`).

- **Get signing key by id** (`getSigningKeyById`)
  - **Description**: Fetches a signing key record by ID.

- **Search signing keys** (`searchSigningKeys`)
  - **Description**: Searches/paginates signing keys via repository query abstraction.

## Public / Auth (Local)

- **Sign in with password** (`signInWithPassword`)
  - **Description**: Authenticates a user with brand/email/password and creates a local session.
  - **Business logic / rules**:
    - Authentication checks (password flow):
      - User must exist (by `brand` + `email`).
      - User must be enabled (`isEnabled = true`).
      - User must **not** be a service account (`roles` must not include `"service"`).
      - User must **not** have external identities linked (`identities.length === 0`).
      - Password hash must exist and verify successfully; otherwise authentication fails.
    - On success:
      - Creates a local session (`identityProviderId = null`) with configured lifetime.
      - Publishes a success auth event and a “session created” event.
    - On `AuthenticationError`:
      - Publishes the failure event derived from the error and rethrows.

- **Sign out (local session)** (`signOut`)
  - **Description**: Terminates an active local session.
  - **Business logic / rules**:
    - If session does not exist or is not active, this use case is a **no-op**.
    - Session must be a **local** session (no `identityProviderId`).
    - Requires a matching `nonce` (mismatch indicates potential session hijacking).
    - On `AuthenticationError`:
      - Publishes the failure event derived from the error and rethrows.

## Public / Auth (External)

- **Create sign-in request** (`createSignInRequest`)
  - **Description**: Builds an external IdP authorization URL and state for OIDC sign-in.
  - **Business logic / rules**:
    - Identity provider must exist (lookup by `identityProviderName`).
    - `redirectUrl` must be allowed by IdP configuration:
      - Requires IdP `authSettings` to exist.
      - `redirectUrl` must start with one of the configured `redirectUrls`.

- **Process sign-in response** (`processSignInResponse`)
  - **Description**: Processes the IdP callback, resolves/creates/links a user, and creates an external session.
  - **Business logic / rules**:
    - Uses the IdP from `state.identityProviderId` and processes the response URL via the IdP client.
    - User resolution and provisioning:
      - First attempts to find user by external identity (IdP id + identifier claim value).
      - If not found and `autoLinkUsers` is enabled:
        - Attempts to find an existing user by brand/email and **link** the external identity.
        - Linking enforces: no duplicate identity for the same IdP.
        - Linking clears any local password (`passwordHash` set to null).
      - If still not found and `autoCreateUsers` is enabled:
        - Creates a new enabled user with `emailVerified = true`, no password, and then links identity.
      - If supported by client and an access token is present, edits the IdP profile to remove unnecessary PII.
    - Authentication checks (identity-provider flow):
      - User must exist, be enabled, and not be a service account.
      - User must have a linked identity matching (IdP, identifier claim value).
    - On success:
      - Creates an external session (stores `identityProviderId`, optional provider session id, `idToken`, optional `refreshToken`).
      - Uses the IdP’s configured `sessionLifetimeHours`.
    - On `AuthenticationError`:
      - Publishes the failure event derived from the error and rethrows.

- **Create sign-out request** (`createSignOutRequest`)
  - **Description**: Terminates an external session and (if supported) returns an IdP sign-out URL.
  - **Business logic / rules**:
    - If session does not exist or is not active, returns `{ url: redirectUrl }` (no-op).
    - Session must be an **identity-provider session** (`identityProviderId` present).
    - `redirectUrl` must be allowed by IdP configuration (same redirect URL rule as sign-in).
    - Terminates the session as the user:
      - Publishes “session terminated by user”.
    - If the IdP client does not support sign-out, returns `{ url: redirectUrl }`.

- **Front-channel sign-out** (`frontChannelSignOut`)
  - **Description**: Terminates an external session when the IdP notifies the app (front-channel logout).
  - **Business logic / rules**:
    - Finds session by identity-provider session id (`sid`).
    - If session does not exist or is not active, this use case is a **no-op**.
    - Terminates session as “by identity provider”.
    - On `AuthenticationError`:
      - Publishes the failure event derived from the error and rethrows.

## Public / Token

- **Issue token with active session** (`issueTokenWithActiveSession`)
  - **Description**: Validates an active session (optionally refreshes against IdP), supports impersonation, and issues an access token.
  - **Business logic / rules**:
    - Session validation:
      - Session must exist and be active.
      - Requires matching `nonce` (anti-hijacking).
    - Session refresh behavior (for IdP sessions):
      - Applies a configured minimum refresh delay to avoid excessive IdP calls.
      - If refresh is due and IdP + refresh token exist:
        - Checks session validity with IdP using refresh token.
        - If valid, updates `lastRefreshAt` and may rotate `idToken`/`refreshToken`.
        - If invalid, terminates the session as “by identity provider”.
      - If refresh is not due, still updates `lastRefreshAt`.
      - Updates emit session refresh/termination events.
    - Authentication checks (active-session flow):
      - User must exist, be enabled, and not be a service account.
      - Session must be active and belong to the user.
    - Optional impersonation:
      - Only users with role `"employee"` may impersonate.
      - Cannot impersonate self.
      - Service accounts cannot impersonate, and cannot be impersonated.
      - Target user must have **no roles** (only role-less users can be impersonated).
    - Token issuance:
      - Custom claims include `brand` and `roles`.
      - Token request includes `sessionId` and `impersonatedByUserId` when applicable.
    - On `AuthenticationError` or `AuthorizationError`:
      - Publishes the failure event derived from the error and rethrows.

- **Issue token with client credentials** (`issueTokenWithClientCredentials`)
  - **Description**: Authenticates a service account with (clientId, clientSecret) and issues an access token.
  - **Business logic / rules**:
    - Authentication checks (client credentials flow):
      - User must exist by `clientId`.
      - User must be enabled.
      - User must be a **service account** (must include `"service"` role).
      - User must not have external identities linked.
      - Secret must verify against stored hash.
    - Token issuance uses custom claims `brand` and `roles`.
    - On `AuthenticationError` or `AuthorizationError`:
      - Publishes the failure event derived from the error and rethrows.

- **Issue token with token exchange** (`issueTokenWithTokenExchange`)
  - **Description**: Validates an external token, maps it to a service account identity, and issues a local access token.
  - **Business logic / rules**:
    - External token must decode and validate successfully (via `TokenValidator`).
    - Authentication checks (token exchange flow):
      - User must exist by external identity (IdP id + identifier claim value).
      - User must be enabled.
      - User must be a **service account**.
      - User must have a linked identity matching (IdP, identifier claim value).
    - Token issuance uses custom claims `brand` and `roles`.
    - On `AuthenticationError` or `AuthorizationError`:
      - Publishes the failure event derived from the error and rethrows.

## Public / Profile

- **Get profile by id** (`getProfileById`)
  - **Description**: Fetches a user profile (currently returns the full `User` domain entity) by ID.

## Public / Well-known

- **Get OpenID configuration** (`getOpenidConfiguration`)
  - **Description**: Returns OIDC discovery metadata for this issuer.
  - **Business logic / rules**:
    - Issuer is built from `baseUrl + tokenIssuerConfig.path`.
    - Advertises fixed endpoints (`jwks_uri`, `token_endpoint`) and supported signing alg (`RS256`).
    - Returns a fixed list of supported claims.

- **Get JSON Web Keys (JWKS)** (`getJsonWebKeys`)
  - **Description**: Returns the current set of public signing keys for token validation.
  - **Business logic / rules**:
    - Returns up to 10 most recent signing keys (ordered by `createdAt desc`).
    - Exposes **public keys only** as JWKs (import SPKI → export JWK).
    - Key metadata:
      - `kid` is derived from the signing key UUID (short form).
      - `alg = RS256`, `use = sig`.


