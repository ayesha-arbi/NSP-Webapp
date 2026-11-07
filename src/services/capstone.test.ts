import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, enhancedApi, setApiAuthToken, ApiError } from "./api"
import { authStore } from "./authStore"
import {
  getDeviceCredential,
  setDeviceCredential,
  clearDeviceCredential,
} from "./deviceCredential"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("Capstone Post-Guide #7 Services", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    authStore.clearSession()
    clearDeviceCredential()
    setApiAuthToken(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    authStore.clearSession()
    clearDeviceCredential()
    setApiAuthToken(null)
  })

  describe("Feature B1: Step-Up MFA Authorization", () => {
    it("requests stepUpToken with scope and TOTP code", async () => {
      setApiAuthToken("access-token-123")
      let capturedBody: any
      let capturedHeaders: any

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (_url, init) => {
          capturedBody = JSON.parse(String(init?.body))
          capturedHeaders = (init?.headers as Record<string, string>)
          return jsonResponse(200, {
            success: true,
            message: "Step-up authentication successful",
            stepUpToken: "jwt-step-up-token-456",
            scope: "APPROVE_ASSESSMENT",
            expiresIn: 300,
          })
        },
      )

      const res = await api.requestStepUp("APPROVE_ASSESSMENT", "482910")

      expect(res.success).toBe(true)
      expect(res.stepUpToken).toBe("jwt-step-up-token-456")
      expect(res.scope).toBe("APPROVE_ASSESSMENT")
      expect(capturedBody).toEqual({
        scope: "APPROVE_ASSESSMENT",
        mfaCode: "482910",
      })
      expect(capturedHeaders["Authorization"]).toBe("Bearer access-token-123")
    })

    it("requests stepUpToken with backupCode via enhancedApi", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (_url, init) => {
          const body = JSON.parse(String(init?.body))
          expect(body.backupCode).toBe("ABC12345")
          return jsonResponse(200, {
            success: true,
            stepUpToken: "jwt-backup-stepup",
          })
        },
      )

      const token = await enhancedApi.requestStepUp(
        "REVOKE_CREDENTIAL",
        undefined,
        "ABC12345",
      )
      expect(token).toBe("jwt-backup-stepup")
    })

    it("attaches x-step-up-token header when approving assessment", async () => {
      setApiAuthToken("tester-jwt")
      let capturedHeaders: Record<string, string> = {}

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (_url, init) => {
          capturedHeaders = init?.headers as Record<string, string> || {}
          return jsonResponse(200, {
            success: true,
            message: "Assessment approved",
            assessment: { id: "asmt-1", status: "APPROVED" },
          })
        },
      )

      const result = await api.approveAssessment("asmt-1", "my-step-up-token")

      expect(capturedHeaders["x-step-up-token"]).toBe("my-step-up-token")
      expect(result.assessment.status).toBe("APPROVED")
    })
  })

  describe("Feature B2: Profile & Self-Service Password Management", () => {
    it("fetches user profile via api and enhancedApi", async () => {
      const mockProfile = {
        user_id: "c8a4df54-3236-4767-9bf4-0f2c7320b3a4",
        email: "ahmad.raza@navttc.gov.pk",
        name: "Ahmad Raza",
        role: "TRADE_TESTER",
        hub_id: 1,
        is_mfa_active: true,
        mfa_enrollment_pending: false,
        admin_locked: false,
        last_login: "2026-11-03T08:30:00.000Z",
        created_at: "2026-01-15T10:00:00.000Z",
      }

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse(200, { success: true, profile: mockProfile }),
      )

      const profile = await enhancedApi.getProfile()
      expect(profile).toEqual(mockProfile)
      expect(profile.email).toBe("ahmad.raza@navttc.gov.pk")
      expect(profile.role).toBe("TRADE_TESTER")
    })

    it("updates password via PATCH /api/auth/profile", async () => {
      let capturedBody: any
      let capturedMethod = ""

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (_url, init) => {
          capturedMethod = init?.method || ""
          capturedBody = JSON.parse(String(init?.body))
          return jsonResponse(200, {
            success: true,
            message: "Password updated successfully",
          })
        },
      )

      const res = await enhancedApi.updatePassword(
        "OldPassword123!",
        "NewStrongPassword456!",
      )

      expect(capturedMethod).toBe("PATCH")
      expect(capturedBody).toEqual({
        currentPassword: "OldPassword123!",
        newPassword: "NewStrongPassword456!",
      })
      expect(res.success).toBe(true)
    })
  })

  describe("Feature B2: Active Sessions & Refresh Token Reuse Interceptor", () => {
    it("lists active sessions via api.getSessions", async () => {
      const mockSessions = [
        {
          session_id: "a1b2c3d4",
          device_fingerprint: "dfp_9a7b3c2d1e4f",
          ip_address: "203.128.22.14",
          created_at: "2026-11-03T08:00:00.000Z",
          last_active: "2026-11-03T09:15:00.000Z",
          expires_at: "2026-11-10T08:00:00.000Z",
          is_current: true,
        },
      ]

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse(200, { success: true, count: 1, sessions: mockSessions }),
      )

      const sessions = await enhancedApi.getSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0].session_id).toBe("a1b2c3d4")
      expect(sessions[0].is_current).toBe(true)
    })

    it("detects refresh token reuse and clears authStore immediately", async () => {
      authStore.setSession(
        {
          id: "u-1",
          email: "test@nsp.com",
          role: "TRADE_TESTER",
          hubLocationId: 1,
        },
        "test-access",
        "stolen-refresh",
      )

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        jsonResponse(401, {
          success: false,
          message:
            "Session has been revoked due to AUTH_REFRESH_TOKEN_REUSE_DETECTED",
        }),
      )

      await expect(api.checkHealth()).rejects.toBeInstanceOf(ApiError)
      expect(authStore.getState().isAuthenticated).toBe(false)
      expect(authStore.getState().accessToken).toBeNull()
    })
  })

  describe("Feature B3: Device Authorization, Fingerprinting & Hub Lockdown", () => {
    it("attaches x-device-credential when stored locally", async () => {
      setDeviceCredential(
        "64charhexcredentialtoken1234567890abcdef1234567890abcdef12345678",
      )
      expect(getDeviceCredential()).toBe(
        "64charhexcredentialtoken1234567890abcdef1234567890abcdef12345678",
      )

      let capturedHeaders: Record<string, string> = {}
      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (_url, init) => {
          capturedHeaders = init?.headers as Record<string, string> || {}
          return jsonResponse(200, { success: true })
        },
      )

      await api.checkHealth()
      expect(capturedHeaders["x-device-credential"]).toBe(
        "64charhexcredentialtoken1234567890abcdef1234567890abcdef12345678",
      )
    })

    it("fetches device health overview via enhancedApi.getDeviceHealth", async () => {
      const mockHealth = [
        {
          deviceId: "dev-01",
          hubLocationId: 1,
          deviceName: "Lahore Testing Center Laptop #1",
          edrStatus: "compliant" as const,
          isOnline: true,
          lastHeartbeatAt: "2026-11-06T09:00:00.000Z",
          revoked: false,
        },
      ]

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse(200, { success: true, devices: mockHealth }),
      )

      const devices = await enhancedApi.getDeviceHealth()
      expect(devices).toHaveLength(1)
      expect(devices[0].deviceName).toBe("Lahore Testing Center Laptop #1")
      expect(devices[0].edrStatus).toBe("compliant")
      expect(devices[0].isOnline).toBe(true)
    })

    it("triggers emergency hub lockdown via enhancedApi.setHubLockdown", async () => {
      let capturedBody: any
      let capturedUrl = ""

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (url, init) => {
          capturedUrl = String(url)
          capturedBody = JSON.parse(String(init?.body))
          return jsonResponse(200, {
            success: true,
            message: "Hub lockdown state updated",
          })
        },
      )

      const res = await enhancedApi.setHubLockdown(1, true)
      expect(capturedUrl).toContain("/api/super-admin/devices/lockdown")
      expect(capturedBody).toEqual({ hubLocationId: 1, isLocked: true })
      expect(res.success).toBe(true)
    })

    it("revokes device via enhancedApi.revokeDevice", async () => {
      let capturedUrl = ""
      vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (url) => {
        capturedUrl = String(url)
        return jsonResponse(200, {
          success: true,
          message: "Device revoked successfully",
        })
      })

      const res = await enhancedApi.revokeDevice("dev-laptop-99")
      expect(capturedUrl).toContain(
        "/api/super-admin/devices/dev-laptop-99/revoke",
      )
      expect(res.success).toBe(true)
    })

    it("sends device heartbeat with edrStatus", async () => {
      let capturedHeaders: Record<string, string> = {}
      let capturedBody: any

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        async (_url, init) => {
          capturedHeaders = init?.headers as Record<string, string> || {}
          capturedBody = JSON.parse(String(init?.body))
          return jsonResponse(200, { success: true })
        },
      )

      await api.sendDeviceHeartbeat("cred-123", "fp-456", "compliant")
      expect(capturedHeaders["x-device-credential"]).toBe("cred-123")
      expect(capturedHeaders["x-device-fingerprint"]).toBe("fp-456")
      expect(capturedBody).toEqual({ edrStatus: "compliant" })
    })
  })
})
