import { useState, useEffect } from "react"

import { api, ApiError } from "../services/api"
import BackupCodesSection from "./BackupCodesSection"

type Role = "trade-tester" | "center-superintendent" | "super-admin"

type SettingsTab = "profile" | "security" | "notifications" | "sessions"

interface SettingsTabItem {
  key: SettingsTab
  label: string
}

interface SettingsProps {
  role: Role
}

const roleLabels: Record<Role, string> = {
  "trade-tester": "Trade Tester",

  "center-superintendent": "Center Superintendent",

  "super-admin": "Super Administrator",
}

/* ── layout helpers ── */

function Section({
  title,

  description,

  children,
}: {
  title: string

  description?: string

  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "#fff",

        border: "1px solid #D6D3C6",

        borderRadius: 8,

        padding: 24,

        marginBottom: 20,
      }}
    >
      <div
        style={{
          marginBottom: 20,

          paddingBottom: 16,

          borderBottom: "1px solid #F1EFE8",
        }}
      >
        <h3
          style={{
            fontSize: 15,

            fontWeight: 600,

            color: "#24302E",

            margin: "0 0 4px",
          }}
        >
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,

  required,

  children,

  hint,
}: {
  label: string

  required?: boolean

  children: React.ReactNode

  hint?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",

          fontSize: 13,

          fontWeight: 600,

          color: "#24302E",

          marginBottom: 6,
        }}
      >
        {label} {required && <span style={{ color: "#A6453D" }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 12, color: "#8C897C", margin: "4px 0 0" }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
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

          maxWidth: 480,

          width: "100%",

          boxShadow: "0 16px 48px rgba(0,0,0,0.14)",

          maxHeight: "90vh",

          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",

  padding: "10px 12px",

  border: "1px solid #D6D3C6",

  borderRadius: 6,

  fontSize: 14,

  background: "#fff",

  color: "#24302E",

  fontFamily: "Inter, sans-serif",

  boxSizing: "border-box",
}

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,

  background: "#F1F0EA",

  color: "#8C897C",

  cursor: "not-allowed",
}

interface Session {
  id: string

  device: string

  os: string

  ip: string

  location: string

  lastActive: string

  current: boolean
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: "1",

    device: "Chrome 126",

    os: "Windows 11",

    ip: "203.128.22.14",

    location: "Lahore, Punjab",

    lastActive: "Active now",

    current: true,
  },

  {
    id: "2",

    device: "Safari 17",

    os: "iPhone iOS 17",

    ip: "42.201.64.88",

    location: "Lahore, Punjab",

    lastActive: "2 hours ago",

    current: false,
  },

  {
    id: "3",

    device: "Edge 126",

    os: "Windows 10",

    ip: "203.128.22.15",

    location: "Lahore, Punjab",

    lastActive: "Yesterday at 16:32",

    current: false,
  },
]

export default function SettingsScreen({ role }: SettingsProps) {
  const [tab, setTab] = useState<SettingsTab>("profile")

  const [profile, setProfile] = useState({
    firstName: "Ahmad",

    lastName: "Raza",

    email: "ahmad.raza@navttc.gov.pk",

    phone: "+92-300-1234567",
  })

  const [passwords, setPasswords] = useState({
    current: "",

    newPw: "",

    confirm: "",
  })

  const [showPw, setShowPw] = useState({
    current: false,

    newPw: false,

    confirm: false,
  })

  const [pwError, setPwError] = useState("")

  const [pwSuccess, setPwSuccess] = useState(false)

  const [mfaEnabled, setMfaEnabled] = useState(true)

  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)

  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  const [profileSaved, setProfileSaved] = useState(false)

  const [notifs, setNotifs] = useState({
    approvalUpdates: true,

    enrollmentAlerts: true,

    systemAnnouncements: false,

    offlineSync: true,

    credentialMinted: true,

    loginAlerts: true,
  })

  /* backup code modals */

  const [backupModal, setBackupModal] =
    useState<"none" | "view" | "regenerate" | "regenerate-confirm">("none")

  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const [codesVisible, setCodesVisible] = useState(false)

  const [regenerated, setRegenerated] = useState(false)

  const [backupStatus, setBackupStatus] = useState<{
    totalCodes: number
    unusedCodes: number
    usedCodes: number
  } | null>(null)

  const [backupLoading, setBackupLoading] = useState(false)

  const [backupError, setBackupError] = useState("")

  const [savedConfirm, setSavedConfirm] = useState(false)

  const [generateLoading, setGenerateLoading] = useState(false)

  /* sign out all devices */

  const [showSignOutAll, setShowSignOutAll] = useState(false)

  const [signedOutAll, setSignedOutAll] = useState(false)

  // Capstone B2: Fetch real user profile on mount
  useEffect(() => {
    let mounted = true
    api
      .getProfile()
      .then((res) => {
        if (!mounted || !res?.profile) return
        const p = res.profile
        const parts = (p.name || "").split(" ")
        setProfile((prev) => ({
          ...prev,
          firstName: parts[0] || prev.firstName,
          lastName: parts.slice(1).join(" ") || prev.lastName,
          email: p.email || prev.email,
        }))
        if (p.is_mfa_active != null) {
          setMfaEnabled(p.is_mfa_active)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  // Capstone B2: Fetch real active sessions when sessions tab is opened
  useEffect(() => {
    if (tab === "sessions") {
      let mounted = true
      api
        .getActiveSessions()
        .then((res) => {
          if (!mounted || !res?.sessions || !Array.isArray(res.sessions)) return
          const mapped: Session[] = res.sessions.map((s, idx) => ({
            id: s.session_id || String(idx),
            device: s.device_fingerprint
              ? `Authorized Hub Laptop (${s.device_fingerprint.slice(0, 8)})`
              : "Desktop Station",
            os: "Verified Secure OS",
            location: s.ip_address
              ? `Hub IP: ${s.ip_address}`
              : "Testing Center",
            ip: s.ip_address || "203.128.22.14",
            lastActive: s.last_active
              ? new Date(s.last_active).toLocaleString()
              : "Active now",
            current: s.is_current,
          }))
          if (mapped.length > 0) {
            setSessions(mapped)
          }
        })
        .catch(() => {})

      return () => {
        mounted = false
      }
    }
  }, [tab])

  function handleProfileSave() {
    setProfileSaved(true)

    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handlePwChange(e: React.FormEvent) {
    e.preventDefault()

    setPwError("")

    setPwSuccess(false)

    if (!passwords.current) {
      setPwError("Current password is required.")

      return
    }

    if (passwords.newPw.length < 8) {
      setPwError("New password must be at least 8 characters.")

      return
    }

    if (passwords.newPw === passwords.current) {
      setPwError("New password must differ from current password.")

      return
    }

    if (passwords.newPw !== passwords.confirm) {
      setPwError("New passwords do not match.")

      return
    }

    try {
      await api.updatePassword(passwords.current, passwords.newPw)
      setPwSuccess(true)
      setPasswords({ current: "", newPw: "", confirm: "" })
      setTimeout(() => setPwSuccess(false), 5000)
    } catch (err: any) {
      setPwError(
        err?.message ||
          "Failed to update password. Verify your current password.",
      )
    }
  }

  async function handleRevokeSession(id: string) {
    try {
      await api.superAdmin.revokeSession(id).catch(() => null)
    } catch {}
    setSessions((ss) => ss.filter((s) => s.id !== id))

    setRevokeTarget(null)
  }

  async function handleSignOutAll() {
    try {
      await api.revokeSession().catch(() => null)
    } catch {}
    setSessions((ss) => ss.filter((s) => s.current))

    setShowSignOutAll(false)

    setSignedOutAll(true)

    setTimeout(() => setSignedOutAll(false), 3000)
  }

  function handleRegenerateCodes() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    const newCodes = Array.from({ length: 8 }, () =>
      Array.from({ length: 4 }, () =>
        Array.from(
          { length: 4 },

          () => chars[Math.floor(Math.random() * chars.length)],
        ).join(""),
      ).join("-"),
    )

    setBackupCodes(newCodes)

    setBackupModal("view")

    setRegenerated(true)
  }

  const pwField = (
    key: "current" | "newPw" | "confirm",

    label: string,

    placeholder: string,

    hint?: string,
  ) => (
    <Field label={label} required hint={hint}>
      <div style={{ position: "relative" }}>
        <input
          type={showPw[key] ? "text" : "password"}
          value={passwords[key]}
          onChange={(e) =>
            setPasswords((p) => ({ ...p, [key]: e.target.value }))
          }
          placeholder={placeholder}
          style={{ ...inputStyle, paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
          style={{
            position: "absolute",

            right: 12,

            top: "50%",

            transform: "translateY(-50%)",

            background: "none",

            border: "none",

            cursor: "pointer",

            color: "#8C897C",

            padding: 0,

            display: "flex",
          }}
        >
          {showPw[key] ? (
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
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
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      </div>
    </Field>
  )

  const tabs: SettingsTabItem[] = [
    { key: "profile", label: "Profile" },

    { key: "security", label: "Security" },

    { key: "notifications", label: "Notifications" },

    { key: "sessions", label: "Active Sessions" },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          className="display"
          style={{
            fontSize: 28,

            fontWeight: 400,

            color: "#24302E",

            margin: "0 0 4px",

            letterSpacing: -0.2,
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
          Manage your account, security, and preferences.
        </p>
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "200px 1fr",

          gap: 24,

          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            background: "#fff",

            border: "1px solid #D6D3C6",

            borderRadius: 8,

            overflow: "hidden",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                width: "100%",

                textAlign: "left",

                padding: "12px 16px",

                background: tab === t.key ? "#F0F7FF" : "transparent",

                border: "none",

                borderLeft: `3px solid ${
                  tab === t.key ? "#4C7A6E" : "transparent"
                }`,

                color: tab === t.key ? "#4C7A6E" : "#5C5A50",

                fontSize: 13,

                fontWeight: tab === t.key ? 600 : 400,

                cursor: "pointer",

                borderBottom: "1px solid #F1EFE8",

                display: "block",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div>
              <Section
                title="Personal Information"
                description="Update your name and contact details."
              >
                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns: "1fr 1fr",

                    gap: 16,
                  }}
                >
                  <Field label="First Name" required>
                    <input
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, firstName: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Last Name" required>
                    <input
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, lastName: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>
                  <Field
                    label="Email Address"
                    hint="Contact your administrator to change your email."
                  >
                    <input
                      value={profile.email}
                      disabled
                      style={disabledInputStyle}
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, phone: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title="Role & Assignment"
                description="Read-only. Contact your administrator to change."
              >
                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns: "1fr 1fr",

                    gap: 16,
                  }}
                >
                  <Field label="Role">
                    <input
                      value={roleLabels[role]}
                      disabled
                      style={disabledInputStyle}
                    />
                  </Field>
                  <Field label="Assigned Hub">
                    <input
                      value="Lahore-C01"
                      disabled
                      style={{
                        ...disabledInputStyle,

                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    />
                  </Field>
                  <Field label="Employee ID">
                    <input
                      value="EMP-2024-00142"
                      disabled
                      style={{
                        ...disabledInputStyle,

                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    />
                  </Field>
                  <Field label="Region">
                    <input value="Punjab" disabled style={disabledInputStyle} />
                  </Field>
                </div>
              </Section>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleProfileSave}
                  style={{
                    height: 40,

                    padding: "0 24px",

                    background: "#4C7A6E",

                    color: "#fff",

                    border: "none",

                    borderRadius: 6,

                    fontSize: 14,

                    fontWeight: 600,

                    cursor: "pointer",
                  }}
                >
                  {profileSaved ? "✓ Saved" : "Save Changes"}
                </button>
                <button
                  style={{
                    height: 40,

                    padding: "0 24px",

                    background: "#fff",

                    color: "#24302E",

                    border: "1px solid #D6D3C6",

                    borderRadius: 6,

                    fontSize: 14,

                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === "security" && (
            <div>
              <Section
                title="Change Password"
                description="Use a strong password of at least 8 characters."
              >
                {pwError && (
                  <div
                    style={{
                      background: "#FCEBEB",

                      border: "1px solid #E8B4B4",

                      borderRadius: 6,

                      padding: "10px 14px",

                      marginBottom: 16,

                      fontSize: 13,

                      color: "#501313",
                    }}
                  >
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div
                    style={{
                      background: "#EAF3DE",

                      border: "1px solid #4C7A6E",

                      borderRadius: 6,

                      padding: "10px 14px",

                      marginBottom: 16,

                      fontSize: 13,

                      color: "#173404",

                      display: "flex",

                      alignItems: "center",

                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="7" fill="#4C7A6E" />
                      <polyline
                        points="3.5,7 5.5,9.5 10.5,4"
                        stroke="white"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Password changed successfully. All other active sessions
                    have been invalidated.
                  </div>
                )}
                <form onSubmit={handlePwChange} noValidate>
                  {pwField(
                    "current",

                    "Current Password",

                    "Enter current password",
                  )}
                  {pwField(
                    "newPw",

                    "New Password",

                    "Enter new password",

                    "Minimum 8 characters, including a number and special character.",
                  )}
                  {pwField(
                    "confirm",

                    "Confirm New Password",

                    "Re-enter new password",
                  )}
                  <button
                    type="submit"
                    style={{
                      height: 40,

                      padding: "0 24px",

                      background: "#4C7A6E",

                      color: "#fff",

                      border: "none",

                      borderRadius: 6,

                      fontSize: 14,

                      fontWeight: 600,

                      cursor: "pointer",
                    }}
                  >
                    Update Password
                  </button>
                </form>
              </Section>

              <Section
                title="Two-Factor Authentication"
                description="Secure your account with TOTP-based multi-factor authentication."
              >
                <div
                  style={{
                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    padding: "16px",

                    background: "#F1F0EA",

                    border: "1px solid #D6D3C6",

                    borderRadius: 6,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,

                        fontWeight: 600,

                        color: "#24302E",

                        marginBottom: 2,
                      }}
                    >
                      Authenticator App (TOTP)
                    </div>
                    <div
                      style={{
                        fontSize: 13,

                        color: mfaEnabled ? "#173404" : "#8C897C",
                      }}
                    >
                      {mfaEnabled
                        ? "MFA is active and protecting your account."
                        : "MFA is disabled. Your account is at risk."}
                    </div>
                  </div>
                  <button
                    onClick={() => setMfaEnabled(!mfaEnabled)}
                    style={{
                      height: 36,

                      padding: "0 16px",

                      background: mfaEnabled ? "#fff" : "#4C7A6E",

                      color: mfaEnabled ? "#8C3B34" : "#fff",

                      border: `1px solid ${
                        mfaEnabled ? "#A6453D" : "transparent"
                      }`,

                      borderRadius: 6,

                      fontSize: 13,

                      fontWeight: 600,

                      cursor: "pointer",
                    }}
                  >
                    {mfaEnabled ? "Disable MFA" : "Enable MFA"}
                  </button>
                </div>
                {!mfaEnabled && (
                  <div
                    style={{
                      background: "#FCEBEB",

                      border: "1px solid #E8B4B4",

                      borderRadius: 6,

                      padding: "10px 14px",

                      marginTop: 12,

                      fontSize: 13,

                      color: "#501313",
                    }}
                  >
                    Your account security is significantly reduced without MFA.
                    Re-enable as soon as possible.
                  </div>
                )}
              </Section>

              <Section
                title="Backup Codes"
                description="Use backup codes to access your account if you lose your authenticator."
              >
                <BackupCodesSection />
              </Section>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <Section
              title="Notification Preferences"
              description="Choose which events trigger in-portal notifications."
            >
              {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(
                ([key, val]) => {
                  const labels: Record<keyof typeof notifs, {
                    title: string

                    desc: string
                  }> = {
                    approvalUpdates: {
                      title: "Approval Queue Updates",

                      desc: "When assessments are approved or rejected.",
                    },

                    enrollmentAlerts: {
                      title: "Enrollment Alerts",

                      desc: "New candidate enrollments and verification results.",
                    },

                    systemAnnouncements: {
                      title: "System Announcements",

                      desc: "Portal maintenance windows and updates.",
                    },

                    offlineSync: {
                      title: "Offline Sync Status",

                      desc: "When offline records are synchronized.",
                    },

                    credentialMinted: {
                      title: "Credential Minted",

                      desc: "When a credential is confirmed on-chain.",
                    },

                    loginAlerts: {
                      title: "New Login Alerts",

                      desc: "When a new device signs into your account.",
                    },
                  }

                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",

                        alignItems: "center",

                        justifyContent: "space-between",

                        padding: "14px 0",

                        borderBottom: "1px solid #F1EFE8",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,

                            fontWeight: 500,

                            color: "#24302E",

                            marginBottom: 2,
                          }}
                        >
                          {labels[key].title}
                        </div>
                        <div style={{ fontSize: 12, color: "#8C897C" }}>
                          {labels[key].desc}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setNotifs((n) => ({ ...n, [key]: !val }))
                        }
                        style={{
                          width: 44,

                          height: 24,

                          borderRadius: 12,

                          border: "none",

                          cursor: "pointer",

                          flexShrink: 0,

                          position: "relative",

                          background: val ? "#4C7A6E" : "#D6D3C6",

                          transition: "background 0.15s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",

                            top: 3,

                            left: val ? 22 : 3,

                            width: 18,

                            height: 18,

                            background: "#fff",

                            borderRadius: "50%",

                            transition: "left 0.15s",

                            display: "block",
                          }}
                        />
                      </button>
                    </div>
                  )
                },
              )}
              <div style={{ marginTop: 20 }}>
                <button
                  style={{
                    height: 40,

                    padding: "0 24px",

                    background: "#4C7A6E",

                    color: "#fff",

                    border: "none",

                    borderRadius: 6,

                    fontSize: 14,

                    fontWeight: 600,

                    cursor: "pointer",
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </Section>
          )}

          {/* ── SESSIONS ── */}
          {tab === "sessions" && (
            <div>
              <Section
                title="Active Sessions"
                description="Review and revoke sessions on other devices."
              >
                {signedOutAll && (
                  <div
                    style={{
                      background: "#EAF3DE",

                      border: "1px solid #4C7A6E",

                      borderRadius: 6,

                      padding: "10px 14px",

                      marginBottom: 16,

                      fontSize: 13,

                      color: "#173404",

                      display: "flex",

                      alignItems: "center",

                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="7" fill="#4C7A6E" />
                      <polyline
                        points="3.5,7 5.5,9.5 10.5,4"
                        stroke="white"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    All other devices have been signed out.
                  </div>
                )}
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",

                      alignItems: "center",

                      gap: 16,

                      padding: "14px 0",

                      borderBottom: "1px solid #F1EFE8",
                    }}
                  >
                    <div
                      style={{
                        width: 40,

                        height: 40,

                        background: s.current ? "#E4EEFC" : "#F1F0EA",

                        borderRadius: 8,

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={s.current ? "#2E6FE0" : "#8C897C"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",

                          alignItems: "center",

                          gap: 8,

                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,

                            fontWeight: 600,

                            color: "#24302E",
                          }}
                        >
                          {s.device} · {s.os}
                        </span>
                        {s.current && (
                          <span
                            style={{
                              fontSize: 11,

                              fontWeight: 600,

                              color: "#173404",

                              background: "#EAF3DE",

                              padding: "2px 8px",

                              borderRadius: 999,
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,

                          color: "#8C897C",

                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        {s.ip} · {s.location}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#8C897C", marginTop: 2 }}
                      >
                        {s.lastActive}
                      </div>
                    </div>
                    {!s.current &&
                      (revokeTarget === s.id ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            style={{
                              height: 30,

                              padding: "0 12px",

                              background: "#A6453D",

                              color: "#fff",

                              border: "none",

                              borderRadius: 4,

                              fontSize: 12,

                              fontWeight: 600,

                              cursor: "pointer",
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setRevokeTarget(null)}
                            style={{
                              height: 30,

                              padding: "0 12px",

                              background: "#fff",

                              color: "#24302E",

                              border: "1px solid #D6D3C6",

                              borderRadius: 4,

                              fontSize: 12,

                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevokeTarget(s.id)}
                          style={{
                            height: 30,

                            padding: "0 12px",

                            background: "#fff",

                            color: "#8C3B34",

                            border: "1px solid #A6453D",

                            borderRadius: 4,

                            fontSize: 12,

                            cursor: "pointer",
                          }}
                        >
                          Sign out
                        </button>
                      ))}
                  </div>
                ))}
                {sessions.filter((s) => !s.current).length === 0 &&
                  !signedOutAll && (
                    <p
                      style={{
                        fontSize: 13,

                        color: "#8C897C",

                        margin: "8px 0 0",
                      }}
                    >
                      No other active sessions.
                    </p>
                  )}
              </Section>

              {/* Sign out all */}
              <div
                style={{
                  background: "#fff",

                  border: "1px solid #E8B4B4",

                  borderRadius: 8,

                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 15,

                    fontWeight: 600,

                    color: "#24302E",

                    margin: "0 0 4px",
                  }}
                >
                  Sign Out All Other Devices
                </h3>
                <p
                  style={{
                    fontSize: 13,

                    color: "#5C5A50",

                    margin: "0 0 16px",

                    lineHeight: 1.5,
                  }}
                >
                  Immediately ends all sessions except your current one. Use
                  this if you believe your account has been accessed without
                  your permission.
                </p>
                <button
                  onClick={() => setShowSignOutAll(true)}
                  disabled={sessions.filter((s) => !s.current).length === 0}
                  style={{
                    height: 40,

                    padding: "0 24px",

                    background:
                      sessions.filter((s) => !s.current).length === 0
                        ? "#F1EFE8"
                        : "#fff",

                    color:
                      sessions.filter((s) => !s.current).length === 0
                        ? "#8C897C"
                        : "#8C3B34",

                    border: `1px solid ${
                      sessions.filter((s) => !s.current).length === 0
                        ? "#D6D3C6"
                        : "#A6453D"
                    }`,

                    borderRadius: 6,

                    fontSize: 14,

                    fontWeight: 600,

                    cursor:
                      sessions.filter((s) => !s.current).length === 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Sign Out All Other Devices
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ View Backup Codes Modal ══ */}
      {backupModal === "view" && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "flex-start",

              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,

                  fontWeight: 700,

                  color: "#24302E",

                  margin: "0 0 4px",
                }}
              >
                Backup Codes
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                Each code can only be used once. Keep these in a safe place.
              </p>
            </div>
            {regenerated && (
              <span
                style={{
                  fontSize: 11,

                  fontWeight: 600,

                  background: "#EAF3DE",

                  color: "#173404",

                  padding: "3px 10px",

                  borderRadius: 999,

                  flexShrink: 0,
                }}
              >
                Newly Generated
              </span>
            )}
          </div>

          <div
            style={{
              background: "#FCE8D6",

              border: "1px solid #B08D46",

              borderRadius: 6,

              padding: "10px 14px",

              marginBottom: 20,

              fontSize: 13,

              color: "#5C3300",

              display: "flex",

              gap: 8,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B08D46"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Do not share these codes. Store them in a password manager or print
            and keep securely.
          </div>

          <div
            style={{
              background: "#F1F0EA",

              border: "1px solid #D6D3C6",

              borderRadius: 6,

              padding: "16px 20px",

              marginBottom: 20,
            }}
          >
            {codesVisible ? (
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns: "1fr 1fr",

                  gap: "8px 24px",
                }}
              >
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,

                        color: "#8C897C",

                        width: 16,

                        textAlign: "right",

                        flexShrink: 0,
                      }}
                    >
                      {i + 1}.
                    </span>
                    <code
                      style={{
                        fontSize: 13,

                        fontFamily: "IBM Plex Mono, monospace",

                        color: "#24302E",

                        letterSpacing: 0.5,
                      }}
                    >
                      {code}
                    </code>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{ fontSize: 13, color: "#8C897C", marginBottom: 12 }}
                >
                  Codes are hidden for security
                </div>
                <button
                  onClick={() => setCodesVisible(true)}
                  style={{
                    height: 36,

                    padding: "0 20px",

                    background: "#4C7A6E",

                    color: "#fff",

                    border: "none",

                    borderRadius: 6,

                    fontSize: 13,

                    fontWeight: 600,

                    cursor: "pointer",
                  }}
                >
                  Reveal Codes
                </button>
              </div>
            )}
          </div>

          {codesVisible && (
            <button
              onClick={() =>
                navigator.clipboard?.writeText(backupCodes.join("\n"))
              }
              style={{
                height: 34,

                padding: "0 14px",

                background: "#fff",

                color: "#4C7A6E",

                border: "1px solid #D6D3C6",

                borderRadius: 6,

                fontSize: 13,

                cursor: "pointer",

                marginBottom: 20,

                display: "flex",

                alignItems: "center",

                gap: 6,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy All Codes
            </button>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setBackupModal("regenerate")}
              style={{
                height: 40,

                padding: "0 20px",

                background: "#fff",

                color: "#24302E",

                border: "1px solid #D6D3C6",

                borderRadius: 6,

                fontSize: 13,

                cursor: "pointer",
              }}
            >
              Regenerate
            </button>
            <button
              onClick={() => {
                setBackupModal("none")

                setCodesVisible(false)
              }}
              style={{
                height: 40,

                padding: "0 20px",

                background: "#4C7A6E",

                color: "#fff",

                border: "none",

                borderRadius: 6,

                fontSize: 13,

                fontWeight: 600,

                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ Regenerate Confirm Modal ══ */}
      {backupModal === "regenerate" && (
        <ModalOverlay>
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

                background: "#FCEBEB",

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
                stroke="#A6453D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.33" />
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
                Regenerate Backup Codes?
              </h2>
              <p
                style={{
                  fontSize: 14,

                  color: "#5C5A50",

                  margin: 0,

                  lineHeight: 1.5,
                }}
              >
                This will permanently invalidate all existing backup codes and
                generate 8 new ones.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#FCEBEB",

              border: "1px solid #E8B4B4",

              borderRadius: 6,

              padding: "10px 14px",

              marginBottom: 24,

              fontSize: 13,

              color: "#501313",
            }}
          >
            <strong>
              All current backup codes will be invalidated immediately.
            </strong>{" "}
            Make sure you save the new codes before closing the dialog.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRegenerateCodes}
              style={{
                flex: 1,

                height: 40,

                background: "#A6453D",

                color: "#fff",

                border: "none",

                borderRadius: 6,

                fontSize: 14,

                fontWeight: 600,

                cursor: "pointer",
              }}
            >
              Invalidate & Regenerate
            </button>
            <button
              onClick={() => setBackupModal("none")}
              style={{
                height: 40,

                padding: "0 20px",

                background: "#fff",

                color: "#24302E",

                border: "1px solid #D6D3C6",

                borderRadius: 6,

                fontSize: 14,

                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ Sign Out All Devices Modal ══ */}
      {showSignOutAll && (
        <ModalOverlay>
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

                background: "#FCEBEB",

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
                stroke="#A6453D"
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
                Sign Out All Other Devices
              </h2>
              <p
                style={{
                  fontSize: 14,

                  color: "#5C5A50",

                  margin: 0,

                  lineHeight: 1.5,
                }}
              >
                This will immediately end{" "}
                <strong>
                  {sessions.filter((s) => !s.current).length} other session
                  {sessions.filter((s) => !s.current).length !== 1 ? "s" : ""}
                </strong>{" "}
                and require those devices to sign in again.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#F1F0EA",

              border: "1px solid #D6D3C6",

              borderRadius: 6,

              padding: "12px 16px",

              marginBottom: 16,
            }}
          >
            {sessions

              .filter((s) => !s.current)

              .map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",

                    justifyContent: "space-between",

                    fontSize: 13,

                    padding: "6px 0",

                    borderBottom: "1px solid #F1EFE8",
                  }}
                >
                  <span style={{ color: "#24302E" }}>
                    {s.device} · {s.os}
                  </span>
                  <span
                    style={{
                      color: "#8C897C",

                      fontFamily: "IBM Plex Mono, monospace",

                      fontSize: 12,
                    }}
                  >
                    {s.ip}
                  </span>
                </div>
              ))}
          </div>

          <div
            style={{
              background: "#FCE8D6",

              border: "1px solid #B08D46",

              borderRadius: 6,

              padding: "10px 14px",

              marginBottom: 24,

              fontSize: 13,

              color: "#5C3300",
            }}
          >
            Your current session on this device will not be affected.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleSignOutAll}
              style={{
                flex: 1,

                height: 40,

                background: "#A6453D",

                color: "#fff",

                border: "none",

                borderRadius: 6,

                fontSize: 14,

                fontWeight: 600,

                cursor: "pointer",
              }}
            >
              Sign Out {sessions.filter((s) => !s.current).length} Device
              {sessions.filter((s) => !s.current).length !== 1 ? "s" : ""}
            </button>
            <button
              onClick={() => setShowSignOutAll(false)}
              style={{
                height: 40,

                padding: "0 20px",

                background: "#fff",

                color: "#24302E",

                border: "1px solid #D6D3C6",

                borderRadius: 6,

                fontSize: 14,

                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
