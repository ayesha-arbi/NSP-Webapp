import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./api"
import { authStore } from "./authStore"

const user = {
  id: "user-1",
  email: "tradetester@nsp.com",
  role: "TRADE_TESTER" as const,
  hubLocationId: 1,
}

describe("authStore", () => {
  beforeEach(() => {
    authStore.clearSession()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    authStore.clearSession()
  })

  it("refuses an authenticated session without both tokens", () => {
    expect(() => authStore.setSession(user, "access-only", null)).toThrow(
      "A complete token pair is required",
    )
    expect(authStore.getState().isAuthenticated).toBe(false)
    expect(sessionStorage.getItem("nsp_session")).toBeNull()
  })

  it("rotates both tokens in memory and session storage", () => {
    authStore.setSession(user, "old-access", "old-refresh")

    authStore.setTokens("new-access", "new-refresh")

    expect(authStore.getState()).toMatchObject({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      isAuthenticated: true,
    })
    expect(JSON.parse(sessionStorage.getItem("nsp_session") ?? "{}")).toMatchObject(
      {
        accessToken: "new-access",
        refreshToken: "new-refresh",
      },
    )
  })

  it("revokes the active refresh token before clearing a session", async () => {
    authStore.setSession(user, "access", "active-refresh")
    const revoke = vi
      .spyOn(api, "revoke")
      .mockResolvedValue({ success: true, message: "revoked" })

    await authStore.logout()

    expect(revoke).toHaveBeenCalledWith("active-refresh")
    expect(authStore.getState().isAuthenticated).toBe(false)
    expect(sessionStorage.getItem("nsp_session")).toBeNull()
  })

  it("clears the session when server revocation fails", async () => {
    authStore.setSession(user, "access", "active-refresh")
    vi.spyOn(api, "revoke").mockRejectedValue(new Error("offline"))

    await authStore.logout()

    expect(authStore.getState().isAuthenticated).toBe(false)
    expect(sessionStorage.getItem("nsp_session")).toBeNull()
  })
})

describe("authStore role mapping and subscriptions", () => {
  beforeEach(() => {
    authStore.clearSession()
  })

  it("initializes with unauthenticated default state", () => {
    const state = authStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.role).toBe("trade-tester")
  })

  it("updates session and maps role correctly for TRADE_TESTER", () => {
    authStore.setSession(
      {
        id: "usr-1",
        email: "tester@nsp.gov.pk",
        role: "TRADE_TESTER",
        hubLocationId: 1,
        name: "Ahmad Raza",
      },
      "token-123",
      "refresh-123",
    )

    const state = authStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.role).toBe("trade-tester")
    expect(state.accessToken).toBe("token-123")
    expect(state.user?.name).toBe("Ahmad Raza")
  })

  it("maps role correctly for CENTER_SUPERINTENDENT", () => {
    authStore.setSession(
      {
        id: "usr-2",
        email: "super@nsp.gov.pk",
        role: "CENTER_SUPERINTENDENT",
        hubLocationId: 2,
        name: "Fatima Malik",
      },
      "token-456",
      "refresh-456",
    )

    expect(authStore.getState().role).toBe("center-superintendent")
  })

  it("maps role correctly for SUPER_ADMIN", () => {
    authStore.setSession(
      {
        id: "usr-3",
        email: "admin@nsp.gov.pk",
        role: "SUPER_ADMIN",
        hubLocationId: 0,
        name: "Zara Khan",
      },
      "token-789",
      "refresh-789",
    )

    expect(authStore.getState().role).toBe("super-admin")
  })

  it("notifies subscribers when session changes and clears properly", () => {
    const states: boolean[] = []
    const unsubscribe = authStore.subscribe((s) => {
      states.push(s.isAuthenticated)
    })

    authStore.setSession(
      {
        id: "usr-1",
        email: "test@nsp.com",
        role: "TRADE_TESTER",
        hubLocationId: 1,
      },
      "token-subscription",
      "refresh-subscription",
    )
    expect(states[states.length - 1]).toBe(true)

    authStore.clearSession()
    expect(states[states.length - 1]).toBe(false)
    expect(authStore.getState().isAuthenticated).toBe(false)

    unsubscribe()
  })
})
