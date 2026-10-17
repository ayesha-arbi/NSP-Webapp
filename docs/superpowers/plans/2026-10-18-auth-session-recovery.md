# Auth Session and Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the live Guide #4 authentication lifecycle with safe refresh rotation, revocation-backed logout, IP-03 recovery, backend lockout UX, and one-time backup-code generation.

**Architecture:** Keep `api.ts` as the HTTP boundary and `authStore.ts` as the browser-session authority, then pass transient login credentials through the existing `App.tsx` screen state. Add one focused recovery screen and replace mock Settings recovery behavior without restructuring unrelated portal screens.

**Tech Stack:** React 19, TypeScript 5.7, Vite 8, Tailwind CSS 4, Vitest, jsdom, React Testing Library, user-event.

**Spec:** `docs/superpowers/specs/2026-10-18-auth-session-recovery-design.md`

## Global Constraints

- Preserve the existing dark green, cream, muted gold, compact card, form, and modal visual system.
- Keep refresh tokens in `sessionStorage`; never persist passwords or backup codes.
- Auth endpoints never trigger silent refresh; protected requests retry at most once.
- Generated backup codes come only from the backend, appear only once, and are discarded after acknowledged dismissal.
- Preserve Guide #2 and Guide #3 assessment, approval, upload, and offline behavior.
- Keep assessment status as an open enum; do not add ledger assumptions.
- Use double quotes for strings containing apostrophes, close JSX tags, and default-export components.

## Review Focus

- A protected request returning `401` again after its retry clears the session rather than looping; pinned in Task 2.
- A successful refresh payload missing either rotated token clears the session; pinned in Task 2.
- A reload during MFA or recovery cannot reconstruct or persist the password; pinned in Task 4.
- Clipboard rejection and unavailable object-URL APIs leave generated codes visible and recoverable; pinned in Task 5.
- A Settings status failure is shown as unavailable, never `0 of 0`; pinned in Task 5.

---

### Task 1: Install and Configure the Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: existing Vite configuration and browser APIs.
- Produces: `npm test -- --run` for Vitest/jsdom component and service tests, with jest-dom matchers and per-test storage cleanup.

- [ ] **Step 1: Add a deliberately failing smoke test**

Create `src/test/setup.test.ts` with a single assertion expecting `sessionStorage` to be available and cleared by setup, initially failing because the test environment is not configured.

- [ ] **Step 2: Run the smoke test and verify RED**

Run: `npm test -- --run src/test/setup.test.ts`
Expected: FAIL because the test script or jsdom setup does not exist.

- [ ] **Step 3: Install and configure Vitest, jsdom, Testing Library, jest-dom, and user-event**

Add exact dev dependencies compatible with React 19/Vite 8, a `test` script, `test.environment = "jsdom"`, `test.setupFiles = ["./src/test/setup.ts"]`, and cleanup for DOM plus `sessionStorage`/`localStorage` after each test.

- [ ] **Step 4: Run the smoke test and verify GREEN**

Run: `npm test -- --run src/test/setup.test.ts`
Expected: PASS with no warnings.

- [ ] **Step 5: Commit the harness**

```bash
git add package.json package-lock.json vite.config.ts src/test/setup.ts src/test/setup.test.ts
git commit -m "test: add frontend auth test harness"
```

### Task 2: Make Refresh Rotation Deterministic

**Files:**
- Modify: `src/services/api.ts`
- Modify: `src/services/authStore.ts`
- Create: `src/services/api.test.ts`
- Create: `src/services/authStore.test.ts`

**Interfaces:**
- Consumes: `authStore.getState()`, `authStore.setTokens(accessToken, refreshToken)`, `authStore.clearSession()`, global `fetch`.
- Produces: typed `RefreshResponse`, `BackupCodesStatusResponse`, `GenerateBackupCodesResponse`, `AuthSessionResponse`; `request<T>(endpoint, options, retryAuth?)`; atomic rotation and reliable auth-expiry cleanup.

- [ ] **Step 1: Write failing API-client tests**

Cover: two concurrent protected `401` responses issue one refresh request; both retry with the new access token; the new refresh token is stored before retries; auth endpoint `401` does not refresh; repeat `401`, missing refresh token, refresh `401`, and malformed refresh success clear the session without recursion; `429` returns the shared cooldown message; `403` remains a role error.

- [ ] **Step 2: Run API-client tests and verify RED**

Run: `npm test -- --run src/services/api.test.ts`
Expected: FAIL on current retry-loop, malformed-response, or cleanup behavior.

- [ ] **Step 3: Implement typed contracts and one-retry refresh coordination**

Refactor the request path to accept an internal retry marker, bypass refresh for every `/api/auth/` endpoint, validate both rotated token strings, update both tokens before resolving the shared refresh promise, and invoke auth expiry exactly once on terminal failure.

- [ ] **Step 4: Run API-client tests and verify GREEN**

Run: `npm test -- --run src/services/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing session-store tests**

Cover: `setSession` rejects incomplete token pairs, `setTokens` updates memory and `sessionStorage` together, and `logout` sends the active refresh token then clears state after both revoke success and revoke failure.

- [ ] **Step 6: Run store tests and verify RED**

Run: `npm test -- --run src/services/authStore.test.ts`
Expected: FAIL on current partial-session or logout-finally behavior.

- [ ] **Step 7: Implement strict sessions and guaranteed logout cleanup**

Make authenticated session creation require both non-empty tokens, keep token rotation atomic, and place `clearSession()` in logout's `finally` block.

- [ ] **Step 8: Run service tests and verify GREEN**

Run: `npm test -- --run src/services/api.test.ts src/services/authStore.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit the auth foundation**

```bash
git add src/services/api.ts src/services/authStore.ts src/services/api.test.ts src/services/authStore.test.ts
git commit -m "feat: secure rotating auth sessions"
```

### Task 3: Use Backend Lockout State on IP-01 and Complete MFA Sessions

**Files:**
- Modify: `src/screens/LoginScreen.tsx`
- Modify: `src/screens/MFAScreen.tsx`
- Create: `src/screens/LoginScreen.test.tsx`
- Create: `src/screens/MFAScreen.test.tsx`

**Interfaces:**
- Consumes: typed `api.login`, `api.verifyMfa`, `authStore.setSession` from Task 2.
- Produces: `LoginScreen.onSuccess(role, email, password)` and `MFAScreen.onUseBackupCode()` callbacks; complete MFA sessions.

- [ ] **Step 1: Write failing IP-01 tests**

Cover: invalid credentials render inline; either backend lockout message renders a lock alert mentioning 15 minutes; network failure is distinct; `429` is a cooldown; five client failures alone do not manufacture lockout; API failure never falls back to demo authentication.

- [ ] **Step 2: Run IP-01 tests and verify RED**

Run: `npm test -- --run src/screens/LoginScreen.test.tsx`
Expected: FAIL because local attempt counting and demo fallback still exist.

- [ ] **Step 3: Implement backend-driven IP-01 behavior**

Remove `DEMO_ACCOUNTS`, local attempt counting, simulated lockout triggers/countdown, and unauthorized-device simulation from the production submit path. Classify errors using `ApiError.status` and the case-insensitive backend message, and pass the submitted password only through `onSuccess`.

- [ ] **Step 4: Run IP-01 tests and verify GREEN**

Run: `npm test -- --run src/screens/LoginScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write failing IP-02 tests**

Cover: valid MFA stores user plus both returned tokens; incomplete success does not authenticate; invalid MFA clears/highlights the digits; recovery link calls `onUseBackupCode` and no backup-code modal remains.

- [ ] **Step 6: Run IP-02 tests and verify RED**

Run: `npm test -- --run src/screens/MFAScreen.test.tsx`
Expected: FAIL because refresh token is dropped and recovery is embedded.

- [ ] **Step 7: Implement complete MFA and recovery navigation**

Require `user`, `accessToken`, and `refreshToken`, call `authStore.setSession` with all values, clear digits after invalid code, replace the embedded modal with the exact recovery-link copy, and invoke `onUseBackupCode`.

- [ ] **Step 8: Run auth-screen tests and verify GREEN**

Run: `npm test -- --run src/screens/LoginScreen.test.tsx src/screens/MFAScreen.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit IP-01 and IP-02**

```bash
git add src/screens/LoginScreen.tsx src/screens/MFAScreen.tsx src/screens/LoginScreen.test.tsx src/screens/MFAScreen.test.tsx
git commit -m "feat: use live lockout and MFA sessions"
```

### Task 4: Add Dedicated IP-03 and Wire Auth Navigation

**Files:**
- Create: `src/screens/BackupCodeScreen.tsx`
- Create: `src/screens/BackupCodeScreen.test.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: `api.verifyBackupCode(email, password, backupCode)`, `authStore.setSession`, callbacks from Task 3.
- Produces: `BackupCodeScreen({ email, password, onSuccess, onBackToMfa, onBackToLogin })`; `AppScreen` includes `backup-code`; transient password is cleared at login reset and authentication completion.

- [ ] **Step 1: Write failing IP-03 tests**

Cover: blank code validation; exact request payload; success stores both tokens; already-used error asks for another code; lockout shows a 15-minute lock alert; `429` and network errors are distinct; submit disables during flight; the screen never writes email/password/code to browser storage.

- [ ] **Step 2: Run IP-03 tests and verify RED**

Run: `npm test -- --run src/screens/BackupCodeScreen.test.tsx`
Expected: FAIL because the screen does not exist.

- [ ] **Step 3: Implement `BackupCodeScreen`**

Match IP-02's header and card styling, display the email, provide masked/revealable single-use code entry, map errors by status/message, and expose back-to-MFA and back-to-login actions.

- [ ] **Step 4: Run IP-03 tests and verify GREEN**

Run: `npm test -- --run src/screens/BackupCodeScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write failing app-navigation tests**

Cover: login stores credentials only in React state; IP-02 link reaches IP-03; IP-03 back-to-MFA preserves the active attempt; back-to-login and auth success clear the password; a fresh mount cannot recover transient credentials and shows IP-01.

- [ ] **Step 6: Run app tests and verify RED**

Run: `npm test -- --run src/App.test.tsx`
Expected: FAIL because `backup-code` routing and transient password state are absent.

- [ ] **Step 7: Wire IP-03 through `App.tsx`**

Extend `AppScreen`, capture password from IP-01 in component state, pass it only to IP-03, clear it on login reset/success, and preserve existing verifier and authenticated portal behavior.

- [ ] **Step 8: Run recovery-flow tests and verify GREEN**

Run: `npm test -- --run src/screens/BackupCodeScreen.test.tsx src/App.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit IP-03**

```bash
git add src/screens/BackupCodeScreen.tsx src/screens/BackupCodeScreen.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: add backup code recovery screen"
```

### Task 5: Replace Mock Backup-Code Settings and Finish Logout UX

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Create: `src/screens/SettingsScreen.test.tsx`
- Modify: `src/components/Layout.tsx`
- Create: `src/components/Layout.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `api.backupCodesStatus`, `api.generateBackupCodes`, async `authStore.logout`.
- Produces: live `N of T backup codes remaining`; server-only generate flow; guarded one-time reveal; `Layout.onLogout(): Promise<void>` pending behavior.

- [ ] **Step 1: Write failing Settings tests**

Cover: status loading, `8 of 10 backup codes remaining`, unavailable status, generate availability only when no codes exist, ten returned codes, exact warning, copy success/failure, text download, acknowledgement-gated dismissal including backdrop/Escape, code discard after close, and `409` refresh without replacement codes.

- [ ] **Step 2: Run Settings tests and verify RED**

Run: `npm test -- --run src/screens/SettingsScreen.test.tsx`
Expected: FAIL because the screen exposes local mock view/regeneration behavior.

- [ ] **Step 3: Implement the live Settings recovery section**

Delete local generation and regeneration states/UI; introduce one status loader used on Security-tab entry and after generation outcomes; show codes only from the generation response; implement guarded dismissal, clipboard feedback, text-blob download with URL cleanup, and immediate in-memory code clearing after close.

- [ ] **Step 4: Run Settings tests and verify GREEN**

Run: `npm test -- --run src/screens/SettingsScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write failing logout UI tests**

Cover: confirm invokes async logout once, confirm button disables and shows pending copy, revocation completion returns to IP-01, and revocation rejection still returns to IP-01 because the store clears in `finally`.

- [ ] **Step 6: Run logout UI tests and verify RED**

Run: `npm test -- --run src/components/Layout.test.tsx src/App.test.tsx`
Expected: FAIL because logout is fire-and-forget with no pending state.

- [ ] **Step 7: Implement awaited logout UI**

Change `LayoutProps.onLogout` to `() => Promise<void>`, track `isSigningOut`, disable both modal actions while pending, and make `App.handleLogout` await `authStore.logout()` before setting IP-01.

- [ ] **Step 8: Run feature tests and verify GREEN**

Run: `npm test -- --run`
Expected: all tests PASS with no console warnings.

- [ ] **Step 9: Run static and production verification**

Run: `npm run typecheck`
Expected: exit 0.

Run: `npm run build`
Expected: exit 0 and Vite production assets generated.

Run: `npm run format -- --check`
Expected: exit 0, or if the repository script does not support check mode, run the documented non-mutating oxfmt check equivalent.

- [ ] **Step 10: Perform visual verification**

Run `npm run dev`, inspect IP-01, IP-02, IP-03, Settings Security, generation modal, and logout modal at desktop and narrow viewport, and confirm no overflow, clipped actions, mismatched colors, or acknowledgement bypass.

- [ ] **Step 11: Commit the completed integration**

```bash
git add src/screens/SettingsScreen.tsx src/screens/SettingsScreen.test.tsx src/components/Layout.tsx src/components/Layout.test.tsx src/App.tsx
git commit -m "feat: complete auth recovery lifecycle"
```
