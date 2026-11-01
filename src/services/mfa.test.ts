import { describe, it, expect, vi, beforeEach } from "vitest"
import { api, ApiError, setApiAuthToken } from "./api"
import { authStore } from "./authStore"

describe("Trade Tester MFA Login and Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setApiAuthToken(null)
    authStore.clearSession()
  })

  it("submits 6-digit MFA payload with compatibility keys and preserves leading zero '012345'", async () => {
    let capturedBody: any = null

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response(
        JSON.stringify({
          success: true,
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: "usr-tt-01",
            email: "tradetester@nsp.com",
            role: "TRADE_TESTER",
            hubLocationId: 1,
            name: "Trade Tester",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    })

    const res = await api.verifyMfa("tradetester@nsp.com", "012345")

    expect(capturedBody).toBeDefined()
    expect(capturedBody.email).toBe("tradetester@nsp.com")
    expect(capturedBody.mfaCode).toBe("012345")
    expect(capturedBody.code).toBe("012345")
    expect(capturedBody.otp).toBe("012345")
    expect(typeof capturedBody.code).toBe("string")
    expect(capturedBody.code.startsWith("0")).toBe(true)
    expect(capturedBody.code.length).toBe(6)

    expect(res.success).toBe(true)
    expect(res.user?.role).toBe("TRADE_TESTER")
    expect(res.accessToken).toBe("mock-access-token")
  })

  it("correctly sets Trade Tester authenticated session upon successful MFA verification", () => {
    const mockUser = {
      id: "usr-tt-01",
      email: "tradetester@nsp.com",
      role: "TRADE_TESTER" as const,
      hubLocationId: 1,
      name: "Trade Tester",
    }

    authStore.setSession(mockUser, "token-123", "refresh-456")

    const session = authStore.getState()
    expect(session.isAuthenticated).toBe(true)
    expect(session.role).toBe("trade-tester")
    expect(session.user?.email).toBe("tradetester@nsp.com")
    expect(session.accessToken).toBe("token-123")
    expect(session.refreshToken).toBe("refresh-456")
  })

  it("handles 401 invalid code error from verification endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid MFA verification code.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    })

    await expect(
      api.verifyMfa("tradetester@nsp.com", "999999"),
    ).rejects.toThrow(ApiError)
  })

  it("handles 429 rate limiting (too many attempts) from verification endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Rate limit exceeded.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    })

    try {
      await api.verifyMfa("tradetester@nsp.com", "123456")
      expect.fail("Expected 429 ApiError")
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError)
      expect(err.status).toBe(429)
    }
  })

  it("handles network failure (server down) with status 0 ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => {
      throw new Error("Failed to fetch")
    })

    try {
      await api.verifyMfa("tradetester@nsp.com", "123456")
      expect.fail("Expected network ApiError")
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError)
      expect(err.status).toBe(0)
    }
  })

  it("clears session properly and revokes authentication state", () => {
    const mockUser = {
      id: "usr-tt-01",
      email: "tradetester@nsp.com",
      role: "TRADE_TESTER" as const,
      hubLocationId: 1,
    }

    authStore.setSession(mockUser, "token-abc", "refresh-xyz")
    expect(authStore.getState().isAuthenticated).toBe(true)

    authStore.clearSession()
    expect(authStore.getState().isAuthenticated).toBe(false)
    expect(authStore.getState().user).toBeNull()
    expect(authStore.getState().accessToken).toBeNull()
  })
})
