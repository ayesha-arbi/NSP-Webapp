import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, ApiError, ApiService, setApiAuthToken } from "./api"
import { authStore } from "./authStore"

const user = {
  id: "user-1",
  email: "tradetester@nsp.com",
  role: "TRADE_TESTER" as const,
  hubLocationId: 1,
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("API authentication recovery", () => {
  beforeEach(() => {
    authStore.clearSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    authStore.clearSession()
  })

  it("shares one refresh and retries concurrent requests with rotated tokens", async () => {
    authStore.setSession(user, "old-access", "old-refresh")
    let refreshCalls = 0
    const retriedAuthorizations: string[] = []

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        const authorization = new Headers(init?.headers).get("Authorization")
        if (url.endsWith("/api/auth/refresh")) {
          refreshCalls += 1
          expect(JSON.parse(String(init?.body))).toEqual({
            refreshToken: "old-refresh",
          })
          return jsonResponse(200, {
            success: true,
            message: "Access token refreshed successfully",
            accessToken: "new-access",
            refreshToken: "new-refresh",
            tokenType: "Bearer",
            expiresIn: 900,
          })
        }
        if (authorization === "Bearer old-access") {
          return jsonResponse(401, { message: "Invalid token" })
        }
        retriedAuthorizations.push(authorization ?? "")
        return jsonResponse(200, { success: true, assessments: [] })
      }),
    )

    await Promise.all([api.listAssessments(), api.listAssessments()])

    expect(refreshCalls).toBe(1)
    expect(retriedAuthorizations).toEqual([
      "Bearer new-access",
      "Bearer new-access",
    ])
    expect(authStore.getState().accessToken).toBe("new-access")
    expect(authStore.getState().refreshToken).toBe("new-refresh")
  })

  it("rejects malformed refresh success and clears the session", async () => {
    authStore.setSession(user, "old-access", "old-refresh")
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith("/api/auth/refresh")
          ? jsonResponse(200, {
              success: true,
              accessToken: "new-access",
              expiresIn: 900,
            })
          : jsonResponse(401, { message: "Invalid token" }),
      ),
    )

    await expect(api.listAssessments()).rejects.toBeInstanceOf(ApiError)
    expect(authStore.getState().isAuthenticated).toBe(false)
    expect(authStore.getState().refreshToken).toBeNull()
  })

  it("retries a protected request only once", async () => {
    authStore.setSession(user, "old-access", "old-refresh")
    let refreshCalls = 0
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/api/auth/refresh")) {
          refreshCalls += 1
          return jsonResponse(200, {
            success: true,
            accessToken: "new-access",
            refreshToken: "new-refresh",
            tokenType: "Bearer",
            expiresIn: 900,
          })
        }
        return jsonResponse(401, { message: "Invalid token" })
      }),
    )

    await expect(api.listAssessments()).rejects.toBeInstanceOf(ApiError)
    expect(refreshCalls).toBe(1)
    expect(authStore.getState().isAuthenticated).toBe(false)
  })

  it("does not refresh authentication endpoint failures", async () => {
    authStore.setSession(user, "old-access", "old-refresh")
    const fetchMock = vi.fn(async () =>
      jsonResponse(401, { message: "Invalid email or password" }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(api.login("bad@nsp.com", "wrong")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("surfaces global rate limiting without refreshing", async () => {
    authStore.setSession(user, "old-access", "old-refresh")
    const fetchMock = vi.fn(async () =>
      jsonResponse(429, { message: "Too many requests" }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(api.listAssessments()).rejects.toMatchObject({
      status: 429,
      message:
        "Rate limit exceeded (60 requests/minute). Please slow down and try again shortly.",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("surfaces role denial without refreshing", async () => {
    authStore.setSession(user, "old-access", "old-refresh")
    const fetchMock = vi.fn(async () =>
      jsonResponse(403, { message: "Access denied" }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(api.listAssessments()).rejects.toMatchObject({
      status: 403,
      message: "Access denied",
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe("api service", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setApiAuthToken(null)
  })

  it("exports ApiService as an alias of api", () => {
    expect(ApiService).toBe(api)
    expect(typeof api.login).toBe("function")
    expect(typeof api.verifyMfa).toBe("function")
    expect(typeof api.verifyBackupCode).toBe("function")
    expect(typeof api.issueCredential).toBe("function")
    expect(typeof api.approveCredential).toBe("function")
    expect(typeof api.getCredentialStatus).toBe("function")
    expect(typeof api.verifyPublicCredential).toBe("function")
  })

  it("attaches x-device-fingerprint header to requests", async () => {
    let capturedHeaders: HeadersInit | undefined

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ success: true, message: "OK" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    })

    await api.checkHealth()

    expect(capturedHeaders).toBeDefined()
    const headersObj = capturedHeaders as Record<string, string>
    expect(headersObj["x-device-fingerprint"]).toBeDefined()
    expect(typeof headersObj["x-device-fingerprint"]).toBe("string")
  })

  it("attaches Authorization header when authToken is set", async () => {
    setApiAuthToken("test-jwt-token")
    let capturedHeaders: HeadersInit | undefined

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedHeaders = init?.headers
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    })

    await api.checkHealth()

    const headersObj = capturedHeaders as Record<string, string>
    expect(headersObj["Authorization"]).toBe("Bearer test-jwt-token")
  })
})
