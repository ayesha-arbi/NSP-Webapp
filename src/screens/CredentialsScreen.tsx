import { useState } from "react"

type CredentialStatus = "queued" | "minting" | "confirmed" | "failed"
type ModalType = "none" | "mint-confirm" | "revoke" | "detail" | "retry"

interface Credential {
  id: string
  candidate: string
  cnic: string
  trade: string
  hub: string
  approvedAt: string
  txnId?: string
  mintedAt?: string
  status: CredentialStatus
  errorMsg?: string
  blockHeight?: number
}

const CREDENTIALS: Credential[] = [
  {
    id: "CRED-2026-00091",
    candidate: "Tariq Mehmood",
    cnic: "35204-3334455-5",
    trade: "Plumbing",
    hub: "Lahore-C01",
    approvedAt: "2026-08-25 10:12",
    txnId: "0x7f2a9c1e4b3d6f8a2e5c7b9d1f3a5e7c",
    mintedAt: "2026-08-25 10:14",
    status: "confirmed",
    blockHeight: 4821034,
  },
  {
    id: "CRED-2026-00090",
    candidate: "Ali Nawaz",
    cnic: "35202-5551234-3",
    trade: "Welding",
    hub: "Lahore-C01",
    approvedAt: "2026-08-24 14:20",
    txnId: "0x3c8e1a4f7b2d9e6c0a5f8b3d7e1c4a9f",
    mintedAt: "2026-08-24 14:22",
    status: "confirmed",
    blockHeight: 4820918,
  },
  {
    id: "CRED-2026-00089",
    candidate: "Amna Siddiqui",
    cnic: "35206-2223334-7",
    trade: "HVAC Technician",
    hub: "Karachi-C02",
    approvedAt: "2026-08-26 08:45",
    status: "queued",
  },
  {
    id: "CRED-2026-00088",
    candidate: "Imran Gul",
    cnic: "35207-5556667-8",
    trade: "Auto Mechanic",
    hub: "Islamabad-C03",
    approvedAt: "2026-08-26 08:31",
    status: "queued",
  },
  {
    id: "CRED-2026-00087",
    candidate: "Nadia Hassan",
    cnic: "35208-1112223-9",
    trade: "Electrician",
    hub: "Faisalabad-C04",
    approvedAt: "2026-08-25 16:00",
    status: "failed",
    errorMsg:
      "Gas price spike — transaction reverted. Retry when network fees normalize.",
  },
  {
    id: "CRED-2026-00086",
    candidate: "Kamran Shah",
    cnic: "35209-4445556-0",
    trade: "Carpentry",
    hub: "Peshawar-C05",
    approvedAt: "2026-08-25 14:33",
    status: "minting",
  },
  {
    id: "CRED-2026-00085",
    candidate: "Farida Khatun",
    cnic: "35210-7778880-1",
    trade: "Tailoring",
    hub: "Lahore-C01",
    approvedAt: "2026-08-25 13:10",
    txnId: "0x1a9f3c7e2b8d4f6a0c5e8b3d7f1a4c9e",
    mintedAt: "2026-08-25 13:12",
    status: "confirmed",
    blockHeight: 4820844,
  },
  {
    id: "CRED-2026-00084",
    candidate: "Usman Bhatti",
    cnic: "35211-3334441-2",
    trade: "Masonry",
    hub: "Karachi-C02",
    approvedAt: "2026-08-24 11:55",
    status: "failed",
    errorMsg: "Node timeout. Smart contract call failed after 3 retries.",
  },
]

function StatusPill({ status }: { status: CredentialStatus }) {
  const map = {
    queued: {
      bg: "#F1E7D2",
      text: "#8C6F35",
      label: "In Progress",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
        </svg>
      ),
    },
    minting: {
      bg: "#F1E7D2",
      text: "#8C6F35",
      label: "In Progress",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
        </svg>
      ),
    },
    confirmed: {
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
    failed: {
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
  }
  const s = map[status]
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
          maxWidth: 560,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function CredentialsScreen() {
  const [creds, setCreds] = useState<Credential[]>(CREDENTIALS)
  const [tab, setTab] = useState<"queue" | "confirmed" | "failed">("queue")
  const [selected, setSelected] = useState<Credential | null>(null)
  const [modal, setModal] = useState<ModalType>("none")
  const [revokeReason, setRevokeReason] = useState("")

  const queued = creds.filter(
    (c) => c.status === "queued" || c.status === "minting",
  )
  const confirmed = creds.filter((c) => c.status === "confirmed")
  const failed = creds.filter((c) => c.status === "failed")

  function handleMint(id: string) {
    setCreds((cs) =>
      cs.map((c) => (c.id === id ? { ...c, status: "minting" } : c)),
    )
    setModal("none")
    setTimeout(() => {
      setCreds((cs) =>
        cs.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "confirmed",
                txnId: "0x" + Math.random().toString(16).slice(2, 34),
                mintedAt: new Date().toLocaleString(),
                blockHeight: 4821100 + Math.floor(Math.random() * 100),
              }
            : c,
        ),
      )
    }, 2000)
  }

  function handleRevoke() {
    if (!selected || !revokeReason) return
    setCreds((cs) =>
      cs.map((c) =>
        c.id === selected.id
          ? { ...c, status: "failed", errorMsg: `Revoked: ${revokeReason}` }
          : c,
      ),
    )
    setModal("none")
    setRevokeReason("")
  }

  function handleRetry(id: string) {
    setCreds((cs) =>
      cs.map((c) =>
        c.id === id ? { ...c, status: "queued", errorMsg: undefined } : c,
      ),
    )
    setModal("none")
  }

  const tabData =
    tab === "queue" ? queued : tab === "confirmed" ? confirmed : failed

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
          Credentials
        </h1>
        <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
          Manage on-chain credential minting, confirmations, and revocations.
        </p>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Minting Queue",
            value: queued.length,
            bg: "#FCE8D6",
            color: "#5C3300",
          },
          {
            label: "Confirmed On-Chain",
            value: confirmed.length,
            bg: "#EAF3DE",
            color: "#173404",
          },
          {
            label: "Failed",
            value: failed.length,
            bg: "#FCEBEB",
            color: "#501313",
          },
          {
            label: "Total Issued",
            value: creds.length,
            bg: "#E4EEFC",
            color: "#123B7A",
          },
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

      {/* Tabs */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #D6D3C6",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #D6D3C6",
            padding: "0 24px",
          }}
        >
          {([
            { key: "queue", label: `Minting Queue (${queued.length})` },
            { key: "confirmed", label: `Confirmed (${confirmed.length})` },
            { key: "failed", label: `Failed (${failed.length})` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                height: 44,
                padding: "0 16px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${
                  tab === t.key ? "#4C7A6E" : "transparent"
                }`,
                color: tab === t.key ? "#4C7A6E" : "#5C5A50",
                fontSize: 13,
                fontWeight: tab === t.key ? 600 : 400,
                cursor: "pointer",
                marginRight: 8,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F0EA" }}>
              {tab === "queue" &&
                [
                  "Credential ID",
                  "Candidate",
                  "Trade",
                  "Hub",
                  "Approved At",
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
              {tab === "confirmed" &&
                [
                  "Credential ID",
                  "Candidate",
                  "Trade",
                  "Transaction ID",
                  "Minted At",
                  "Block",
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
              {tab === "failed" &&
                [
                  "Credential ID",
                  "Candidate",
                  "Trade",
                  "Hub",
                  "Error",
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
            {tabData.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F1EFE8" }}>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    color: "#5C5A50",
                    fontFamily: "IBM Plex Mono, monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.id}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#24302E" }}
                  >
                    {c.candidate}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8C897C",
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    {c.cnic}
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "#5C5A50",
                  }}
                >
                  {c.trade}
                </td>

                {tab === "queue" && (
                  <>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#5C5A50",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {c.hub}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#8C897C",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {c.approvedAt}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusPill status={c.status} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {c.status === "queued" && (
                        <button
                          onClick={() => {
                            setSelected(c)
                            setModal("mint-confirm")
                          }}
                          style={{
                            height: 28,
                            padding: "0 12px",
                            background: "#4C7A6E",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Mint Now
                        </button>
                      )}
                      {c.status === "minting" && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#B08D46",
                            fontWeight: 500,
                          }}
                        >
                          Minting…
                        </span>
                      )}
                    </td>
                  </>
                )}

                {tab === "confirmed" && (
                  <>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 11,
                        color: "#5C5A50",
                        fontFamily: "IBM Plex Mono, monospace",
                        maxWidth: 180,
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.txnId}
                      </span>
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
                      {c.mintedAt}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#5C5A50",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {c.blockHeight?.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => {
                            setSelected(c)
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
                        <button
                          onClick={() => {
                            setSelected(c)
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
                      </div>
                    </td>
                  </>
                )}

                {tab === "failed" && (
                  <>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#5C5A50",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {c.hub}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#501313",
                        maxWidth: 240,
                      }}
                    >
                      {c.errorMsg}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => {
                          setSelected(c)
                          setModal("retry")
                        }}
                        style={{
                          height: 28,
                          padding: "0 12px",
                          background: "#4C7A6E",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Retry
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {tabData.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "#8C897C",
                  }}
                >
                  No records in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mint Confirm Modal */}
      {modal === "mint-confirm" && selected && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#E4EEFC",
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
                stroke="#2E6FE0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
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
                Confirm Credential Mint
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                This will submit a minting transaction to the national
                blockchain ledger.
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 24px",
              }}
            >
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Candidate
                </div>
                <div style={{ color: "#24302E", fontWeight: 600 }}>
                  {selected.candidate}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>CNIC</div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {selected.cnic}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Credential ID
                </div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {selected.id}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>Trade</div>
                <div style={{ color: "#24302E" }}>{selected.trade}</div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: "#FCE8D6",
              border: "1px solid #F5C89A",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 24,
              fontSize: 13,
              color: "#5C3300",
            }}
          >
            Minting is permanent and cannot be undone. The credential will be
            publicly verifiable on-chain.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleMint(selected.id)}
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
              Confirm Mint
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

      {/* Verifier / Credential Detail View */}
      {modal === "detail" && selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,48,46,0.60)",
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
              borderRadius: 10,
              maxWidth: 640,
              width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
              maxHeight: "94vh",
              overflowY: "auto",
            }}
          >
            {/* ── Verification banner ── */}
            <div
              style={{
                borderLeft: "5px solid #B08D46",
                background: "#EAF3DE",
                padding: "20px 28px",
                borderRadius: "10px 10px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "#4C7A6E",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <polyline
                    points="5,12 10,17 20,7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div
                  className="display"
                  style={{
                    fontSize: 26,
                    color: "#0F3A04",
                    lineHeight: 1.15,
                    letterSpacing: -0.2,
                  }}
                >
                  Credential Verified
                </div>
                <div style={{ fontSize: 12.5, color: "#2B6010", marginTop: 2 }}>
                  Valid · Confirmed on the National Blockchain Ledger
                </div>
              </div>
            </div>

            {/* ── Header: issuer mark ── */}
            <div
              style={{
                padding: "14px 28px",
                borderBottom: "1px solid #F1EFE8",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: "#4C7A6E",
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#4C7A6E",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                National Skills Passport
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "#8C897C",
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                {selected.id}
              </span>
            </div>

            {/* ── Main content ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "148px 1fr",
                gap: 0,
              }}
            >
              {/* QR placeholder */}
              <div
                style={{
                  padding: "24px 20px 24px 28px",
                  borderRight: "1px solid #F1EFE8",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 108,
                    height: 108,
                    border: "1.5px solid #D6D3C6",
                    borderRadius: 6,
                    padding: 6,
                    background: "#fff",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* QR code pattern — stylised but recognisable */}
                  <svg
                    viewBox="0 0 100 100"
                    width="96"
                    height="96"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Corner finders */}
                    <rect
                      x="4"
                      y="4"
                      width="28"
                      height="28"
                      rx="3"
                      fill="none"
                      stroke="#4C7A6E"
                      strokeWidth="5"
                    />
                    <rect
                      x="10"
                      y="10"
                      width="16"
                      height="16"
                      rx="1"
                      fill="#4C7A6E"
                    />
                    <rect
                      x="68"
                      y="4"
                      width="28"
                      height="28"
                      rx="3"
                      fill="none"
                      stroke="#4C7A6E"
                      strokeWidth="5"
                    />
                    <rect
                      x="74"
                      y="10"
                      width="16"
                      height="16"
                      rx="1"
                      fill="#4C7A6E"
                    />
                    <rect
                      x="4"
                      y="68"
                      width="28"
                      height="28"
                      rx="3"
                      fill="none"
                      stroke="#4C7A6E"
                      strokeWidth="5"
                    />
                    <rect
                      x="10"
                      y="74"
                      width="16"
                      height="16"
                      rx="1"
                      fill="#4C7A6E"
                    />
                    {/* Data cells */}
                    {[
                      [40, 4],
                      [44, 4],
                      [48, 4],
                      [56, 4],
                      [60, 4],
                      [40, 10],
                      [52, 10],
                      [64, 10],
                      [44, 16],
                      [48, 16],
                      [56, 16],
                      [64, 16],
                      [40, 22],
                      [44, 22],
                      [60, 22],
                      [64, 22],
                      [4, 40],
                      [12, 40],
                      [20, 40],
                      [28, 40],
                      [40, 40],
                      [52, 40],
                      [60, 40],
                      [68, 40],
                      [76, 40],
                      [84, 40],
                      [92, 40],
                      [4, 44],
                      [16, 44],
                      [24, 44],
                      [44, 44],
                      [52, 44],
                      [64, 44],
                      [76, 44],
                      [88, 44],
                      [8, 48],
                      [20, 48],
                      [32, 48],
                      [40, 48],
                      [56, 48],
                      [68, 48],
                      [80, 48],
                      [92, 48],
                      [4, 52],
                      [12, 52],
                      [28, 52],
                      [44, 52],
                      [60, 52],
                      [72, 52],
                      [84, 52],
                      [8, 56],
                      [16, 56],
                      [24, 56],
                      [40, 56],
                      [52, 56],
                      [64, 56],
                      [76, 56],
                      [88, 56],
                      [96, 56],
                      [40, 60],
                      [48, 60],
                      [56, 60],
                      [64, 60],
                      [72, 60],
                      [80, 60],
                      [40, 68],
                      [52, 68],
                      [60, 68],
                      [68, 68],
                      [80, 68],
                      [88, 68],
                      [40, 72],
                      [44, 72],
                      [52, 72],
                      [64, 72],
                      [76, 72],
                      [92, 72],
                      [40, 76],
                      [48, 76],
                      [60, 76],
                      [68, 76],
                      [84, 76],
                      [40, 80],
                      [44, 80],
                      [52, 80],
                      [64, 80],
                      [72, 80],
                      [80, 80],
                      [88, 80],
                      [40, 84],
                      [56, 84],
                      [68, 84],
                      [76, 84],
                      [92, 84],
                      [40, 88],
                      [44, 88],
                      [48, 88],
                      [60, 88],
                      [68, 88],
                      [80, 88],
                      [40, 92],
                      [52, 92],
                      [60, 92],
                      [72, 92],
                      [84, 92],
                      [92, 92],
                    ].map(([x, y], i) => (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width="4"
                        height="4"
                        fill="#4C7A6E"
                      />
                    ))}
                    {/* Amber accent dot */}
                    <rect
                      x="46"
                      y="46"
                      width="8"
                      height="8"
                      rx="1"
                      fill="#B08D46"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: "#8C897C",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  Scan to verify on NSP portal
                </div>
              </div>

              {/* Credential fields */}
              <div style={{ padding: "24px 28px 20px" }}>
                <div
                  className="display"
                  style={{
                    fontSize: 21,
                    color: "#24302E",
                    marginBottom: 2,
                    letterSpacing: -0.1,
                  }}
                >
                  {selected.candidate}
                </div>
                <div
                  style={{
                    color: "#B08D46",
                    fontWeight: 700,
                    marginBottom: 16,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                    fontSize: 11,
                  }}
                >
                  {selected.trade}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 20px",
                  }}
                >
                  {[
                    {
                      label: "National ID (CNIC)",
                      val: selected.cnic,
                      mono: true,
                    },
                    { label: "Testing Hub", val: selected.hub, mono: true },
                    {
                      label: "Assessment Approved",
                      val: selected.approvedAt?.slice(0, 10) ?? "—",
                      mono: true,
                    },
                    {
                      label: "Credential Issued",
                      val: selected.mintedAt?.slice(0, 10) ?? "—",
                      mono: true,
                    },
                    {
                      label: "Block Height",
                      val: selected.blockHeight?.toLocaleString() ?? "—",
                      mono: true,
                    },
                    { label: "Valid Until", val: "2028-08-25", mono: true },
                  ].map((f) => (
                    <div key={f.label}>
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
                        {f.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#24302E",
                          fontFamily: f.mono
                            ? "IBM Plex Mono, monospace"
                            : "Inter, sans-serif",
                        }}
                      >
                        {f.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Blockchain anchor ── */}
            <div
              style={{
                margin: "0 28px",
                padding: "14px 16px",
                background: "#F1F0EA",
                border: "1px solid #E5E3DC",
                borderRadius: 6,
                marginBottom: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#8C897C",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                On-Chain Transaction Record
              </div>
              <div
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 11,
                  color: "#24302E",
                  wordBreak: "break-all",
                  lineHeight: 1.6,
                }}
              >
                {selected.txnId}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#8C897C",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                This credential is permanently anchored to the National
                Blockchain Ledger and cannot be altered or deleted.
              </div>
            </div>

            {/* ── Admin actions ── */}
            <div
              style={{
                padding: "16px 28px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #F1EFE8",
                marginTop: 16,
              }}
            >
              <div style={{ fontSize: 11, color: "#8C897C" }}>
                Issuer Portal — Internal Admin View
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setRevokeReason("")
                    setModal("revoke")
                  }}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    background: "#fff",
                    color: "#8C3B34",
                    border: "1px solid #A6453D",
                    borderRadius: 6,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Revoke Credential
                </button>
                <button
                  onClick={() => setModal("none")}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    background: "#fff",
                    color: "#24302E",
                    border: "1px solid #D6D3C6",
                    borderRadius: 6,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
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
                Revoke Credential
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                This action is irreversible and will invalidate the credential
                on-chain.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#FCEBEB",
              border: "1px solid #FCCACA",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 13,
              color: "#501313",
            }}
          >
            <strong>Warning:</strong> Revoking a credential permanently marks it
            as invalid on the national blockchain ledger. The holder will no
            longer be able to present this credential for verification.
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
              {selected.candidate}
            </div>
            <div style={{ color: "#5C5A50" }}>
              {selected.trade} · {selected.id}
            </div>
            <div
              style={{
                color: "#8C897C",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {selected.cnic}
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
              rows={3}
              placeholder="Provide a detailed reason for revocation…"
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
              Revoke Credential
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

      {/* Retry Modal */}
      {modal === "retry" && selected && (
        <ModalOverlay>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#24302E",
              margin: "0 0 8px",
            }}
          >
            Retry Failed Transaction
          </h2>
          <p style={{ fontSize: 13, color: "#5C5A50", margin: "0 0 20px" }}>
            This will re-queue the credential for minting.
          </p>
          <div
            style={{
              background: "#FCEBEB",
              border: "1px solid #FCCACA",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 13,
              color: "#501313",
            }}
          >
            <strong>Failure reason:</strong> {selected.errorMsg}
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, color: "#24302E", marginBottom: 2 }}>
              {selected.candidate}
            </div>
            <div style={{ color: "#5C5A50" }}>
              {selected.trade} · {selected.id}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleRetry(selected.id)}
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
              Re-queue for Minting
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
    </div>
  )
}
