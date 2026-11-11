import { useState, useEffect } from "react"
import { api, DeviceHealth, RegisterDevicePayload } from "../services/api"
import { getDeviceFingerprint } from "../services/fingerprint"

type DeviceStatus = "authorized" | "pending" | "revoked"
type ModalType = "none" | "authorize" | "revoke" | "detail"

interface Device {
  id: string
  deviceId: string
  user: string
  role: string
  hub: string
  type: string
  os: string
  browser: string
  ip: string
  lastSeen: string
  registeredAt: string
  status: DeviceStatus
  isOnline?: boolean
  edrStatus?: "compliant" | "non_compliant" | "unknown"
  hubLocationId?: number
}

function StatusPill({ status }: { status: DeviceStatus }) {
  const map = {
    authorized: {
      bg: "#DCE7E3",
      text: "#2F5C4E",
      label: "Completed",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#4C7A6E" />
          <path
            d="M6 10 L9 13 L14 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    pending: {
      bg: "#EFE3C9",
      text: "#9C6B1F",
      label: "Needs Attention",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#B08D46" />
          <path
            d="M10 5 L10 11 M10 14 L10 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    revoked: {
      bg: "#EBDAD8",
      text: "#8C3B34",
      label: "Revoked",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#A6453D" />
          <path
            d="M7 7 L13 13 M13 7 L7 13"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  }
  const s = (map as Record<string, any>)[status] || (map as any).active || Object.values(map)[0]
  return (
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
        background: s.bg,
        color: s.text,
      }}
    >
      {s.svg}
      {s.label}
    </span>
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
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #D6D3C6",
          borderRadius: 8,
          padding: 32,
          maxWidth: 520,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([])
  const [filterStatus, setFilterStatus] = useState<"all" | DeviceStatus>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Device | null>(null)
  const [modal, setModal] = useState<ModalType>("none")
  const [revokeReason, setRevokeReason] = useState("")

  // Capstone B3: Device Health, Lockdown & Registration States
  const [hubLocked, setHubLocked] = useState<Record<number, boolean>>({})
  const [lockdownLoading, setLockdownLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [regForm, setRegForm] = useState({
    hubLocationId: 1,
    deviceName: "",
    deviceFingerprint: "",
    deviceCredential: "",
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState("")

  // Poll real-time device health
  useEffect(() => {
    let mounted = true
    async function loadHealth() {
      try {
        const res: any = await api.getDeviceHealth()
        const live = Array.isArray(res) ? res : res?.devices || []
        if (!mounted || !Array.isArray(live) || live.length === 0) return

        setDevices((prev) => {
          const updated = [...prev]
          live.forEach((ld) => {
            const idx = updated.findIndex((d) => d.deviceId === ld.deviceId)
            const item: Device = {
              id: ld.deviceId,
              deviceId: ld.deviceId,
              user: "Assigned Staff",
              role: "Hub Operator",
              hub: `Hub Location #${ld.hubLocationId}`,
              hubLocationId: ld.hubLocationId,
              type: "Authorized Hub Laptop",
              os: "Windows 11 Enterprise",
              browser: "Chrome 126 EDR",
              ip: "Testing Hub Network",
              lastSeen: ld.lastHeartbeatAt
                ? new Date(ld.lastHeartbeatAt).toLocaleString()
                : "Never",
              registeredAt: ld.lastHeartbeatAt || new Date().toISOString(),
              status: ld.revoked ? "revoked" : "authorized",
              isOnline: ld.isOnline,
              edrStatus: ld.edrStatus,
            }
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], ...item }
            } else {
              updated.unshift(item)
            }
          })
          return updated
        })
      } catch {}
    }

    loadHealth()
    const timer = setInterval(loadHealth, 30000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  async function handleToggleHubLockdown(hubId = 1) {
    setLockdownLoading(true)
    const newLockState = !hubLocked[hubId]
    try {
      await api.setHubLockdown(hubId, newLockState)
      setHubLocked((prev) => ({ ...prev, [hubId]: newLockState }))
      setToastMessage(
        newLockState
          ? `Hub ${hubId} Lockdown ACTIVE: All logins frozen from this hub location.`
          : `Hub ${hubId} Lockdown lifted: Logins resumed.`,
      )
      setTimeout(() => setToastMessage(""), 5000)
    } catch (err: any) {
      setToastMessage(err?.message || "Failed to update hub lockdown.")
    } finally {
      setLockdownLoading(false)
    }
  }

  async function handleRevokeSubmit() {
    if (!selected) return
    try {
      await api.revokeDevice(selected.deviceId).catch(() => null)
    } catch {}
    setDevices((ds) =>
      ds.map((d) => (d.id === selected.id ? { ...d, status: "revoked" } : d)),
    )
    setModal("none")
    setRevokeReason("")
  }

  async function handleAutoDetectFingerprint() {
    try {
      const fp = await getDeviceFingerprint()
      setRegForm((prev) => ({ ...prev, deviceFingerprint: fp }))
    } catch {}
  }

  function handleGenerateCredential() {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    setRegForm((prev) => ({ ...prev, deviceCredential: hex }))
  }

  async function handleRegisterDeviceSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !regForm.deviceName ||
      !regForm.deviceFingerprint ||
      !regForm.deviceCredential
    ) {
      setRegError("All fields are required.")
      return
    }
    setRegLoading(true)
    setRegError("")
    try {
      await api.registerDevice({
        hubLocationId: Number(regForm.hubLocationId),
        deviceName: regForm.deviceName,
        deviceFingerprint: regForm.deviceFingerprint,
        deviceCredential: regForm.deviceCredential,
      })
      setShowRegisterModal(false)
      setRegForm({
        hubLocationId: 1,
        deviceName: "",
        deviceFingerprint: "",
        deviceCredential: "",
      })
      setToastMessage("Hub device successfully registered.")
      setTimeout(() => setToastMessage(""), 4000)
    } catch (err: any) {
      setRegError(err?.message || "Failed to register device.")
    } finally {
      setRegLoading(false)
    }
  }

  const displayed = devices.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false
    if (
      search &&
      !d.user.toLowerCase().includes(search.toLowerCase()) &&
      !d.deviceId.includes(search) &&
      !d.hub.includes(search)
    )
      return false
    return true
  })

  const authorized = devices.filter((d) => d.status === "authorized").length
  const pending = devices.filter((d) => d.status === "pending").length
  const revoked = devices.filter((d) => d.status === "revoked").length

  function handleAuthorize(id: string) {
    setDevices((ds) =>
      ds.map((d) => (d.id === id ? { ...d, status: "authorized" } : d)),
    )
    setModal("none")
  }

  function handleRevoke() {
    handleRevokeSubmit()
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
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
            Device Health
          </h1>
          <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
            Monitor and manage authorized devices across all hubs.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => handleToggleHubLockdown(1)}
            disabled={lockdownLoading}
            style={{
              height: 40,
              padding: "0 16px",
              background: hubLocked[1] ? "#8C3B34" : "#FCEBEB",
              color: hubLocked[1] ? "#fff" : "#A6453D",
              border: "1px solid #A6453D",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🚨{" "}
            {hubLocked[1] ? "Lift Hub 1 Lockdown" : "Emergency Hub 1 Lockdown"}
          </button>
          <button
            onClick={() => {
              setRegError("")
              setShowRegisterModal(true)
            }}
            style={{
              height: 40,
              padding: "0 16px",
              background: "#4C7A6E",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Register Hub Device
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          style={{
            background: "#EAF3DE",
            border: "1px solid #4C7A6E",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#173404",
            fontWeight: 500,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total Devices", value: devices.length },
          {
            label: "Authorized",
            value: authorized,
            bg: "#EAF3DE",
            color: "#173404",
          },
          {
            label: "Pending Authorization",
            value: pending,
            bg: "#FCE8D6",
            color: "#5C3300",
          },
          { label: "Revoked", value: revoked, bg: "#FCEBEB", color: "#501313" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 13, color: "#5C5A50", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#24302E" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pending > 0 && (
        <div
          style={{
            background: "#FCE8D6",
            border: "1px solid #B08D46",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "#5C3300",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B08D46"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong>
              {pending} device{pending !== 1 ? "s" : ""}
            </strong>{" "}
            require authorization review.
          </span>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #D6D3C6",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid #D6D3C6",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, device ID, or hub…"
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              fontSize: 13,
              background: "#F1F0EA",
              color: "#24302E",
              fontFamily: "Inter, sans-serif",
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "authorized", "pending", "revoked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 6,
                  border: `1px solid ${
                    filterStatus === f ? "#4C7A6E" : "#D6D3C6"
                  }`,
                  background: filterStatus === f ? "#4C7A6E" : "#fff",
                  color: filterStatus === f ? "#fff" : "#5C5A50",
                  fontSize: 12,
                  fontWeight: filterStatus === f ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F0EA" }}>
              {[
                "Device ID",
                "User",
                "Role",
                "Hub",
                "Device Type",
                "Last Seen",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #F1EFE8" }}>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontWeight: 600,
                  }}
                >
                  {d.deviceId}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#24302E" }}
                  >
                    {d.user}
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    color: "#5C5A50",
                  }}
                >
                  {d.role}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    color: "#5C5A50",
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {d.hub}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, color: "#24302E" }}>{d.type}</div>
                  <div style={{ fontSize: 11, color: "#8C897C" }}>
                    {d.os} · {d.browser}
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    color: "#8C897C",
                    fontFamily: "IBM Plex Mono, monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.lastSeen}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <StatusPill status={d.status} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        setSelected(d)
                        setModal("detail")
                      }}
                      style={{
                        height: 28,
                        padding: "0 10px",
                        background: "#fff",
                        color: "#24302E",
                        border: "1px solid #D6D3C6",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                    {d.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelected(d)
                          setModal("authorize")
                        }}
                        style={{
                          height: 28,
                          padding: "0 10px",
                          background: "#4C7A6E",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Authorize
                      </button>
                    )}
                    {d.status === "authorized" && (
                      <button
                        onClick={() => {
                          setSelected(d)
                          setRevokeReason("")
                          setModal("revoke")
                        }}
                        style={{
                          height: 28,
                          padding: "0 10px",
                          background: "#fff",
                          color: "#8C3B34",
                          border: "1px solid #A6453D",
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "#8C897C",
                  }}
                >
                  No devices match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {modal === "detail" && selected && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#24302E",
                margin: 0,
              }}
            >
              Device Details
            </h2>
            <StatusPill status={selected.status} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 24px",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Device ID", val: selected.deviceId, mono: true },
              { label: "Registered User", val: selected.user },
              { label: "Role", val: selected.role },
              { label: "Hub", val: selected.hub, mono: true },
              { label: "Device Type", val: selected.type },
              { label: "Operating System", val: selected.os },
              { label: "Browser", val: selected.browser },
              { label: "IP Address", val: selected.ip, mono: true },
              {
                label: "Registered At",
                val: selected.registeredAt,
                mono: true,
              },
              { label: "Last Seen", val: selected.lastSeen, mono: true },
            ].map((f) => (
              <div key={f.label}>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  {f.label}
                </div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: f.mono
                      ? "IBM Plex Mono, monospace"
                      : "Inter, sans-serif",
                    fontSize: f.mono ? 12 : 13,
                    fontWeight: 500,
                  }}
                >
                  {f.val}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {selected.status === "pending" && (
              <button
                onClick={() => handleAuthorize(selected.id)}
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
                Authorize Device
              </button>
            )}
            {selected.status === "authorized" && (
              <button
                onClick={() => {
                  setRevokeReason("")
                  setModal("revoke")
                }}
                style={{
                  height: 40,
                  padding: "0 20px",
                  background: "#fff",
                  color: "#8C3B34",
                  border: "1px solid #A6453D",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Revoke
              </button>
            )}
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
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Authorize Modal */}
      {modal === "authorize" && selected && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#EAF3DE",
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
                stroke="#4C7A6E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Authorize Device
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                Grant this device access to the Issuer Portal for hub{" "}
                {selected.hub}.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 24px",
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ color: "#8C897C", marginBottom: 2 }}>Device ID</div>
              <div
                style={{
                  color: "#24302E",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 12,
                }}
              >
                {selected.deviceId}
              </div>
            </div>
            <div>
              <div style={{ color: "#8C897C", marginBottom: 2 }}>User</div>
              <div style={{ color: "#24302E", fontWeight: 600 }}>
                {selected.user}
              </div>
            </div>
            <div>
              <div style={{ color: "#8C897C", marginBottom: 2 }}>Device</div>
              <div style={{ color: "#24302E" }}>
                {selected.type} · {selected.os}
              </div>
            </div>
            <div>
              <div style={{ color: "#8C897C", marginBottom: 2 }}>
                IP Address
              </div>
              <div
                style={{
                  color: "#24302E",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 12,
                }}
              >
                {selected.ip}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleAuthorize(selected.id)}
              style={{
                flex: 1,
                height: 40,
                background: "#4C7A6E",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Authorize Device
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
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Revoke Modal */}
      {modal === "revoke" && selected && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
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
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Revoke Device
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                This device will immediately lose portal access.
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
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, color: "#24302E", marginBottom: 2 }}>
              {selected.user} · {selected.role}
            </div>
            <div style={{ color: "#5C5A50" }}>
              {selected.type} · {selected.os}
            </div>
            <div
              style={{
                color: "#8C897C",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {selected.deviceId} · {selected.ip}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#24302E",
                marginBottom: 6,
              }}
            >
              Revocation Reason <span style={{ color: "#A6453D" }}>*</span>
            </label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={2}
              placeholder="e.g. Lost device, unauthorized access attempt, employee departure"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${!revokeReason ? "#A6453D" : "#D6D3C6"}`,
                borderRadius: 6,
                fontSize: 13,
                resize: "vertical",
                fontFamily: "Inter, sans-serif",
                color: "#24302E",
                background: "#fff",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRevoke}
              disabled={!revokeReason}
              style={{
                flex: 1,
                height: 40,
                background: revokeReason ? "#A6453D" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: revokeReason ? "pointer" : "not-allowed",
              }}
            >
              Revoke Access
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
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Register Hub Device Modal (Capstone B3) */}
      {showRegisterModal && (
        <ModalOverlay>
          <form onSubmit={handleRegisterDeviceSubmit}>
            <div style={{ marginBottom: 16 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 6px",
                }}
              >
                Register Authorized Hub Laptop
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                Provision hardware credentials and browser fingerprint for
                testing hub laptops.
              </p>
            </div>

            {regError && (
              <div
                style={{
                  background: "#FCEBEB",
                  border: "1px solid #A6453D",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#501313",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {regError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#24302E",
                    marginBottom: 4,
                  }}
                >
                  Hub Location ID
                </label>
                <input
                  type="number"
                  value={regForm.hubLocationId}
                  onChange={(e) =>
                    setRegForm((f) => ({
                      ...f,
                      hubLocationId: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    height: 38,
                    border: "1px solid #D6D3C6",
                    borderRadius: 6,
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#24302E",
                    marginBottom: 4,
                  }}
                >
                  Device Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lahore-Testing-Center-Laptop-01"
                  value={regForm.deviceName}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, deviceName: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    height: 38,
                    border: "1px solid #D6D3C6",
                    borderRadius: 6,
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                  required
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <label
                    style={{ fontSize: 12, fontWeight: 600, color: "#24302E" }}
                  >
                    Device Fingerprint (32-character hex)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectFingerprint}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4C7A6E",
                      fontSize: 11,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Auto-Detect Current Browser
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 9a7b3c2d1e4f5a6b7c8d9e0f1a2b3c4d"
                  value={regForm.deviceFingerprint}
                  onChange={(e) =>
                    setRegForm((f) => ({
                      ...f,
                      deviceFingerprint: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    height: 38,
                    border: "1px solid #D6D3C6",
                    borderRadius: 6,
                    padding: "0 10px",
                    fontSize: 12,
                    fontFamily: "monospace",
                  }}
                  required
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <label
                    style={{ fontSize: 12, fontWeight: 600, color: "#24302E" }}
                  >
                    Device Credential (64-character hex)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCredential}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4C7A6E",
                      fontSize: 11,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Generate Random Credential
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="64-character hardware token"
                  value={regForm.deviceCredential}
                  onChange={(e) =>
                    setRegForm((f) => ({
                      ...f,
                      deviceCredential: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    height: 38,
                    border: "1px solid #D6D3C6",
                    borderRadius: 6,
                    padding: "0 10px",
                    fontSize: 12,
                    fontFamily: "monospace",
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="submit"
                disabled={regLoading}
                style={{
                  flex: 1,
                  height: 40,
                  background: regLoading ? "#5C5A50" : "#4C7A6E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: regLoading ? "not-allowed" : "pointer",
                }}
              >
                {regLoading ? "Registering..." : "Authorize Device"}
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
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
          </form>
        </ModalOverlay>
      )}
    </div>
  )
}
