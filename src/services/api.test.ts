import { describe, it, expect, vi, beforeEach } from "vitest"
import { api, ApiService, setApiAuthToken } from "./api"

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
