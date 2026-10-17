// Auth Store with refresh token support and logout revocation
import { User, setApiAuthToken, onAuthExpired, api } from "./api"

export type AppRole = "trade-tester" | "center-superintendent" | "super-admin"

export interface SessionState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  role: AppRole
  isAuthenticated: boolean
}

const STORAGE_KEY = "nsp_session"

function mapServerRoleToAppRole(serverRole?: string): AppRole {
  switch (serverRole) {
    case "CENTER_SUPERINTENDENT":
      return "center-superintendent"
    case "SUPER_ADMIN":
      return "super-admin"
    case "TRADE_TESTER":
    default:
      return "trade-tester"
  }
}

function getInitialState(): SessionState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.accessToken && parsed.refreshToken && parsed.user) {
        setApiAuthToken(parsed.accessToken)
        return {
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          role: mapServerRoleToAppRole(parsed.user.role),
          isAuthenticated: true,
        }
      }
    }
  } catch {}
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    role: "trade-tester",
    isAuthenticated: false,
  }
}

let currentState: SessionState = getInitialState()

const listeners = new Set<(state: SessionState) => void>()

function notify() {
  listeners.forEach((l) => l(currentState))
}

export const authStore = {
  getState(): SessionState {
    return currentState
  },

  subscribe(listener: (state: SessionState) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  // Called after login or MFA verification
  setSession(user: User, accessToken?: string | null, refreshToken?: string | null) {
    if (!accessToken || !refreshToken) {
      throw new Error("A complete token pair is required")
    }
    const token = accessToken
    const rToken = refreshToken
    const role = mapServerRoleToAppRole(user.role)
    currentState = { user, accessToken: token, refreshToken: rToken, role, isAuthenticated: true }
    setApiAuthToken(token)
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, accessToken: token, refreshToken: rToken })
      )
    } catch {}
    notify()
  },

  // Update only tokens (used after refresh)
  setTokens(accessToken: string, refreshToken: string) {
    currentState = { ...currentState, accessToken, refreshToken }
    setApiAuthToken(accessToken)
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}")
      stored.accessToken = accessToken
      stored.refreshToken = refreshToken
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {}
    notify()
  },

  clearSession() {
    currentState = {
      user: null,
      accessToken: null,
      refreshToken: null,
      role: "trade-tester",
      isAuthenticated: false,
    }
    setApiAuthToken(null)
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    notify()
  },

  // Logout: revoke server session then clear client state
  async logout() {
    const refresh = currentState.refreshToken
    try {
      if (refresh) {
        await api.revoke(refresh)
      }
    } catch {
      // Local logout must complete even when server revocation is unavailable.
    } finally {
      this.clearSession()
    }
  },
}

// Automatic handling of 401 expiration (fallback)
onAuthExpired(() => {
  authStore.clearSession()
})
