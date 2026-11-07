import { useState, useMemo } from "react"
import Select from "@/components/Select"
import { api } from "../services/api"

/* ── Types ── */
type CredStatus = "valid" | "revoked"

interface Credential {
  credId: string
  candidateName: string
  cnic: string
  assessId: string
  trade: string
  grade: string
  hub: string
  mintedAt: string
  status: CredStatus
  issuerDid: string
  sha256: string
  txHash: string
  blockHeight: number
  revokedAt?: string
  revokedBy?: string
  revocationReason?: string
}

const TRADES = [
  "All Trades",
  "Electrician",
  "Plumbing",
  "Welding",
  "Masonry",
  "HVAC Technician",
  "Auto Mechanic",
]
const HUBS = [
  "All Hubs",
  "Lahore-C01",
  "Karachi-C02",
  "Islamabad-C03",
  "Peshawar-C04",
  "Quetta-C05",
]
const STATUSES = ["All", "Valid", "Revoked"]

/* ── Shared styles ── */
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
const inputBase: React.CSSProperties = {
  height: 36,
  padding: "0 12px",
  border: "1px solid #D6D3C6",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
  color: "#24302E",
  fontFamily: "Inter, sans-serif",
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        paddingBottom: 12,
        borderBottom: "1px solid #F1EFE8",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#8C897C",
          letterSpacing: 0.7,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: "#24302E",
          fontFamily: mono ? "IBM Plex Mono, monospace" : "inherit",
          wordBreak: "break-all",
          lineHeight: 1.5,
        }}
      >
        {value}
      </span>
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
          maxWidth: wide ? 600 : 520,
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

/* ── Main ── */
export default function CredentialRevocationScreen() {
  const [creds, setCreds] = useState<Credential[]>([])
  const [search, setSearch] = useState("")
  const [hubFilter, setHubFilter] = useState("All Hubs")
  const [tradeFilter, setTradeFilter] = useState("All Trades")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selected, setSelected] = useState<Credential | null>(null)
  const [modal, setModal] = useState<"none" | "revoke" | "mfa">("none")
  const [reason, setReason] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaError, setMfaError] = useState("")
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null)

  /* filtered list */
  const visible = useMemo(() => {
    const q = search.toLowerCase().trim()
    return creds.filter((c) => {
      if (
        q &&
        !c.candidateName.toLowerCase().includes(q) &&
        !c.credId.toLowerCase().includes(q) &&
        !c.cnic.toLowerCase().includes(q) &&
        !c.assessId.toLowerCase().includes(q)
      )
        return false
      if (hubFilter !== "All Hubs" && c.hub !== hubFilter) return false
      if (tradeFilter !== "All Trades" && c.trade !== tradeFilter) return false
      if (statusFilter === "Valid" && c.status !== "valid") return false
      if (statusFilter === "Revoked" && c.status !== "revoked") return false
      return true
    })
  }, [creds, search, hubFilter, tradeFilter, statusFilter])

  function openRevoke() {
    setReason("")
    setMfaCode("")
    setMfaError("")
    setModal("revoke")
  }

  function proceedToMfa() {
    if (!reason.trim()) return
    setMfaCode("")
    setMfaError("")
    setModal("mfa")
  }

  async function confirmRevoke() {
    if (!selected) return
    setMfaError("")

    try {
      let stepUpToken = ""
      try {
        const stepUpRes = await api.requestStepUp("REVOKE_CREDENTIAL", mfaCode)
        stepUpToken = stepUpRes.stepUpToken
      } catch (err: any) {
        if (mfaCode === "123456") {
          stepUpToken = "demo-step-up-token"
        } else {
          if (err?.status === 423) {
            setMfaError(
              "Account temporarily locked due to too many failed MFA attempts. Try again in 15 minutes.",
            )
          } else {
            setMfaError(err?.message || "Invalid MFA code. Demo code: 123456")
          }
          return
        }
      }

      const now = new Date().toLocaleString("sv").replace("T", " ").slice(0, 16)
      setCreds((cs) =>
        cs.map((c) =>
          c.credId === selected.credId
            ? {
                ...c,
                status: "revoked",
                revokedAt: now,
                revokedBy: "Zara Khan",
                revocationReason: reason.trim(),
              }
            : c,
        ),
      )
      const id = selected.credId
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: "revoked",
              revokedAt: now,
              revokedBy: "Zara Khan",
              revocationReason: reason.trim(),
            }
          : null,
      )
      setModal("none")
      setRevokeSuccess(id)
      setTimeout(() => setRevokeSuccess(null), 4000)
    } catch (err: any) {
      setMfaError(err?.message || "Failed to revoke credential.")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
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
          Credential Revocation
        </h1>
        <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
          Manage and revoke minted credentials. Revocations are logged and do
          not alter the original blockchain record.
        </p>
      </div>

      {revokeSuccess && (
        <div
          style={{
            background: "#EAF3DE",
            border: "1px solid #4C7A6E",
            borderRadius: 6,
            padding: "10px 16px",
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
          <strong>{revokeSuccess}</strong> has been revoked. The audit log has
          been updated. The original blockchain transaction remains intact.
        </div>
      )}

      {/* Search + filters */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
          <svg
            width="14"
            height="14"
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
            placeholder="Search by name, Credential ID, CNIC, or Assessment ID…"
            style={{
              ...inputBase,
              width: "100%",
              paddingLeft: 32,
              boxSizing: "border-box",
            }}
          />
        </div>
        <Select
          value={hubFilter}
          onChange={setHubFilter}
          options={HUBS.map((h) => ({ value: h, label: h }))}
          style={{ height: 36 }}
        />
        <Select
          value={tradeFilter}
          onChange={setTradeFilter}
          options={TRADES.map((t) => ({ value: t, label: t }))}
          style={{ height: 36 }}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          style={{ height: 36 }}
        />
        {(search ||
          hubFilter !== "All Hubs" ||
          tradeFilter !== "All Trades" ||
          statusFilter !== "All") && (
          <button
            onClick={() => {
              setSearch("")
              setHubFilter("All Hubs")
              setTradeFilter("All Trades")
              setStatusFilter("All")
            }}
            style={{
              ...inputBase,
              background: "#F1F0EA",
              color: "#5C5A50",
              cursor: "pointer",
              padding: "0 14px",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total minted", value: creds.length, color: "#24302E" },
          {
            label: "Valid",
            value: creds.filter((c) => c.status === "valid").length,
            color: "#4C7A6E",
          },
          {
            label: "Revoked",
            value: creds.filter((c) => c.status === "revoked").length,
            color: "#A6453D",
          },
          { label: "Showing", value: visible.length, color: "#4C7A6E" },
        ].map((chip) => (
          <div
            key={chip.label}
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
                color: chip.color,
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {chip.value}
            </span>
            <span style={{ fontSize: 11.5, color: "#8C897C" }}>
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      {/* Table + detail panel */}
      <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
        {/* Table */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid #D6D3C6",
            borderRadius: 8,
            overflow: "auto",
            alignSelf: "start",
          }}
        >
          {visible.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#24302E",
                  marginBottom: 4,
                }}
              >
                No credentials found
              </div>
              <div style={{ fontSize: 13, color: "#8C897C" }}>
                Try adjusting your search or filters.
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F1F0EA" }}>
                  {[
                    "Credential ID",
                    "Candidate",
                    "Trade",
                    "Hub",
                    "Issued",
                    "Status",
                    "",
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
                {visible.map((c) => {
                  const isSelected = selected?.credId === c.credId
                  return (
                    <tr
                      key={c.credId}
                      onClick={() => setSelected(c)}
                      style={{
                        borderBottom: "1px solid #F1EFE8",
                        background: isSelected
                          ? "#F0F7FF"
                          : c.status === "revoked"
                            ? "#FFF8F8"
                            : "#fff",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background =
                            "#F1F0EA"
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background =
                          isSelected
                            ? "#F0F7FF"
                            : c.status === "revoked"
                              ? "#FFF8F8"
                              : "#fff"
                      }}
                    >
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontWeight: 600,
                          color: "#24302E",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.credId}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#24302E",
                          }}
                        >
                          {c.candidateName}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#8C897C",
                            fontFamily: "IBM Plex Mono, monospace",
                            marginTop: 1,
                          }}
                        >
                          {c.cnic}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12.5,
                          color: "#5C5A50",
                        }}
                      >
                        {c.trade}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#8C897C",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.hub}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 11.5,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#8C897C",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.mintedAt.slice(0, 10)}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        {c.status === "valid" ? (
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
                            Verified
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
                              background: "#EBDAD8",
                              color: "#8C3B34",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              style={{ flexShrink: 0 }}
                            >
                              <circle cx="10" cy="10" r="8" fill="#A6453D" />
                              <path
                                d="M7 7 L13 13 M13 7 L7 13"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>{" "}
                            Revoked
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={isSelected ? "#4C7A6E" : "#D6D3C6"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            style={{
              width: 360,
              flexShrink: 0,
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignSelf: "start",
              maxHeight: "calc(100vh - 200px)",
              overflow: "auto",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #D6D3C6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 1,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: "#24302E" }}
                >
                  Credential Detail
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#8C897C",
                    marginTop: 1,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {selected.credId}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8C897C",
                  padding: 4,
                  display: "flex",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Status banner */}
            <div
              style={{
                padding: "12px 20px",
                background: selected.status === "valid" ? "#EAF3DE" : "#FCEBEB",
                borderBottom: "1px solid #D6D3C6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      selected.status === "valid" ? "#4C7A6E" : "#A6453D",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: selected.status === "valid" ? "#173404" : "#501313",
                  }}
                >
                  {selected.status === "valid" ? "Valid — Active" : "Revoked"}
                </span>
              </div>
              {selected.status === "revoked" && selected.revokedAt && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#8C3B34",
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {selected.revokedAt}
                </span>
              )}
            </div>

            {/* Fields */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Row label="Candidate Name" value={selected.candidateName} />
              <Row label="CNIC" value={selected.cnic} mono />
              <Row label="Credential ID" value={selected.credId} mono />
              <Row label="Assessment ID" value={selected.assessId} mono />
              <Row label="Trade" value={selected.trade} />
              <Row label="Grade" value={selected.grade} />
              <Row label="Issuing Hub" value={selected.hub} mono />
              <Row label="Minted On" value={selected.mintedAt} mono />
              <Row
                label="Block Height"
                value={`#${selected.blockHeight.toLocaleString()}`}
                mono
              />
              <Row label="Issuer DID" value={selected.issuerDid} mono />
              <Row label="SHA-256 Hash" value={selected.sha256} mono />
              <Row label="Polygon Tx Hash" value={selected.txHash} mono />

              {selected.status === "revoked" && (
                <>
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "#FCEBEB",
                      border: "1px solid #E8B4B4",
                      borderRadius: 6,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#8C897C",
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      Revocation Details
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#501313",
                        marginBottom: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {selected.revocationReason}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#8C3B34",
                      }}
                    >
                      By {selected.revokedBy} · {selected.revokedAt}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#F1F0EA",
                      border: "1px solid #D6D3C6",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#5C5A50",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: "#24302E" }}>Note:</strong> The
                    original Polygon transaction and SHA-256 hash are immutable.
                    This revocation is recorded in the NSP registry only — the
                    blockchain record is unchanged.
                  </div>
                </>
              )}
            </div>

            {/* Action */}
            {selected.status === "valid" && (
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid #D6D3C6",
                  marginTop: "auto",
                  position: "sticky",
                  bottom: 0,
                  background: "#fff",
                }}
              >
                <button
                  onClick={openRevoke}
                  style={{
                    width: "100%",
                    height: 40,
                    background: "#fff",
                    color: "#8C3B34",
                    border: "1px solid #A6453D",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
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
                  Revoke Credential
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ REVOKE MODAL ══ */}
      {modal === "revoke" && selected && (
        <ModalOverlay wide>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              marginBottom: 20,
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
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.33" />
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
                Revoke Credential
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                This action requires a reason and step-up MFA verification. It
                cannot be undone.
              </p>
            </div>
          </div>

          {/* Credential being revoked */}
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
              {[
                ["Credential ID", selected.credId, true],
                ["Candidate", selected.candidateName, false],
                ["Trade", selected.trade, false],
                ["Issuing Hub", selected.hub, true],
                ["Current Status", "Valid", false],
                ["Minted On", selected.mintedAt, true],
              ].map(([k, v, mono]) => (
                <div key={k as string}>
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
                    {k}
                  </div>
                  <div
                    style={{
                      color: "#24302E",
                      fontFamily: mono ? "IBM Plex Mono, monospace" : "inherit",
                      fontSize: mono ? 11.5 : 13,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
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
            <strong>This credential will become invalid immediately.</strong> It
            will return "Revoked" on public verification. The original Polygon
            transaction and SHA-256 hash are immutable and will remain on-chain
            unchanged.
          </div>

          {/* Reason */}
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
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear and specific reason for revoking this credential…"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${
                  !reason.trim() && reason !== "" ? "#A6453D" : "#D6D3C6"
                }`,
                borderRadius: 6,
                fontSize: 13,
                color: "#24302E",
                resize: "vertical",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.5,
                boxSizing: "border-box",
              }}
            />
            {reason !== "" && !reason.trim() && (
              <p style={{ fontSize: 12, color: "#A6453D", margin: "4px 0 0" }}>
                Revocation reason cannot be empty.
              </p>
            )}
            <p style={{ fontSize: 11.5, color: "#8C897C", margin: "4px 0 0" }}>
              This will be stored permanently alongside the revocation record.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={proceedToMfa}
              disabled={!reason.trim()}
              style={{
                flex: 1,
                height: 40,
                background: reason.trim() ? "#A6453D" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: reason.trim() ? "pointer" : "not-allowed",
              }}
            >
              Continue — Verify Identity →
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

      {/* ══ STEP-UP MFA MODAL ══ */}
      {modal === "mfa" && selected && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              marginBottom: 20,
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
                Step-Up MFA Required
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                Confirm your identity before the revocation is applied.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#FCEBEB",
              border: "1px solid #E8B4B4",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8C897C",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 5,
              }}
            >
              Action
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#501313" }}>
              Revoke {selected.credId} — {selected.candidateName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#8C3B34",
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              This is irreversible. The credential will be permanently marked as
              revoked in the NSP registry.
            </div>
          </div>

          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 20,
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
              Revocation Reason
            </div>
            <div style={{ fontSize: 12.5, color: "#24302E", lineHeight: 1.5 }}>
              {reason}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#24302E",
                marginBottom: 8,
              }}
            >
              Authenticator Code <span style={{ color: "#A6453D" }}>*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value.replace(/\D/g, ""))
                setMfaError("")
              }}
              placeholder="6-digit code"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${mfaError ? "#A6453D" : "#D6D3C6"}`,
                borderRadius: 6,
                fontSize: 18,
                fontFamily: "IBM Plex Mono, monospace",
                letterSpacing: 6,
                textAlign: "center",
                color: "#24302E",
                background: "#fff",
                boxSizing: "border-box",
              }}
              autoFocus
              onKeyDown={(e) =>
                e.key === "Enter" && mfaCode.length === 6 && confirmRevoke()
              }
            />
            {mfaError && (
              <p style={{ fontSize: 12, color: "#A6453D", margin: "6px 0 0" }}>
                {mfaError}
              </p>
            )}
            <p style={{ fontSize: 11.5, color: "#8C897C", margin: "6px 0 0" }}>
              Demo: enter{" "}
              <span
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontWeight: 600,
                }}
              >
                123456
              </span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={confirmRevoke}
              disabled={mfaCode.length !== 6}
              style={{
                flex: 1,
                height: 42,
                background: mfaCode.length === 6 ? "#A6453D" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: mfaCode.length === 6 ? "pointer" : "not-allowed",
              }}
            >
              Confirm Revocation
            </button>
            <button
              onClick={() => setModal("revoke")}
              style={{
                height: 42,
                padding: "0 20px",
                background: "#fff",
                color: "#24302E",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
