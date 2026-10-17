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
