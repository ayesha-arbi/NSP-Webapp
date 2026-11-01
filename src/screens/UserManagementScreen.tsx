import { useState, useMemo, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { superAdminApi } from "../services/superAdmin"
import Select from "@/components/Select"

/* ── Types ── */
type UserRole = "trade-tester" | "center-superintendent" | "super-admin"
type AcctStatus = "active" | "locked"
type MfaStatus = "enabled" | "disabled" | "pending-reset"
type ModalType = "none" | "create" | "edit" | "lock" | "unlock" | "mfa-reset" | "revoke-session" | "provision-mfa-qr"
type Tab = "users" | "audit"

interface UserSession {
  id: string
  device: string
  ip: string
  lastActive: string
  location: string
}

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  hub: string
  status: AcctStatus
  mfa: MfaStatus
  lastLogin: string
  createdAt: string
  lockReason?: string
  lockedBy?: string
  session?: UserSession
}

interface AuditEntry {
  id: string
  action: string
  admin: string
  affectedUser: string
  timestamp: string
  result: "success" | "failure"
}

/* ── Initial data ── */
const INITIAL_USERS: User[] = [
  {
    id: "u1",
    name: "Ahmad Raza",
    email: "ahmad.raza@navttc.gov.pk",
    role: "trade-tester",
    hub: "Lahore-C01",
    status: "active",
    mfa: "enabled",
    lastLogin: "2026-08-27 09:58",
    createdAt: "2026-01-15",
    session: {
      id: "s1",
      device: "Chrome 126 · Windows 11",
      ip: "203.128.22.14",
      lastActive: "Active now",
      location: "Lahore, Punjab",
    },
  },
  {
    id: "u2",
    name: "Fatima Malik",
    email: "fatima.malik@navttc.gov.pk",
    role: "center-superintendent",
    hub: "Lahore-C01",
    status: "active",
    mfa: "enabled",
    lastLogin: "2026-08-27 08:30",
    createdAt: "2026-01-15",
    session: {
      id: "s2",
      device: "Edge 126 · Windows 10",
      ip: "203.128.22.15",
      lastActive: "2 hrs ago",
      location: "Lahore, Punjab",
    },
  },
  {
    id: "u3",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@navttc.gov.pk",
    role: "trade-tester",
    hub: "Karachi-C02",
    status: "active",
    mfa: "enabled",
    lastLogin: "2026-08-27 10:12",
    createdAt: "2026-01-20",
    session: {
      id: "s3",
      device: "Chrome 126 · macOS",
      ip: "42.201.64.88",
      lastActive: "18 min ago",
      location: "Karachi, Sindh",
    },
  },
  {
    id: "u4",
    name: "Ali Hassan",
    email: "ali.hassan@navttc.gov.pk",
    role: "center-superintendent",
    hub: "Karachi-C02",
    status: "active",
    mfa: "disabled",
    lastLogin: "2026-08-26 17:45",
    createdAt: "2026-01-20",
  },
  {
    id: "u5",
    name: "Sana Malik",
    email: "sana.malik@navttc.gov.pk",
    role: "trade-tester",
    hub: "Islamabad-C03",
    status: "active",
    mfa: "disabled",
    lastLogin: "2026-08-27 09:05",
    createdAt: "2026-02-03",
    session: {
      id: "s5",
      device: "Firefox 128 · Ubuntu",
      ip: "119.155.30.44",
      lastActive: "1 hr ago",
      location: "Islamabad",
    },
  },
  {
    id: "u6",
    name: "Usman Tariq",
    email: "usman.tariq@navttc.gov.pk",
    role: "center-superintendent",
    hub: "Islamabad-C03",
    status: "active",
    mfa: "enabled",
    lastLogin: "2026-08-26 15:20",
    createdAt: "2026-02-03",
  },
  {
    id: "u7",
    name: "Khalid Mehmood",
    email: "khalid.mehmood@navttc.gov.pk",
    role: "trade-tester",
    hub: "Peshawar-C04",
    status: "locked",
    mfa: "enabled",
    lastLogin: "2026-08-25 14:10",
    createdAt: "2026-02-10",
    lockReason: "Automatic lock — 5 consecutive failed login attempts.",
    lockedBy: "System",
  },
  {
    id: "u8",
    name: "Nadia Hussain",
    email: "nadia.hussain@navttc.gov.pk",
    role: "trade-tester",
    hub: "Quetta-C05",
    status: "active",
    mfa: "enabled",
    lastLogin: "2026-08-27 07:48",
    createdAt: "2026-02-14",
    session: {
      id: "s8",
      device: "Chrome 126 · Android",
      ip: "103.55.68.22",
      lastActive: "3 hrs ago",
      location: "Quetta, Balochistan",
    },
  },
  {
    id: "u9",
    name: "Raheela Qasim",
    email: "raheela.qasim@navttc.gov.pk",
    role: "trade-tester",
    hub: "Quetta-C05",
    status: "locked",
    mfa: "pending-reset",
    lastLogin: "2026-08-22 11:30",
    createdAt: "2026-03-01",
    lockReason: "Locked by administrator pending identity re-verification.",
    lockedBy: "Zara Khan",
  },
  {
    id: "u10",
    name: "Zara Khan",
    email: "zara.khan@navttc.gov.pk",
    role: "super-admin",
    hub: "—",
    status: "active",
    mfa: "enabled",
    lastLogin: "2026-08-27 09:58",
    createdAt: "2026-01-01",
    session: {
      id: "s10",
      device: "Chrome 126 · Windows 11",
      ip: "203.128.22.20",
      lastActive: "Active now",
      location: "Islamabad",
    },
  },
]

const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    action: "Account locked — 5 failed login attempts",
    admin: "System",
    affectedUser: "Khalid Mehmood",
    timestamp: "2026-08-25 14:15",
    result: "success",
  },
  {
    id: "a2",
    action: "Account locked by administrator",
    admin: "Zara Khan",
    affectedUser: "Raheela Qasim",
    timestamp: "2026-08-24 09:30",
    result: "success",
  },
  {
    id: "a3",
    action: "MFA reset initiated",
    admin: "Zara Khan",
    affectedUser: "Ali Hassan",
    timestamp: "2026-08-20 11:45",
    result: "success",
  },
  {
    id: "a4",
    action: "Session force-revoked",
    admin: "Zara Khan",
    affectedUser: "Sana Malik",
    timestamp: "2026-08-18 16:00",
    result: "success",
  },
  {
    id: "a5",
    action: "User created",
    admin: "Zara Khan",
    affectedUser: "Nadia Hussain",
    timestamp: "2026-02-14 10:00",
    result: "success",
  },
]

/* ── Constants ── */
const ROLE_LABELS: Record<UserRole, string> = {
  "trade-tester": "Trade Tester",
  "center-superintendent": "Center Superintendent",
  "super-admin": "Super Admin",
}
const HUBS = [
  "Lahore-C01",
  "Karachi-C02",
  "Islamabad-C03",
  "Peshawar-C04",
  "Quetta-C05",
]
const ROLES: UserRole[] = [
  "trade-tester",
  "center-superintendent",
  "super-admin",
]

/* ── Helpers ── */
const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #D6D3C6",
  borderRadius: 6,
  fontSize: 13,
  color: "#24302E",
  fontFamily: "Inter, sans-serif",
  background: "#fff",
  boxSizing: "border-box",
}
const PILL: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0 12px",
  height: 32,
  background: "#E4E2D9",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "Inter, sans-serif",
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
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#24302E",
          marginBottom: 5,
        }}
      >
        {label}
        {required && <span style={{ color: "#A6453D" }}> *</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11.5, color: "#8C897C", margin: "4px 0 0" }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function ModalOverlay({
  children,
  wide,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
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
          maxWidth: wide ? 580 : 480,
          width: "100%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Screen ── */
export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [audit, setAudit] = useState<AuditEntry[]>(INITIAL_AUDIT)
  const [tab, setTab] = useState<Tab>("users")
  const [search, setSearch] = useState("")
  const [roleF, setRoleF] = useState("All Roles")
  const [hubF, setHubF] = useState("All Hubs")
  const [statusF, setStatusF] = useState("All")
  const [mfaF, setMfaF] = useState("All")
  const [modal, setModal] = useState<ModalType>("none")
  const [target, setTarget] = useState<User | null>(null)

  /* form state */
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "trade-tester" as UserRole,
    hub: "Lahore-C01",
    mfaRequired: true,
  })
  const [lockReason, setLockReason] = useState("")
  const [mfaReason, setMfaReason] = useState("")
  const [mfaVerified, setMfaVerified] = useState(false)
  const [formError, setFormError] = useState("")
  const [provisionMfaData, setProvisionMfaData] = useState<{
    email: string
    name: string
    secret: string
    otpauthUrl: string
  } | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  useEffect(() => {
    let mounted = true
    superAdminApi.getUsers()
      .then((res) => {
        if (!mounted || !res || !res.users || res.users.length === 0) return
        const mapped: User[] = res.users.map((hu) => {
          let role: UserRole = "trade-tester"
          if (hu.role === "CENTER_SUPERINTENDENT") role = "center-superintendent"
          else if (hu.role === "SUPER_ADMIN") role = "super-admin"
          return {
            id: hu.id || hu.userId,
            name: hu.name || hu.email.split("@")[0],
            email: hu.email,
            role,
            hub: hu.hubName || (hu.hubLocationId ? `Hub-${hu.hubLocationId}` : "—"),
            status: (hu.isLocked || hu.adminLocked) ? "locked" : "active",
            mfa: (hu.mfaEnabled || hu.isMfaActive) ? "enabled" : (hu.mfaEnrollmentPending ? "pending-reset" : "disabled"),
            lastLogin: hu.lastLoginAt ? new Date(hu.lastLoginAt).toLocaleString("sv").slice(0, 16) : "Never",
            createdAt: hu.createdAt ? hu.createdAt.slice(0, 10) : "2026-01-01",
          }
        })
        setUsers(mapped)
      })
      .catch((err) => {
        console.warn("superAdminApi.getUsers offline note:", err?.message)
      })
    return () => {
      mounted = false
    }
  }, [])

  function addAudit(
    action: string,
    affectedUser: string,
    result: "success" | "failure" = "success",
  ) {
    const now = new Date().toLocaleString("sv").replace("T", " ").slice(0, 16)
    setAudit((a) => [
      {
        id: `a${Date.now()}`,
        action,
        admin: "Zara Khan",
        affectedUser,
        timestamp: now,
        result,
      },
      ...a,
    ])
  }

  function openCreate() {
    setForm({
      name: "",
      email: "",
      role: "trade-tester",
      hub: "Lahore-C01",
      mfaRequired: true,
    })
    setFormError("")
    setModal("create")
  }

  function openEdit(u: User) {
    setTarget(u)
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      hub: u.hub === "—" ? "Lahore-C01" : u.hub,
      mfaRequired: u.mfa !== "disabled",
    })
    setFormError("")
    setModal("edit")
  }

  function openLock(u: User) {
    setTarget(u)
    setLockReason("")
    setModal("lock")
  }
  function openUnlock(u: User) {
    setTarget(u)
    setModal("unlock")
  }
  function openMfaReset(u: User) {
    setTarget(u)
    setMfaReason("")
    setMfaVerified(false)
    setModal("mfa-reset")
  }
  function openRevokeSession(u: User) {
    setTarget(u)
    setModal("revoke-session")
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.")
      return
    }
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(form.email)) {
      setFormError("Enter a valid email address.")
      return
    }
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setFormError("A user with this email already exists.")
      return
    }
    const now = new Date().toISOString().slice(0, 10)
    const hubIdx = HUBS.indexOf(form.hub)
    const hubLocationId = form.role === "super-admin" ? undefined : (hubIdx >= 0 ? hubIdx + 1 : 1)
    const apiRole = form.role === "trade-tester" ? "TRADE_TESTER" : form.role === "center-superintendent" ? "CENTER_SUPERINTENDENT" : "SUPER_ADMIN"

    let mfaEnroll: { secret: string; otpauthUrl: string } | undefined

    try {
      const res = await superAdminApi.createUser({
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        role: apiRole,
        hubLocationId,
      })
      if (res?.mfaEnrollment) {
        mfaEnroll = res.mfaEnrollment
      }
    } catch (err: any) {
      console.warn("superAdminApi.createUser offline fallback:", err?.message)
    }

    const newUser: User = {
      id: `u${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      hub: form.role === "super-admin" ? "—" : form.hub,
      status: "active",
      mfa: form.mfaRequired ? "pending-reset" : "disabled",
      lastLogin: "Never",
      createdAt: now,
    }
    setUsers((u) => [...u, newUser])
    addAudit("User created", form.name.trim())

    if (mfaEnroll) {
      setProvisionMfaData({
        email: newUser.email,
        name: newUser.name,
        secret: mfaEnroll.secret,
        otpauthUrl: mfaEnroll.otpauthUrl,
      })
      setCopiedKey(false)
      setModal("provision-mfa-qr")
    } else {
      setModal("none")
    }
  }

  function handleEdit() {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.")
      return
    }
    if (!target) return
    setUsers((us) =>
      us.map((u) =>
        u.id === target.id
          ? {
              ...u,
              name: form.name.trim(),
              email: form.email.trim(),
              role: form.role,
              hub: form.role === "super-admin" ? "—" : form.hub,
            }
          : u,
      ),
    )
    addAudit("User account updated", form.name.trim())
    setModal("none")
  }

  async function handleLock() {
    if (!target) return
    const reason = lockReason.trim() || "Manually locked by administrator."
    try {
      await superAdminApi.lockUser(target.id, reason)
    } catch (err: any) {
      console.warn("superAdminApi.lockUser offline fallback:", err?.message)
    }
    setUsers((us) =>
      us.map((u) =>
        u.id === target.id
          ? {
              ...u,
              status: "locked",
              lockReason: reason,
              lockedBy: "Zara Khan",
              session: undefined,
            }
          : u,
      ),
    )
    addAudit("Account locked by administrator", target.name)
    setModal("none")
  }

  async function handleUnlock() {
    if (!target) return
    try {
      await superAdminApi.unlockUser(target.id)
    } catch (err: any) {
      console.warn("superAdminApi.unlockUser offline fallback:", err?.message)
    }
    setUsers((us) =>
      us.map((u) =>
        u.id === target.id
          ? {
              ...u,
              status: "active",
              lockReason: undefined,
              lockedBy: undefined,
            }
          : u,
      ),
    )
    addAudit("Account unlocked", target.name)
    setModal("none")
  }

  async function handleMfaReset() {
    if (!target || !mfaVerified || !mfaReason.trim()) return
    let resetEnroll: { secret: string; otpauthUrl: string } | undefined
    try {
      const res = await superAdminApi.resetUserMfa(target.id, mfaReason.trim())
      if (res?.mfaEnrollment || res?.enrollment) {
        resetEnroll = res.mfaEnrollment || res.enrollment
      }
    } catch (err: any) {
      console.warn("superAdminApi.resetUserMfa offline fallback:", err?.message)
    }
    setUsers((us) =>
      us.map((u) => (u.id === target.id ? { ...u, mfa: "pending-reset" } : u)),
    )
    addAudit("MFA reset — user must re-enroll on next login", target.name)

    if (resetEnroll) {
      setProvisionMfaData({
        email: target.email,
        name: target.name,
        secret: resetEnroll.secret,
        otpauthUrl: resetEnroll.otpauthUrl,
      })
      setCopiedKey(false)
      setModal("provision-mfa-qr")
    } else {
      setModal("none")
    }
  }

  async function handleRevokeSession() {
    if (!target || !target.session) return
    try {
      await superAdminApi.revokeSession(target.session.id)
    } catch (err: any) {
      console.warn("superAdminApi.revokeSession offline fallback:", err?.message)
    }
    setUsers((us) =>
      us.map((u) => (u.id === target.id ? { ...u, session: undefined } : u)),
    )
    addAudit("Active session force-revoked", target.name)
    setModal("none")
  }

  /* filtered list */
  const visible = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter((u) => {
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false
      if (roleF !== "All Roles" && ROLE_LABELS[u.role] !== roleF) return false
      if (hubF !== "All Hubs" && u.hub !== hubF) return false
      if (statusF === "Active" && u.status !== "active") return false
      if (statusF === "Locked" && u.status !== "locked") return false
      if (mfaF === "Enabled" && u.mfa !== "enabled") return false
      if (mfaF === "Disabled" && u.mfa !== "disabled") return false
      return true
    })
  }, [users, search, roleF, hubF, statusF, mfaF])

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            className="display"
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#24302E",
              margin: "0 0 2px",
              letterSpacing: -0.2,
            }}
          >
            User Management
          </h1>
          <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
            Manage staff accounts, roles, access, and security settings.
          </p>
        </div>
        <button
          onClick={openCreate}
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
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create User
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid #D6D3C6",
        }}
      >
        {(["users", "audit"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "9px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                tab === t ? "#4C7A6E" : "transparent"
              }`,
              color: tab === t ? "#4C7A6E" : "#5C5A50",
              fontSize: 13,
              fontWeight: tab === t ? 700 : 400,
              cursor: "pointer",
              marginBottom: -1,
              textTransform: "capitalize",
            }}
          >
            {t === "users" ? "All Users" : "Audit Log"}
          </button>
        ))}
      </div>

      {/* ══ USERS TAB ══ */}
      {tab === "users" && (
        <div>
          {/* Search + filters */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C897C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                style={{
                  height: 36,
                  width: "100%",
                  paddingLeft: 30,
                  paddingRight: 12,
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#24302E",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {[
              {
                val: roleF,
                set: setRoleF,
                opts: ["All Roles", ...Object.values(ROLE_LABELS)],
              },
              { val: hubF, set: setHubF, opts: ["All Hubs", ...HUBS] },
              {
                val: statusF,
                set: setStatusF,
                opts: ["All", "Active", "Locked"],
              },
              { val: mfaF, set: setMfaF, opts: ["All", "Enabled", "Disabled"] },
            ].map(({ val, set, opts }, i) => (
              <Select
                key={i}
                value={val}
                onChange={set}
                options={opts.map((o) => ({ value: o, label: o }))}
                style={{ height: 36 }}
              />
            ))}
            {(search ||
              roleF !== "All Roles" ||
              hubF !== "All Hubs" ||
              statusF !== "All" ||
              mfaF !== "All") && (
              <button
                onClick={() => {
                  setSearch("")
                  setRoleF("All Roles")
                  setHubF("All Hubs")
                  setStatusF("All")
                  setMfaF("All")
                }}
                style={{
                  height: 36,
                  padding: "0 14px",
                  background: "#F1F0EA",
                  color: "#5C5A50",
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Total users", value: users.length, color: "#24302E" },
              {
                label: "Active",
                value: users.filter((u) => u.status === "active").length,
                color: "#4C7A6E",
              },
              {
                label: "Locked",
                value: users.filter((u) => u.status === "locked").length,
                color: "#A6453D",
              },
              {
                label: "MFA disabled",
                value: users.filter((u) => u.mfa === "disabled").length,
                color: "#8C6F35",
              },
              { label: "Showing", value: visible.length, color: "#4C7A6E" },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  background: "#fff",
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: c.color,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {c.value}
                </span>
                <span style={{ fontSize: 11.5, color: "#8C897C" }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr style={{ background: "#F1F0EA" }}>
                  {[
                    "User",
                    "Role",
                    "Hub",
                    "Status",
                    "MFA",
                    "Last Login",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 18px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#5C5A50",
                        borderBottom: "1px solid #D6D3C6",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: "1px solid #F1EFE8",
                      background: u.status === "locked" ? "#FFF8F8" : "#fff",
                    }}
                  >
                    {/* User */}
                    <td style={{ padding: "13px 18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background:
                              u.status === "locked" ? "#FCEBEB" : "#EDF2F8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              u.status === "locked" ? "#8C3B34" : "#4C7A6E",
                            flexShrink: 0,
                          }}
                        >
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#24302E",
                            }}
                          >
                            {u.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#8C897C" }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td style={{ padding: "13px 18px" }}>
                      <span
                        style={{
                          ...PILL,
                          color:
                            u.role === "super-admin"
                              ? "#4C7A6E"
                              : u.role === "center-superintendent"
                                ? "#1A4DB8"
                                : "#5C5A50",
                        }}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    {/* Hub */}
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 12,
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#5C5A50",
                      }}
                    >
                      {u.hub}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "13px 18px" }}>
                      <div>
                        {u.status === "active" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              height: 32,
                              padding: "0 12px 0 6px",
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 600,
                              fontFamily: "Inter, sans-serif",
                              background: "#DCE7E3",
                              color: "#2F5C4E",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              style={{ flexShrink: 0 }}
                            >
                              <circle cx="10" cy="10" r="8" fill="#4C7A6E" />
                              <path
                                d="M6 10 L9 13 L14 7"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>{" "}
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              height: 32,
                              padding: "0 12px 0 6px",
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 600,
                              fontFamily: "Inter, sans-serif",
                              background: "#EFE3C9",
                              color: "#9C6B1F",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              style={{ flexShrink: 0 }}
                            >
                              <circle cx="10" cy="10" r="8" fill="#B08D46" />
                              <path
                                d="M10 5 L10 11 M10 14 L10 15"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>{" "}
                            Locked
                          </span>
                        )}
                        {u.status === "locked" && u.lockedBy && (
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#8C897C",
                              marginTop: 3,
                            }}
                          >
                            by {u.lockedBy}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* MFA */}
                    <td style={{ padding: "13px 18px" }}>
                      <span
                        style={{
                          ...PILL,
                          color:
                            u.mfa === "enabled"
                              ? "#4C7A6E"
                              : u.mfa === "pending-reset"
                                ? "#8C6F35"
                                : "#A6453D",
                        }}
                      >
                        {u.mfa === "enabled"
                          ? "Enabled"
                          : u.mfa === "pending-reset"
                            ? "Reset Pending"
                            : "Disabled"}
                      </span>
                    </td>
                    {/* Last login */}
                    <td
                      style={{
                        padding: "13px 18px",
                        fontSize: 11.5,
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#8C897C",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.lastLogin}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "13px 18px" }}>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit user"
                          style={{
                            height: 28,
                            padding: "0 10px",
                            background: "#fff",
                            color: "#4C7A6E",
                            border: "1px solid #D6D3C6",
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        {/* Lock / Unlock */}
                        {u.status === "active" ? (
                          <button
                            onClick={() => openLock(u)}
                            title="Lock account"
                            style={{
                              height: 28,
                              padding: "0 10px",
                              background: "#fff",
                              color: "#8C3B34",
                              border: "1px solid #A6453D",
                              borderRadius: 4,
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Lock
                          </button>
                        ) : (
                          <button
                            onClick={() => openUnlock(u)}
                            title="Unlock account"
                            style={{
                              height: 28,
                              padding: "0 10px",
                              background: "#fff",
                              color: "#4C7A6E",
                              border: "1px solid #4C7A6E",
                              borderRadius: 4,
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                            Unlock
                          </button>
                        )}
                        {/* MFA Reset */}
                        {u.mfa !== "pending-reset" && (
                          <button
                            onClick={() => openMfaReset(u)}
                            title="Reset MFA"
                            style={{
                              height: 28,
                              padding: "0 10px",
                              background: "#fff",
                              color: "#8C6F35",
                              border: "1px solid #B08D46",
                              borderRadius: 4,
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            MFA
                          </button>
                        )}
                        {/* Revoke session */}
                        {u.session && (
                          <button
                            onClick={() => openRevokeSession(u)}
                            title="Revoke active session"
                            style={{
                              height: 28,
                              padding: "0 10px",
                              background: "#fff",
                              color: "#5C5A50",
                              border: "1px solid #D6D3C6",
                              borderRadius: 4,
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <svg
                              width="11"
                              height="11"
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
                            Session
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 48,
                        textAlign: "center",
                        fontSize: 13,
                        color: "#8C897C",
                      }}
                    >
                      No users match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ AUDIT TAB ══ */}
      {tab === "audit" && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #D6D3C6",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F1F0EA" }}>
                {[
                  "Action",
                  "Performed By",
                  "Affected User",
                  "Timestamp",
                  "Result",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#5C5A50",
                      borderBottom: "1px solid #D6D3C6",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {audit.map((e) => (
                <tr
                  key={e.id}
                  style={{
                    borderBottom: "1px solid #F1EFE8",
                    background: e.result === "failure" ? "#FFF8F8" : "#fff",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 20px",
                      fontSize: 13,
                      color: "#24302E",
                      fontWeight: 500,
                    }}
                  >
                    {e.action}
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      fontSize: 13,
                      color: "#5C5A50",
                    }}
                  >
                    {e.admin}
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      fontSize: 13,
                      color: "#5C5A50",
                    }}
                  >
                    {e.affectedUser}
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      fontSize: 11.5,
                      fontFamily: "IBM Plex Mono, monospace",
                      color: "#8C897C",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.timestamp}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span
                      style={{
                        ...PILL,
                        color: e.result === "success" ? "#4C7A6E" : "#A6453D",
                        background:
                          e.result === "success" ? "#EAF3DE" : "#FCEBEB",
                      }}
                    >
                      {e.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ CREATE USER MODAL ══ */}
      {modal === "create" && (
        <ModalOverlay wide>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#24302E",
              margin: "0 0 4px",
            }}
          >
            Create User Account
          </h2>
          <p style={{ fontSize: 13, color: "#5C5A50", margin: "0 0 24px" }}>
            Permissions are assigned automatically based on the selected role.
          </p>
          {formError && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #E8B4B4",
                borderRadius: 6,
                padding: "9px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#501313",
              }}
            >
              {formError}
            </div>
          )}
          <Field label="Full Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ahmad Raza"
              style={inputBase}
            />
          </Field>
          <Field label="Email Address" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="e.g. ahmad.raza@navttc.gov.pk"
              style={inputBase}
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="Role" required>
              <Select
                value={form.role}
                onChange={(v) =>
                  setForm((f) => ({ ...f, role: v as UserRole }))
                }
                options={ROLES.map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r],
                }))}
                style={{ height: 38, width: "100%" }}
              />
            </Field>
            <Field label="Testing Hub" required={form.role !== "super-admin"}>
              <Select
                value={form.hub}
                onChange={(v) => setForm((f) => ({ ...f, hub: v }))}
                disabled={form.role === "super-admin"}
                options={HUBS.map((h) => ({ value: h, label: h }))}
                style={{ height: 38, width: "100%" }}
              />
              {form.role === "super-admin" && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: "#8C897C",
                    margin: "3px 0 0",
                  }}
                >
                  Super Admins have access to all hubs.
                </p>
              )}
            </Field>
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#24302E",
                    marginBottom: 2,
                  }}
                >
                  Require MFA Setup
                </div>
                <div style={{ fontSize: 12, color: "#8C897C" }}>
                  User will enroll their authenticator app on first login.
                </div>
              </div>
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, mfaRequired: !f.mfaRequired }))
                }
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  background: form.mfaRequired ? "#4C7A6E" : "#D6D3C6",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: form.mfaRequired ? 22 : 3,
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
          </div>
          <div
            style={{
              background: "#E4EEFC",
              border: "1px solid #A8C4F0",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 24,
              fontSize: 12.5,
              color: "#123B7A",
              lineHeight: 1.5,
            }}
          >
            The account will be created with <strong>Active</strong> status. A
            password setup link will be sent to the provided email.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleCreate}
              style={{
                flex: 1,
                height: 40,
                background: "#4C7A6E",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create Account
            </button>
            <button
              onClick={() => setModal("none")}
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
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ EDIT USER MODAL ══ */}
      {modal === "edit" && target && (
        <ModalOverlay wide>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#24302E",
              margin: "0 0 4px",
            }}
          >
            Edit User Account
          </h2>
          <p style={{ fontSize: 13, color: "#5C5A50", margin: "0 0 24px" }}>
            Historical authentication and audit records cannot be modified.
          </p>
          {formError && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #E8B4B4",
                borderRadius: 6,
                padding: "9px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#501313",
              }}
            >
              {formError}
            </div>
          )}
          <Field label="Full Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inputBase}
            />
          </Field>
          <Field label="Email Address" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              style={inputBase}
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="Role" required>
              <Select
                value={form.role}
                onChange={(v) =>
                  setForm((f) => ({ ...f, role: v as UserRole }))
                }
                options={ROLES.map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r],
                }))}
                style={{ height: 38, width: "100%" }}
              />
            </Field>
            <Field label="Testing Hub">
              <Select
                value={form.hub}
                onChange={(v) => setForm((f) => ({ ...f, hub: v }))}
                disabled={form.role === "super-admin"}
                options={HUBS.map((h) => ({ value: h, label: h }))}
                style={{ height: 38, width: "100%" }}
              />
            </Field>
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 24px",
              fontSize: 12.5,
            }}
          >
            <div>
              <span style={{ color: "#8C897C" }}>Account Created: </span>
              <span
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  color: "#24302E",
                }}
              >
                {target.createdAt}
              </span>
            </div>
            <div>
              <span style={{ color: "#8C897C" }}>Last Login: </span>
              <span
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  color: "#24302E",
                }}
              >
                {target.lastLogin}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleEdit}
              style={{
                flex: 1,
                height: 40,
                background: "#4C7A6E",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
            <button
              onClick={() => setModal("none")}
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
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ LOCK MODAL ══ */}
      {modal === "lock" && target && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "#FCEBEB",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A6453D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Lock Account
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                The user will be immediately signed out and unable to log in.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#24302E" }}>
              {target.name}
            </div>
            <div style={{ fontSize: 12, color: "#8C897C", marginTop: 2 }}>
              {target.email} · {ROLE_LABELS[target.role]}
            </div>
          </div>
          <Field
            label="Reason for Locking"
            hint="Optional — recorded in the audit log."
          >
            <textarea
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder="e.g. Pending identity re-verification, suspicious activity…"
              rows={3}
              style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
            />
          </Field>
          <div
            style={{
              background: "#FCE8D6",
              border: "1px solid #B08D46",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 13,
              color: "#5C3300",
            }}
          >
            Any active sessions for this user will be immediately invalidated.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleLock}
              style={{
                flex: 1,
                height: 40,
                background: "#A6453D",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Lock Account
            </button>
            <button
              onClick={() => setModal("none")}
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
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ UNLOCK MODAL ══ */}
      {modal === "unlock" && target && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "#EAF3DE",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4C7A6E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Unlock Account
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                The user will regain access and be able to log in again.
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#24302E" }}>
              {target.name}
            </div>
            <div style={{ fontSize: 12, color: "#8C897C", marginTop: 2 }}>
              {target.email} · {ROLE_LABELS[target.role]}
            </div>
          </div>
          {target.lockReason && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #E8B4B4",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8C897C",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Lock Reason
              </div>
              <div style={{ color: "#501313" }}>{target.lockReason}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleUnlock}
              style={{
                flex: 1,
                height: 40,
                background: "#4C7A6E",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Unlock Account
            </button>
            <button
              onClick={() => setModal("none")}
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
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MFA RESET MODAL ══ */}
      {modal === "mfa-reset" && target && (
        <ModalOverlay wide>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "#FCE8D6",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B08D46"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Assisted MFA Reset
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                Out-of-band identity verification is required before proceeding.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 24px",
                fontSize: 13,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#8C897C",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 3,
                  }}
                >
                  User
                </div>
                <div style={{ color: "#24302E", fontWeight: 600 }}>
                  {target.name}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#8C897C",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 3,
                  }}
                >
                  Email
                </div>
                <div style={{ color: "#24302E" }}>{target.email}</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#8C897C",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 3,
                  }}
                >
                  Role
                </div>
                <div style={{ color: "#24302E" }}>
                  {ROLE_LABELS[target.role]}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#8C897C",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 3,
                  }}
                >
                  Current MFA
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: target.mfa === "enabled" ? "#4C7A6E" : "#8C6F35",
                  }}
                >
                  {target.mfa === "enabled" ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Identity verification checklist */}
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#24302E",
                marginBottom: 12,
                letterSpacing: 0.1,
              }}
            >
              Identity Verification Steps
            </div>
            {[
              "Verified user identity via government-issued ID (CNIC)",
              "Confirmed employment through HR records",
              "Spoke with user by phone using registered number on file",
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: "#EAF3DE",
                    border: "1px solid #4C7A6E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9">
                    <polyline
                      points="1.5,4.5 3.5,6.5 7.5,2.5"
                      stroke="#4C7A6E"
                      strokeWidth="1.4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span style={{ fontSize: 12.5, color: "#24302E" }}>{step}</span>
              </div>
            ))}
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
              lineHeight: 1.5,
            }}
          >
            After reset, the user's authenticator app binding will be cleared.
            They will be required to re-enroll MFA on their next login.
          </div>

          <Field label="Reason for Reset" required>
            <textarea
              value={mfaReason}
              onChange={(e) => setMfaReason(e.target.value)}
              placeholder="e.g. User lost access to authenticator app, device replaced…"
              rows={2}
              style={{ ...inputBase, resize: "vertical", lineHeight: 1.5 }}
            />
          </Field>

          <div
            onClick={() => setMfaVerified((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: "#F1F0EA",
              border: `1px solid ${mfaVerified ? "#4C7A6E" : "#D6D3C6"}`,
              borderRadius: 6,
              cursor: "pointer",
              marginBottom: 24,
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `2px solid ${mfaVerified ? "#4C7A6E" : "#D6D3C6"}`,
                background: mfaVerified ? "#4C7A6E" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {mfaVerified && (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <polyline
                    points="1.5,5 4,7.5 8.5,2"
                    stroke="white"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                color: "#24302E",
                fontWeight: mfaVerified ? 600 : 400,
              }}
            >
              I confirm that out-of-band identity verification has been
              successfully completed.
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleMfaReset}
              disabled={!mfaVerified || !mfaReason.trim()}
              style={{
                flex: 1,
                height: 40,
                background:
                  mfaVerified && mfaReason.trim() ? "#4C7A6E" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor:
                  mfaVerified && mfaReason.trim() ? "pointer" : "not-allowed",
              }}
            >
              Confirm MFA Reset
            </button>
            <button
              onClick={() => setModal("none")}
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
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ REVOKE SESSION MODAL ══ */}
      {modal === "revoke-session" && target && target.session && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "#FCEBEB",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
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
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Force Revoke Session
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                The session and its refresh token will be immediately
                invalidated.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#24302E",
                marginBottom: 12,
              }}
            >
              User
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#24302E" }}>
              {target.name}
            </div>
            <div style={{ fontSize: 12, color: "#8C897C", marginBottom: 16 }}>
              {target.email}
            </div>
            <div
              style={{ height: 1, background: "#E5E3DC", marginBottom: 14 }}
            />
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#24302E",
                marginBottom: 10,
              }}
            >
              Active Session
            </div>
            {[
              ["Device", target.session.device],
              ["IP Address", target.session.ip],
              ["Location", target.session.location],
              ["Last Activity", target.session.lastActive],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12.5,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "#8C897C" }}>{k}</span>
                <span
                  style={{
                    color: "#24302E",
                    fontFamily:
                      k === "IP Address"
                        ? "IBM Plex Mono, monospace"
                        : "inherit",
                    fontSize: k === "IP Address" ? 12 : 12.5,
                  }}
                >
                  {v}
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
              lineHeight: 1.5,
            }}
          >
            <strong>The session will be terminated immediately.</strong> The
            user's refresh token will be revoked. They will need to sign in
            again from scratch.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRevokeSession}
              style={{
                flex: 1,
                height: 40,
                background: "#A6453D",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Revoke Session
            </button>
            <button
              onClick={() => setModal("none")}
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
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── PROVISION MFA QR MODAL (Guide #7) ── */}
      {modal === "provision-mfa-qr" && provisionMfaData && (
        <ModalOverlay wide>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#EAF3DE",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#24302E", margin: "0 0 6px" }}>
              MFA Enrollment Provisioned
            </h2>
            <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
              Authenticator setup details generated for <strong>{provisionMfaData.name}</strong> ({provisionMfaData.email})
            </p>
          </div>

          <div
            style={{
              background: "#F7F6F2",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #D6D3C6",
                display: "inline-block",
                marginBottom: 16,
              }}
            >
              <QRCodeSVG value={provisionMfaData.otpauthUrl} size={180} level="M" />
            </div>
            <p style={{ fontSize: 12, color: "#5C5A50", margin: "0 0 8px", textAlign: "center" }}>
              Scan this QR code using Google Authenticator, Microsoft Authenticator, or compatible TOTP app.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                padding: "8px 12px",
                width: "100%",
                maxWidth: 360,
                boxSizing: "border-box",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "#8C897C", fontWeight: 600, textTransform: "uppercase" }}>Manual Entry Key</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: 1, color: "#24302E" }}>
                  {provisionMfaData.secret}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(provisionMfaData.secret)
                  setCopiedKey(true)
                  setTimeout(() => setCopiedKey(false), 2000)
                }}
                style={{
                  background: copiedKey ? "#2D6A4F" : "#E4E2D9",
                  color: copiedKey ? "#fff" : "#24302E",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedKey ? "Copied!" : "Copy Key"}
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#EAF3DE",
              border: "1px solid #B7D9B2",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 12.5,
              color: "#173404",
              lineHeight: 1.5,
            }}
          >
            <strong>Super Admin Notice:</strong> Securely deliver this setup key or QR code to the staff member. They will be prompted to enter the 6-digit TOTP code upon their next login.
          </div>

          <button
            type="button"
            onClick={() => {
              setProvisionMfaData(null)
              setModal("none")
            }}
            style={{
              width: "100%",
              height: 42,
              background: "#4C7A6E",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Done & Close
          </button>
        </ModalOverlay>
      )}
    </div>
  )
}
