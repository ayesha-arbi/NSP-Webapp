import { describe, it, expect, beforeEach } from "vitest"
import { authStore } from "./authStore"

describe("authStore", () => {
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
    )

    expect(authStore.getState().role).toBe("super-admin")
  })

  it("notifies subscribers when session changes and clears properly", () => {
    const states: boolean[] = []
    const unsubscribe = authStore.subscribe((s) => {
      states.push(s.isAuthenticated)
    })

    authStore.setSession({
      id: "usr-1",
      email: "test@nsp.com",
      role: "TRADE_TESTER",
      hubLocationId: 1,
    })
    expect(states[states.length - 1]).toBe(true)

    authStore.clearSession()
    expect(states[states.length - 1]).toBe(false)
    expect(authStore.getState().isAuthenticated).toBe(false)

    unsubscribe()
  })
})
