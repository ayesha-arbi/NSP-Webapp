import { User, setApiAuthToken, onAuthExpired } from "./api"

export type AppRole = "trade-tester" | "center-superintendent" | "super-admin"

export interface SessionState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  role: AppRole
  isAuthenticated: boolean
}

const STORAGE_KEY = "nsp_session"

export function mapServerRoleToAppRole(serverRole?: string): AppRole {
  const normalized = (serverRole || "").toUpperCase().replace(/[-_\s]/g, "")
  if (normalized.includes("SUPERINTENDENT")) {
    return "center-superintendent"
  }
  if (normalized.includes("ADMIN")) {
    return "super-admin"
  }
  return "trade-tester"
}

function getInitialState(): SessionState {
  try {
    const raw =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(STORAGE_KEY)
        : null

    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.accessToken && parsed.user) {
        setApiAuthToken(parsed.accessToken)
        return {
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken || null,
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

  getRefreshToken(): string | null {
    if (currentState.refreshToken) return currentState.refreshToken
    try {
      if (typeof localStorage !== "undefined") {
        const local = localStorage.getItem("refreshToken")
        if (local) return local
      }
      if (typeof sessionStorage !== "undefined") {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          return parsed.refreshToken || null
        }
      }
    } catch {}
    return null
  },

  subscribe(listener: (state: SessionState) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  setSession(
    user: User,
    accessToken?: string | null,
    refreshToken?: string | null,
  ) {
    const token = accessToken || null
    const rToken =
      refreshToken ||
      currentState.refreshToken ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null)

    const role = mapServerRoleToAppRole(user.role)

    currentState = {
      user,
      accessToken: token,
      refreshToken: rToken,
      role,
      isAuthenticated: true,
    }

    setApiAuthToken(token)

    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user, accessToken: token, refreshToken: rToken }),
        )
      }
      if (typeof localStorage !== "undefined") {
        if (token) localStorage.setItem("accessToken", token)
        if (rToken) localStorage.setItem("refreshToken", rToken)
        localStorage.setItem("user", JSON.stringify(user))
      }
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

    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY)
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
      }
    } catch {}

    notify()
  },
}

// Register automatic 401 expiration handling
onAuthExpired(() => {
  authStore.clearSession()
})
