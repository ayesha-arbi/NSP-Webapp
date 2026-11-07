import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, onAuthExpired } from "./api"
import { superAdminApi } from "./superAdmin"
import { authStore } from "./authStore"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("Guide #7 Super Admin & MFA Enrollment Service", () => {
  beforeEach(() => {
    authStore.clearSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    authStore.clearSession()
  })

  describe("MFA Enrollment Lifecycle", () => {
    it("starts MFA enrollment with enrollmentToken", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          expect(String(input)).toContain("/api/auth/mfa/enroll/start")
          expect(init?.method).toBe("POST")
          const headers = new Headers(init?.headers)
          expect(headers.get("Authorization")).toBe(
            "Bearer test-enroll-token-123",
          )
          return jsonResponse(200, {
            success: true,
            secret: "JBSWY3DPEHPK3PXP",
            otpauthUrl:
              "otpauth://totp/NSP:user@gov.pk?secret=JBSWY3DPEHPK3PXP",
          })
        }),
      )

      const res = await api.startMfaEnrollment("test-enroll-token-123")
      expect(res.success).toBe(true)
      expect(res.secret).toBe("JBSWY3DPEHPK3PXP")
      expect(res.otpauthUrl).toContain("otpauth://totp/")
    })

    it("confirms MFA enrollment with 6-digit code", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          expect(String(input)).toContain("/api/auth/mfa/enroll/confirm")
          expect(init?.method).toBe("POST")
          const body = JSON.parse(String(init?.body))
          expect(body.mfaCode || body.code).toBe("654321")
          return jsonResponse(200, {
            success: true,
            message: "MFA enrolled successfully",
          })
        }),
      )

      const res = await api.confirmMfaEnrollment(
        "test-enroll-token-123",
        "654321",
      )
      expect(res.success).toBe(true)
      expect(res.message).toBe("MFA enrolled successfully")
    })
  })

  describe("Super Admin Endpoints", () => {
    it("fetches dashboard metrics", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
          expect(String(input)).toContain("/api/super-admin/dashboard")
          return jsonResponse(200, {
            success: true,
            users: {
              total: 12,
              superAdmins: 2,
              centerSuperintendents: 4,
              tradeTesters: 6,
              activeMfa: 10,
              pendingMfa: 2,
              adminLocked: 1,
            },
            sessions: { activeCount: 5 },
            candidates: { totalEnrolled: 150, verifiedCnic: 140 },
            assessments: {
              totalAssessed: 120,
              submitted: 30,
              approved: 80,
              rejected: 10,
            },
            ledger: {
              totalCredentials: 75,
              pendingApproval: 15,
              approved: 60,
              mintedOnChain: 58,
            },
          })
        }),
      )

      const stats = await superAdminApi.getDashboard()
      expect(stats.users.total).toBe(12)
      expect(stats.sessions.activeCount).toBe(5)
      expect(stats.ledger.mintedOnChain).toBe(58)
    })

    it("lists hub users with query filters", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
          const url = String(input)
          expect(url).toContain("/api/super-admin/users")
          expect(url).toContain("role=TRADE_TESTER")
          expect(url).toContain("limit=10")
          return jsonResponse(200, {
            users: [
              {
                userId: "u1",
                email: "tester@nsp.gov.pk",
                role: "TRADE_TESTER",
                hubLocationId: 1,
                isMfaActive: true,
                mfaEnrollmentPending: false,
                adminLocked: false,
                failedLoginAttempts: 0,
                createdAt: "2026-01-01T00:00:00Z",
              },
            ],
            pagination: { limit: 10, offset: 0, total: 1 },
          })
        }),
      )

      const res = await superAdminApi.getUsers({
        role: "TRADE_TESTER",
        limit: 10,
      })
      expect(res.users.length).toBe(1)
      expect(res.users[0].email).toBe("tester@nsp.gov.pk")
    })

    it("provisions a staff user and returns TOTP setup QR credentials", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          expect(String(input)).toContain("/api/super-admin/users")
          expect(init?.method).toBe("POST")
          expect(JSON.parse(String(init?.body))).toEqual({
            email: "newtester@nsp.gov.pk",
            name: "New Tester",
            role: "TRADE_TESTER",
            hubLocationId: 1,
          })
          return jsonResponse(201, {
            success: true,
            message: "User provisioned successfully",
            data: {
              userId: "u-new",
              email: "newtester@nsp.gov.pk",
              role: "TRADE_TESTER",
              hubLocationId: 1,
            },
            mfaEnrollment: {
              secret: "NEWSECRETKEY1234",
              otpauthUrl:
                "otpauth://totp/NSP:newtester@nsp.gov.pk?secret=NEWSECRETKEY1234",
            },
          })
        }),
      )

      const res = await superAdminApi.createUser({
        email: "newtester@nsp.gov.pk",
        name: "New Tester",
        role: "TRADE_TESTER",
        hubLocationId: 1,
      })
      expect(res.success).toBe(true)
      expect(res.mfaEnrollment?.secret).toBe("NEWSECRETKEY1234")
      expect(res.mfaEnrollment?.otpauthUrl).toContain("otpauth://")
    })

    it("locks and unlocks a user account", async () => {
      let lockedCalled = false
      let unlockedCalled = false

      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input)
          if (url.endsWith("/lock")) {
            lockedCalled = true
            expect(init?.method).toBe("POST")
            expect(JSON.parse(String(init?.body))).toEqual({
              reason: "Security audit suspicion",
            })
            return jsonResponse(200, {
              success: true,
              data: { message: "User locked", user: { adminLocked: true } },
            })
          }
          if (url.endsWith("/unlock")) {
            unlockedCalled = true
            expect(init?.method).toBe("POST")
            return jsonResponse(200, {
              success: true,
              data: { message: "User unlocked", user: { adminLocked: false } },
            })
          }
          return jsonResponse(404, { message: "Not found" })
        }),
      )

      const lockRes = await superAdminApi.lockUser(
        "u-target",
        "Security audit suspicion",
      )
      expect(lockRes.success).toBe(true)
      expect(lockedCalled).toBe(true)

      const unlockRes = await superAdminApi.unlockUser("u-target")
      expect(unlockRes.success).toBe(true)
      expect(unlockedCalled).toBe(true)
    })

    it("resets a user MFA and returns new enrollment details", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          expect(String(input)).toContain(
            "/api/super-admin/users/u-target/reset-mfa",
          )
          expect(init?.method).toBe("POST")
          expect(JSON.parse(String(init?.body))).toEqual({
            reason: "Lost mobile device",
          })
          return jsonResponse(200, {
            success: true,
            mfaEnrollment: {
              secret: "RESETSECRET5678",
              otpauthUrl:
                "otpauth://totp/NSP:user@gov.pk?secret=RESETSECRET5678",
            },
          })
        }),
      )

      const res = await superAdminApi.resetUserMfa(
        "u-target",
        "Lost mobile device",
      )
      expect(res.success).toBe(true)
      expect(res.mfaEnrollment?.secret).toBe("RESETSECRET5678")
    })

    it("monitors active sessions and revokes a session remotely", async () => {
      let revokeCalled = false

      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input)
          if (
            url.includes("/api/super-admin/sessions") &&
            init?.method !== "POST"
          ) {
            return jsonResponse(200, [
              {
                sessionId: "sess-100",
                userId: "u1",
                email: "tester@nsp.gov.pk",
                role: "TRADE_TESTER",
                hubLocationId: 1,
                ipAddress: "203.128.22.14",
                deviceFingerprint: "fp-123456",
                createdAt: "2026-08-27T10:00:00Z",
                expiresAt: "2026-08-27T18:00:00Z",
              },
            ])
          }
          if (url.endsWith("/sessions/sess-100/revoke")) {
            revokeCalled = true
            expect(init?.method).toBe("POST")
            return jsonResponse(200, {
              success: true,
              data: { message: "Session revoked successfully" },
            })
          }
          return jsonResponse(404, {})
        }),
      )

      const sessions = await superAdminApi.getSessions()
      expect(sessions.length).toBe(1)
      expect(sessions[0].sessionId).toBe("sess-100")

      const revokeRes = await superAdminApi.revokeSession("sess-100")
      expect(revokeRes.success).toBe(true)
      expect(revokeCalled).toBe(true)
    })

    it("fetches audit trail logs", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
          expect(String(input)).toContain("/api/super-admin/audit-logs")
          return jsonResponse(200, [
            {
              logId: 101,
              eventType: "ACCOUNT_LOCKED",
              userId: "u-target",
              email: "tester@nsp.gov.pk",
              ipAddress: "203.128.22.14",
              createdAt: "2026-08-27T10:15:00Z",
              details: { reason: "Security violation" },
            },
          ])
        }),
      )

      const logs = await superAdminApi.getAuditLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].eventType).toBe("ACCOUNT_LOCKED")
    })
  })

  describe("Real-time Token Invalidation (token_version)", () => {
    it("immediately triggers onAuthExpired when backend responds 401 Session is no longer valid", async () => {
      authStore.setSession(
        {
          id: "u1",
          email: "tester@nsp.gov.pk",
          role: "TRADE_TESTER",
          hubLocationId: 1,
        },
        "valid-token",
        "valid-refresh",
      )

      let expiredCalled = false
      onAuthExpired(() => {
        expiredCalled = true
      })

      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
          const url = String(input)
          if (url.endsWith("/api/auth/refresh")) {
            throw new Error(
              "Refresh should NOT be called on token invalidation!",
            )
          }
          return jsonResponse(401, {
            success: false,
            message: "Session is no longer valid",
          })
        }),
      )

      await expect(api.listAssessments()).rejects.toThrow(
        "Session is no longer valid",
      )
      expect(expiredCalled).toBe(true)
    })
  })
})
