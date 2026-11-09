import React, { useState, useSyncExternalStore } from "react"
import BrandLogo from "./BrandLogo"
import { authStore } from "../services/authStore"
import { getHubLabel } from "../constants/hubs"

type Role = "trade-tester" | "center-superintendent" | "super-admin"

type Screen = "dashboard" | "enrollment" | "assessment" | "approvals" | "credentials" | "devices" | "notifications" | "settings" | "credential-revocation" | "user-management" | "record-detail"

interface LayoutProps {
  children: React.ReactNode

  currentScreen: Screen

  role: Role

  onNavigate: (screen: Screen) => void

  onLogout: () => Promise<void>
}

const roleLabels: Record<Role, string> = {
  "trade-tester": "Trade Tester",

  "center-superintendent": "Center Superintendent",

  "super-admin": "Super Admin",
}

const roleInitials: Record<Role, string> = {
  "trade-tester": "TT",

  "center-superintendent": "CS",

  "super-admin": "SA",
}

const roleNames: Record<Role, string> = {
  "trade-tester": "Ahmad Raza",

  "center-superintendent": "Fatima Malik",

  "super-admin": "Zara Khan",
}

/* ── icons ── */

interface IconProps {
  d: string | React.ReactNode
  size?: number
}

function Icon({ d, size = 18 }: IconProps) {
  if (typeof d !== "string") return <>{d}</>

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

function IconDashboard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function IconRevoke() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.33" />
    </svg>
  )
}

function IconMonitor() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

interface NavItem {
  id: Screen

  label: string

  icon: React.ReactNode

  roles: Role[]

  badge?: number
}

const navItems: NavItem[] = [
  {
    id: "dashboard",

    label: "Dashboard",

    icon: <IconDashboard />,

    roles: ["trade-tester", "center-superintendent", "super-admin"],
  },

  {
    id: "enrollment",

    label: "Candidates",

    icon: <IconUsers />,

    roles: ["trade-tester", "center-superintendent", "super-admin"],
  },

  {
    id: "assessment",

    label: "Assessments",

    icon: <IconClipboard />,

    roles: ["trade-tester", "center-superintendent", "super-admin"],
  },

  {
    id: "approvals",

    label: "Approvals",

    icon: <IconCheck />,

    roles: ["center-superintendent", "super-admin"],
  },

  {
    id: "credentials",

    label: "Credentials",

    icon: <IconBadge />,

    roles: ["super-admin"],
  },

  {
    id: "credential-revocation",

    label: "Revocation",

    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.33" />
      </svg>
    ),

    roles: ["super-admin"],
  },

  {
    id: "user-management",

    label: "Users",

    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),

    roles: ["super-admin"],
  },

  {
    id: "devices",

    label: "Devices",

    icon: <IconMonitor />,

    roles: ["super-admin"],
  },

  {
    id: "notifications",

    label: "Notifications",

    icon: <IconBell />,

    roles: ["trade-tester", "center-superintendent", "super-admin"],
  },

  {
    id: "settings",

    label: "Settings",

    icon: <IconSettings />,

    roles: ["trade-tester", "center-superintendent", "super-admin"],
  },
]

const breadcrumbLabels: Record<Screen, string[]> = {
  dashboard: ["Dashboard"],

  enrollment: ["Candidates", "Enrollment"],

  assessment: ["Assessments", "Score Entry"],

  approvals: ["Approvals", "Queue"],

  credentials: ["Credentials"],

  devices: ["Devices", "Device Health"],

  notifications: ["Notifications"],

  settings: ["Settings"],

  "credential-revocation": ["Credentials", "Revocation"],

  "user-management": ["Admin", "User Management"],

  "record-detail": ["Candidates", "Record Detail"],
}

export default function Layout({
  children,

  currentScreen,

  role,

  onNavigate,

  onLogout,
}: LayoutProps) {
  const session = useSyncExternalStore(authStore.subscribe, authStore.getState)
  const hubLabel = getHubLabel(session.user?.hubLocationId)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const visibleNav = navItems.filter((item) => item.roles.includes(role))
  const breadcrumbs = breadcrumbLabels[currentScreen] || []

  async function confirmSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await onLogout()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",

        height: "100vh",

        overflow: "hidden",

        background: "#F1F0EA",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 240,

          background: "#24302E",

          display: "flex",

          flexDirection: "column",

          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 56,

            display: "flex",

            alignItems: "center",

            padding: "0 20px",

            borderBottom: "1px solid rgba(255,255,255,0.1)",

            flexShrink: 0,
          }}
        >
          <BrandLogo size={32} />
          <div style={{ marginLeft: 12 }}>
            <div
              style={{
                color: "#fff",

                fontSize: 13,

                fontWeight: 700,

                lineHeight: 1.2,
              }}
            >
              NSP HUNAR
            </div>
            <div style={{ color: "#B08D46", fontSize: 11, fontWeight: 500 }}>
              Issuer Portal
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {visibleNav.map((item) => {
            const active = item.id === currentScreen

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  width: "100%",

                  display: "flex",

                  alignItems: "center",

                  gap: 10,

                  padding: "10px 20px",

                  background: active ? "rgba(93,202,165,0.15)" : "transparent",

                  border: "none",

                  cursor: "pointer",

                  textAlign: "left",

                  color: active ? "#fff" : "rgba(255,255,255,0.75)",

                  fontSize: 14,

                  fontWeight: active ? 600 : 400,

                  borderLeft: active
                    ? "3px solid #4C7A6E"
                    : "3px solid transparent",

                  transition: "all 0.15s",

                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.06)"
                    ;(e.currentTarget as HTMLButtonElement).style.color = "#fff"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      "transparent"
                    ;(e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.75)"
                  }
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: 10,

                      fontWeight: 700,

                      background: "#4C7A6E",

                      color: "#fff",

                      borderRadius: 999,

                      padding: "1px 6px",

                      minWidth: 18,

                      textAlign: "center",

                      flexShrink: 0,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User + sign out */}
        <div
          style={{
            padding: "16px 20px",

            borderTop: "1px solid rgba(255,255,255,0.1)",

            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: 10,

              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,

                height: 32,

                borderRadius: "50%",

                background: "#4C7A6E",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                color: "#fff",

                fontSize: 12,

                fontWeight: 700,

                flexShrink: 0,
              }}
            >
              {roleInitials[role]}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  color: "#fff",

                  fontSize: 13,

                  fontWeight: 600,

                  whiteSpace: "nowrap",

                  overflow: "hidden",

                  textOverflow: "ellipsis",
                }}
              >
                {roleNames[role]}
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                {roleLabels[role]}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            style={{
              display: "flex",

              alignItems: "center",

              gap: 8,

              color: "rgba(255,255,255,0.55)",

              fontSize: 13,

              background: "none",

              border: "none",

              cursor: "pointer",

              padding: 0,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#fff"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.55)"
            }}
          >
            <IconLogout /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div
        style={{
          flex: 1,

          display: "flex",

          flexDirection: "column",

          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          style={{
            height: 56,

            background: "#24302E",

            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            padding: "0 32px",

            flexShrink: 0,

            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb}>
                {i > 0 && (
                  <span
                    style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}
                  >
                    /
                  </span>
                )}
                <span
                  style={{
                    color:
                      i === breadcrumbs.length - 1
                        ? "#fff"
                        : "rgba(255,255,255,0.5)",

                    fontSize: 14,

                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  }}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {hubLabel && (
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                Hub: {hubLabel}
              </span>
            )}
            <button
              onClick={() => onNavigate("notifications")}
              style={{
                background: "none",

                border: "none",

                cursor: "pointer",

                color: "rgba(255,255,255,0.7)",

                position: "relative",

                padding: 4,

                display: "flex",
              }}
            >
              <IconBell />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {children}
        </main>
      </div>

      {/* ══ Sign Out Confirmation Modal ══ */}
      {showSignOutConfirm && (
        <div
          style={{
            position: "fixed",

            inset: 0,

            background: "rgba(36,48,46,0.55)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            zIndex: 200,

            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",

              border: "1px solid #D6D3C6",

              borderRadius: 8,

              padding: 32,

              maxWidth: 400,

              width: "100%",

              boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
            }}
          >
            <div
              style={{
                display: "flex",

                gap: 16,

                alignItems: "flex-start",

                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 48,

                  height: 48,

                  background: "#F1EFE8",

                  borderRadius: 8,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  flexShrink: 0,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5C5A50"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 18,

                    fontWeight: 700,

                    color: "#24302E",

                    margin: "0 0 6px",
                  }}
                >
                  Sign Out
                </h2>
                <p
                  style={{
                    fontSize: 14,

                    color: "#5C5A50",

                    margin: 0,

                    lineHeight: 1.5,
                  }}
                >
                  You're signed in as <strong>{roleNames[role]}</strong> (
                  {roleLabels[role]}). Any unsynchronised offline data will be
                  preserved.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#F1F0EA",

                border: "1px solid #E8E6DF",

                borderRadius: 6,

                padding: "10px 14px",

                marginBottom: 24,

                fontSize: 13,

                color: "#5C5A50",

                display: "flex",

                gap: 8,

                alignItems: "flex-start",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C897C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Offline-queued enrollment and assessment records will not be lost.
              They will sync on your next sign-in.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => void confirmSignOut()}
                disabled={isSigningOut}
                style={{
                  flex: 1,

                  height: 40,

                  background: "#4C7A6E",

                  color: "#fff",

                  border: "none",

                  borderRadius: 6,

                  fontSize: 14,

                  fontWeight: 600,

                  cursor: isSigningOut ? "wait" : "pointer",
                }}
              >
                {isSigningOut ? "Signing out..." : "Yes, Sign Out"}
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isSigningOut}
                style={{
                  height: 40,

                  padding: "0 20px",

                  background: "#fff",

                  color: "#24302E",

                  border: "1px solid #D6D3C6",

                  borderRadius: 6,

                  fontSize: 14,

                  cursor: isSigningOut ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
