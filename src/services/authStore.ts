import { User, setApiAuthToken, onAuthExpired } from "./api"

export type AppRole = "trade-tester" | "center-superintendent" | "super-admin"

export interface SessionState {
  user: User | null

  accessToken: string | null

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

      if (parsed.accessToken && parsed.user) {
        setApiAuthToken(parsed.accessToken)

        return {
          user: parsed.user,

          accessToken: parsed.accessToken,

          role: mapServerRoleToAppRole(parsed.user.role),

          isAuthenticated: true,
        }
      }
    }
  } catch {}

  return {
    user: null,

    accessToken: null,

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

  setSession(user: User, accessToken?: string | null) {
    const token = accessToken || null

    const role = mapServerRoleToAppRole(user.role)

    currentState = {
      user,

      accessToken: token,

      role,

      isAuthenticated: true,
    }

    setApiAuthToken(token)

    try {
      sessionStorage.setItem(
        STORAGE_KEY,

        JSON.stringify({ user, accessToken: token }),
      )
    } catch {}

    notify()
  },

  clearSession() {
    currentState = {
      user: null,

      accessToken: null,

      role: "trade-tester",

      isAuthenticated: false,
    }

    setApiAuthToken(null)

    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}

    notify()
  },
}

// Register automatic 401 expiration handling

onAuthExpired(() => {
  authStore.clearSession()
})
