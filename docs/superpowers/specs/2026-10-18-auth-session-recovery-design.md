# Auth Session and Recovery Integration Design

## Purpose

Implement Frontend Integration Guide #4 for the NSP Issuer Portal. The result must give Trade Testers and Center Superintendents a complete production auth lifecycle: rotating refresh tokens, server-revoked logout, backup-code generation and recovery, and backend-driven account-lockout feedback. The work must preserve the portal's existing dark green, cream, muted gold, compact form, card, and modal design language.

Guide #4 is a delta. Existing Guide #2 and Guide #3 assessment, approval, upload, and offline behavior remains unchanged.

## Scope

The implementation includes:

- Silent access-token refresh for protected API calls, with refresh-token rotation and a single in-flight refresh shared by concurrent failures.
- Server-side session revocation before client-side logout cleanup.
- Storage of both access and refresh tokens after MFA and backup-code login.
- A dedicated IP-03 backup-code login screen linked from IP-02.
- Backup-code status and one-time generation in Settings.
- Copy and text-download actions for newly generated codes, with acknowledgement required before dismissal.
- Lockout messaging driven by backend `401` responses on IP-01 and IP-03.
- Global `429` cooldown messaging through the existing API error surface.
- Automated coverage for the security-sensitive flows.

The implementation does not include backup-code regeneration, session management for other devices, ledger/minting behavior, the public verifier API, or Super Admin management integrations.

## Existing-State Corrections

The repository already contains partial Guide #4 work. This design replaces or corrects the following behavior:

- `MFAScreen` currently drops the refresh token returned by `/api/auth/verify-mfa`.
- Backup-code login currently appears as a modal inside IP-02 rather than a dedicated IP-03 screen.
- `LoginScreen` currently simulates lockout using a local attempt counter and permits an offline demo-account fallback. Production authentication and lockout state must instead come from the backend.
- `SettingsScreen` currently creates mock codes locally and offers regeneration. Codes must only come from the generation endpoint and can be displayed only in the immediate success flow.
- The current refresh implementation needs explicit retry guards, typed contracts, and deterministic failure cleanup.
- Logout currently starts asynchronously without giving the UI a stable pending state.

## Architecture

### Auth contracts and API client

`src/services/api.ts` remains the single HTTP boundary. It will define explicit response types for MFA, refresh, backup-code verification, generation, status, and revocation. `expiresIn` is a number, matching the backend contract.

Protected requests attach the current access token. When a non-auth endpoint returns `401`, the client performs at most one refresh attempt for that request. A module-level refresh promise ensures concurrent `401` responses await the same refresh operation. The refresh call itself bypasses refresh interception so it cannot recurse.

On refresh success, both returned tokens are written to `authStore` before queued requests resume. Each failed request retries once with the new access token. On missing refresh token, invalid refresh response, or refresh failure, the client clears the local session, rejects all waiting requests, and allows the existing auth-expired callback to navigate to IP-01.

Authentication endpoints never trigger silent refresh. A `401` from login, MFA, refresh, revoke, backup-code generation/status, or backup-code verification is surfaced directly. A `403` remains an authorization failure and must not trigger refresh.

### Session store

`src/services/authStore.ts` remains the source of truth for the active browser session. Successful MFA and backup-code verification call `setSession(user, accessToken, refreshToken)`. Refresh calls `setTokens(newAccessToken, newRefreshToken)` atomically.

The current `sessionStorage` policy remains unchanged. The `remember me` control is outside this integration and will not move credentials or refresh tokens to persistent local storage.

Logout captures the active refresh token, attempts `POST /api/auth/revoke` using the active access token, and always clears browser session state in a `finally` path. Revocation failure must not trap the user in the portal. The logout button is disabled while the request is pending so duplicate revocation requests are not created.

### Screen state and credential handling

`App.tsx` adds `backup-code` to the issuer auth screens and keeps the existing lightweight screen-state architecture. After successful password login, the app retains the normalized email and the submitted password only in transient React state until MFA or backup-code authentication completes. It does not write the password to `sessionStorage`, `localStorage`, URL parameters, logs, or the API store.

IP-02 receives a callback that navigates to IP-03. IP-03 receives the email and transient password, permits entry of one backup code, and submits the exact `{ email, password, backupCode }` contract. Returning to IP-01 clears the transient password. Successful MFA or backup-code authentication also clears it before entering the dashboard.

A full page reload during MFA or IP-03 intentionally loses the transient password and returns the user to IP-01. This is preferable to persisting a password.

## User Experience

### IP-01: Login and account lockout

IP-01 continues to validate required email, email shape, and password locally. It no longer counts failures or authenticates demo accounts when the API fails.

An ordinary `401` displays the backend message as the inline invalid-credentials error. If the case-insensitive backend message contains `account locked`, IP-01 displays a prominent lock-icon alert using the existing destructive palette. The alert explains that access is temporarily suspended for 15 minutes and repeats the backend message. The UI does not invent a countdown because the API does not return a lock-expiry timestamp.

Network errors remain distinct from credential failures. `429` displays a cooldown warning without treating the account as locked.

### IP-02: Authenticator verification

IP-02 retains its six-digit input and existing styling. Successful verification requires `user`, `accessToken`, and `refreshToken`; incomplete success payloads are treated as an authentication error rather than creating a partial session.

The existing recovery link becomes `Lost your authenticator device? Use a backup code` and navigates to IP-03. The backup-code modal and its password field are removed from IP-02.

### IP-03: Backup-code recovery

IP-03 is a dedicated screen visually paired with IP-02: the same header, centered white security card, typography, borders, and green primary action. It displays the account email, masks the recovery code input by default with an optional reveal control, and explains that each code is single-use.

Submitting calls `/api/auth/verify-backup-code` with the transient login credentials and trimmed backup code. Empty code is rejected locally. While submitting, controls are disabled.

Error mapping:

- `Invalid or already-used backup code` prompts the user to try another unused code.
- Any message containing `account locked` displays the prominent 15-minute lockout alert.
- `429` displays the cooldown warning.
- Network failure reports connectivity trouble without implying the code was consumed.

The screen offers navigation back to IP-02 and back to IP-01. Returning to IP-02 preserves the transient password for the same login attempt; returning to IP-01 clears it.

### Settings: backup-code status and generation

Opening the Security tab requests `/api/auth/backup-codes/status`. A successful response displays exactly `N of T backup codes remaining`, with used-code context when useful. Loading and failure states are explicit; failure must not be rendered as zero remaining.

If `totalCodes` is zero or no codes exist, the primary action is `Generate Backup Codes`. If codes already exist, the page shows their remaining count and explains that existing codes cannot be displayed again. It does not offer view or regenerate actions.

Generation calls `/api/auth/backup-codes/generate` once per click. A successful response opens a modal containing the ten server-returned codes and the exact warning: `These codes will never be displayed again. Save them in a secure location.` The modal provides:

- `Copy All`, using the clipboard API with visible success or failure feedback.
- `Download as .txt`, using an in-browser text blob and a temporary object URL.
- The checkbox `I have safely saved these 10 recovery codes`.
- A close/done action disabled until the checkbox is selected.

Backdrop clicks and Escape must not bypass the acknowledgement requirement. After dismissal, the component discards the codes and refreshes status. It cannot reopen them.

A `409` response reports that backup codes already exist and refreshes status without replacing or fabricating codes. Network and rate-limit failures retain the generate action for a later retry.

## Error and Security Rules

- Never log, persist, or place the password, backup code, access token, or refresh token in a URL.
- Never generate recovery codes in the browser.
- Never retain generated codes after the acknowledged modal closes.
- Never retry an authentication endpoint through the refresh interceptor.
- Never reuse the old refresh token after rotation succeeds.
- Never issue more than one concurrent refresh request.
- Never block local logout cleanup on successful server revocation.
- Treat assessment status as an open enum; no minting assumptions are added.
- `403` continues to use the existing role-mismatch behavior.
- `429` uses a consistent cooldown message and does not trigger refresh.

## Components and Files

- `src/services/api.ts`: typed Guide #4 contracts, refresh coordination, retry guard, and endpoint methods.
- `src/services/authStore.ts`: atomic token updates, session validation, revocation-first logout with guaranteed cleanup.
- `src/App.tsx`: IP-03 screen state, transient credential handoff, and awaited logout flow.
- `src/screens/LoginScreen.tsx`: backend-driven lockout and removal of simulated authentication.
- `src/screens/MFAScreen.tsx`: capture both tokens and link to IP-03.
- `src/screens/BackupCodeScreen.tsx`: dedicated recovery login screen.
- `src/screens/SettingsScreen.tsx`: live status, one-time generation, guarded reveal modal, copy, and download.
- `src/components/Layout.tsx`: pending logout UI and duplicate-submit prevention.
- `src/index.css`: only shared focus/accessibility styles needed by the new screen; no visual redesign.
- Test configuration and colocated or `src/__tests__` test files: security-sensitive unit and component coverage.

## Testing Strategy

Add Vitest, jsdom, React Testing Library, and user-event because the project has no automated test runner. Tests use injected or stubbed `fetch`, browser storage, clipboard, and object-URL boundaries; they assert user-visible behavior and real store/client state rather than implementation-only call counts where avoidable.

Required coverage:

- MFA success stores access and refresh tokens.
- Backup-code success creates the same complete session.
- Concurrent protected-route `401` responses create one refresh request and both retry with the rotated access token.
- Rotation overwrites the stored refresh token before queued retries continue.
- Refresh `401`, missing refresh token, and malformed refresh success clear the session without loops.
- Auth endpoint `401` responses do not trigger refresh.
- Logout calls revoke with the active refresh token and clears state on both success and failure.
- IP-01 distinguishes invalid credentials, backend lockout, network failure, and rate limiting.
- IP-03 maps used-code, lockout, rate-limit, and network errors and never persists credentials.
- Settings displays the server status count, handles `409`, and never fabricates codes.
- Generated codes cannot be dismissed before acknowledgement, support copy/download, and are discarded after dismissal.

Verification after implementation runs the focused tests during each TDD cycle, then the complete test suite, TypeScript typecheck, production build, and formatter check. The auth screens and modal receive a final browser-level visual check at the desktop layout used by the existing portal and at a narrow viewport to ensure the new UI remains usable.

## Acceptance Criteria

The integration is complete when:

1. Every successful authentication path stores the access token and refresh token returned by the backend.
2. Parallel expired requests result in exactly one refresh call, use the rotated refresh token thereafter, and retry once.
3. Failed refresh reliably returns the user to IP-01 with all local session data removed.
4. Logout attempts backend revocation and always finishes local logout.
5. IP-03 is reachable from IP-02 and creates a complete authenticated session on success.
6. IP-01 and IP-03 show backend-driven lockout treatment without client-side attempt simulation.
7. Settings shows the live remaining-code count and supports only server-backed initial generation.
8. Newly generated codes are shown once, can be copied or downloaded, and cannot be dismissed until acknowledged.
9. Existing issuer portal styling and existing assessment, approval, upload, and offline workflows remain intact.
10. Automated tests, typecheck, and production build pass.
