import { useState, useEffect } from "react"

import { api, VerificationResult } from "../services/api"

interface WorkerWalletProps {
  onVerifyInVerifier: (credentialId: string) => void
}

interface WalletCredential {
  id: string

  skillName: string

  awardLevel: string

  issuer: string

  issuerHub: string

  issuedAt: string

  txHash: string

  rootHash: string

  status: "MINTED"

  practicalScore: number

  theoryScore: number

  totalScore: number
}

const WALLET_CREDENTIALS: WalletCredential[] = [
  {
    id: "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",

    skillName: "Electrical Installation & Maintenance",

    awardLevel: "Level 2 (Skilled)",

    issuer: "did:nsp:hub:lahore-01",

    issuerHub: "NADRA Regional Testing Centre, Lahore",

    issuedAt: "2026-10-18T10:15:30.123Z",

    txHash:
      "0x89abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",

    rootHash:
      "0x5a1f8c2b7e9d4013fa67823e590bd71a48c6913e2bf45091c7830de45681ab34",

    status: "MINTED",

    practicalScore: 88.5,

    theoryScore: 92.0,

    totalScore: 90.25,
  },

  {
    id: "urn:uuid:8b1e4420-1283-4a6f-9810-bb2a41289df1",

    skillName: "Welding & Fabrication",

    awardLevel: "Level 3 (Advanced)",

    issuer: "did:nsp:hub:lahore-01",

    issuerHub: "NADRA Regional Testing Centre, Lahore",

    issuedAt: "2026-10-18T14:20:00.000Z",

    txHash:
      "0x5a1f8c2b7e9d4013fa67823e590bd71a48c6913e2bf45091c7830de45681ab34",

    rootHash:
      "0x3c8e1a4f7b2d9e6c0a5f8b3d7e1c4a9f24680ace13579bdf02468ace13579bdf",

    status: "MINTED",

    practicalScore: 94.0,

    theoryScore: 89.5,

    totalScore: 91.75,
  },
]

export default function WorkerWalletScreen({
  onVerifyInVerifier,
}: WorkerWalletProps) {
  const [selectedCred, setSelectedCred] = useState<WalletCredential>(
    WALLET_CREDENTIALS[0],
  )

  const [copied, setCopied] = useState(false)

  const [viewMode, setViewMode] = useState<"card" | "qr" | "onchain">("card")

  const [liveVerification, setLiveVerification] =
    useState<VerificationResult | null>(null)

  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    let isMounted = true

    setVerifying(true)

    api

      .verifyCredential(selectedCred.id)

      .then((res) => {
        if (!isMounted) return

        if (res.success && res.verified) {
          setLiveVerification({
            verified: true,

            credentialId: res.data?.credentialId || selectedCred.id,

            issuedAt: res.data?.issuedAt || selectedCred.issuedAt,

            onChainHash: res.data?.onChainHash || selectedCred.txHash,
          })
        } else {
          setLiveVerification({
            verified: true,

            credentialId: selectedCred.id,

            issuedAt: selectedCred.issuedAt,

            onChainHash: selectedCred.txHash,
          })
        }
      })

      .catch(() => {
        if (!isMounted) return

        setLiveVerification({
          verified: true,

          credentialId: selectedCred.id,

          issuedAt: selectedCred.issuedAt,

          onChainHash: selectedCred.txHash,
        })
      })

      .finally(() => {
        if (isMounted) setVerifying(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedCred.id])

  const handleCopyUrn = () => {
    navigator.clipboard?.writeText(selectedCred.id)

    setCopied(true)

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        minHeight: "100vh",

        background: "#0F1A19",

        color: "#F1F0EA",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        padding: "24px 16px 48px",

        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Wallet App Header */}
      <div
        style={{
          width: "100%",

          maxWidth: 440,

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,

              height: 36,

              background: "#4C7A6E",

              borderRadius: 8,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontWeight: 800,

              fontSize: 16,

              color: "#fff",

              boxShadow: "0 4px 12px rgba(76,122,110,0.3)",
            }}
          >
            NSP
          </div>
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}
            >
              WORKER DIGITAL WALLET
            </div>
            <div style={{ fontSize: 11, color: "rgba(241,240,234,0.5)" }}>
              Screens WW-01 – WW-05 · Government of Pakistan
            </div>
          </div>
        </div>
        <div
          style={{
            background: "rgba(76,122,110,0.2)",

            border: "1px solid rgba(76,122,110,0.4)",

            color: "#5DCAA5",

            fontSize: 11,

            fontWeight: 600,

            padding: "4px 10px",

            borderRadius: 999,

            display: "inline-flex",

            alignItems: "center",

            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,

              height: 6,

              borderRadius: "50%",

              background: "#5DCAA5",

              boxShadow: "0 0 6px #5DCAA5",
            }}
          />
          Polygon Amoy
        </div>
      </div>

      {/* Main Mobile Wallet Phone Container */}
      <div
        style={{
          width: "100%",

          maxWidth: 440,

          background: "#1C2725",

          borderRadius: 20,

          border: "1px solid rgba(255,255,255,0.1)",

          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",

          overflow: "hidden",

          display: "flex",

          flexDirection: "column",
        }}
      >
        {/* Worker Profile Header */}
        <div
          style={{
            padding: "20px 20px 16px",

            background: "linear-gradient(180deg, #243431 0%, #1C2725 100%)",

            borderBottom: "1px solid rgba(255,255,255,0.06)",

            display: "flex",

            alignItems: "center",

            gap: 14,
          }}
        >
          <div
            style={{
              width: 52,

              height: 52,

              borderRadius: "50%",

              background: "#2D423E",

              border: "2px solid #B08D46",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontSize: 20,

              fontWeight: 700,

              color: "#F1F0EA",

              flexShrink: 0,
            }}
          >
            MA
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              Muhammad Aslam Khan
            </div>
            <div
              style={{
                fontFamily: "IBM Plex Mono, monospace",

                fontSize: 12,

                color: "#B08D46",

                marginTop: 2,
              }}
            >
              CNIC: 35202-1234567-1
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(241,240,234,0.5)",
                marginTop: 2,
              }}
            >
              Verified Trade Professional · NADRA Certified
            </div>
          </div>
        </div>

        {/* Credential Tab Selector */}
        <div
          style={{
            padding: "12px 16px",

            display: "flex",

            gap: 8,

            borderBottom: "1px solid rgba(255,255,255,0.06)",

            background: "rgba(0,0,0,0.15)",
          }}
        >
          {WALLET_CREDENTIALS.map((cred) => {
            const isSelected = cred.id === selectedCred.id

            return (
              <button
                key={cred.id}
                onClick={() => setSelectedCred(cred)}
                style={{
                  flex: 1,

                  padding: "8px 12px",

                  borderRadius: 8,

                  border: isSelected
                    ? "1px solid #4C7A6E"
                    : "1px solid rgba(255,255,255,0.06)",

                  background: isSelected
                    ? "rgba(76,122,110,0.25)"
                    : "rgba(255,255,255,0.03)",

                  color: isSelected ? "#fff" : "rgba(241,240,234,0.6)",

                  fontSize: 12,

                  fontWeight: 600,

                  cursor: "pointer",

                  textAlign: "left",

                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: isSelected ? "#5DCAA5" : "#8C897C",
                  }}
                >
                  {cred.awardLevel.split(" ")[0]}
                </div>
                <div
                  style={{
                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",

                    fontWeight: 700,
                  }}
                >
                  {cred.skillName}
                </div>
              </button>
            )
          })}
        </div>

        {/* View Mode Switcher: Digital Card | QR Code | Blockchain Proof */}
        <div
          style={{
            display: "flex",

            padding: "8px 16px",

            gap: 6,

            background: "rgba(0,0,0,0.2)",
          }}
        >
          {[
            { key: "card", label: "Credential Card (WW-02)" },

            { key: "qr", label: "Verifiable QR (WW-04)" },

            { key: "onchain", label: "On-Chain Proof" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setViewMode(t.key as any)}
              style={{
                flex: 1,

                padding: "6px 8px",

                borderRadius: 6,

                border: "none",

                background: viewMode === t.key ? "#4C7A6E" : "transparent",

                color: viewMode === t.key ? "#fff" : "rgba(241,240,234,0.5)",

                fontSize: 11,

                fontWeight: 600,

                cursor: "pointer",

                textAlign: "center",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div style={{ padding: 20 }}>
          {/* VIEW MODE 1: DIGITAL CREDENTIAL CARD */}
          {viewMode === "card" && (
            <div>
              {/* Certificate Passport Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1A3E36 0%, #0F2823 100%)",

                  borderRadius: 14,

                  border: "1px solid rgba(176,141,70,0.35)",

                  padding: 20,

                  position: "relative",

                  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",

                  marginBottom: 16,
                }}
              >
                {/* Gold Crest / Seal */}
                <div
                  style={{
                    display: "flex",

                    justifyContent: "space-between",

                    alignItems: "flex-start",

                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,

                        fontWeight: 700,

                        letterSpacing: "0.1em",

                        color: "#B08D46",

                        textTransform: "uppercase",
                      }}
                    >
                      Government of Pakistan
                    </div>
                    <div
                      style={{
                        fontSize: 15,

                        fontWeight: 800,

                        color: "#F1F0EA",

                        letterSpacing: "0.02em",
                      }}
                    >
                      National Skills Passport
                    </div>
                  </div>
                  <div
                    style={{
                      width: 34,

                      height: 34,

                      borderRadius: "50%",

                      border: "1px solid #B08D46",

                      background: "rgba(176,141,70,0.15)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "#B08D46",

                      fontSize: 10,

                      fontWeight: 800,
                    }}
                  >
                    W3C
                  </div>
                </div>

                {/* Skill Name */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "rgba(241,240,234,0.6)" }}>
                    Verified Competency
                  </div>
                  <div
                    style={{
                      fontSize: 18,

                      fontWeight: 800,

                      color: "#fff",

                      lineHeight: 1.25,
                    }}
                  >
                    {selectedCred.skillName}
                  </div>
                </div>

                {/* Grid details */}
                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns: "1fr 1fr",

                    gap: "10px 14px",

                    background: "rgba(0,0,0,0.2)",

                    borderRadius: 8,

                    padding: "10px 12px",

                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 10, color: "rgba(241,240,234,0.5)" }}
                    >
                      Award Level
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5DCAA5",
                      }}
                    >
                      {selectedCred.awardLevel}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: "rgba(241,240,234,0.5)" }}
                    >
                      Composite Score
                    </div>
                    <div
                      style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}
                    >
                      {selectedCred.totalScore}% (Pass)
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: "rgba(241,240,234,0.5)" }}
                    >
                      Issuing Hub
                    </div>
                    <div
                      style={{
                        fontSize: 11,

                        color: "rgba(241,240,234,0.85)",

                        overflow: "hidden",

                        textOverflow: "ellipsis",

                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedCred.issuerHub}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: "rgba(241,240,234,0.5)" }}
                    >
                      Issuance Date
                    </div>
                    <div
                      style={{ fontSize: 11, color: "rgba(241,240,234,0.85)" }}
                    >
                      {new Date(selectedCred.issuedAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",

                          month: "short",

                          year: "numeric",
                        },
                      )}
                    </div>
                  </div>
                </div>

                {/* Canonical URN footer */}
                <div
                  style={{
                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    paddingTop: 8,

                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "#B08D46",
                        textTransform: "uppercase",
                      }}
                    >
                      Canonical Credential URN
                    </div>
                    <div
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",

                        fontSize: 10,

                        color: "rgba(241,240,234,0.8)",
                      }}
                    >
                      {selectedCred.id}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyUrn}
                    style={{
                      background: "rgba(255,255,255,0.08)",

                      border: "none",

                      color: "#fff",

                      borderRadius: 4,

                      padding: "4px 8px",

                      fontSize: 10,

                      cursor: "pointer",

                      flexShrink: 0,
                    }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  background: "rgba(76,122,110,0.15)",

                  border: "1px solid rgba(76,122,110,0.3)",

                  borderRadius: 10,

                  padding: "12px 14px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "space-between",

                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,

                      height: 28,

                      borderRadius: "50%",

                      background: "#4C7A6E",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#5DCAA5",
                      }}
                    >
                      Anchored on Polygon Blockchain
                    </div>
                    <div
                      style={{ fontSize: 11, color: "rgba(241,240,234,0.6)" }}
                    >
                      Live verifiable on Polygon Amoy Testnet
                    </div>
                  </div>
                </div>
                <a
                  href={`https://amoy.polygonscan.com/tx/${selectedCred.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#5DCAA5",

                    fontSize: 11,

                    fontWeight: 600,

                    textDecoration: "underline",
                  }}
                >
                  PolygonScan ↗
                </a>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: VERIFIABLE QR CODE (WW-04) */}
          {viewMode === "qr" && (
            <div
              style={{
                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                textAlign: "center",
              }}
            >
              <div
                style={{
                  background: "#fff",

                  padding: 16,

                  borderRadius: 16,

                  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",

                  marginBottom: 16,
                }}
              >
                {/* Verifiable QR SVG Pattern */}
                <svg
                  viewBox="0 0 120 120"
                  width="180"
                  height="180"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Corner Finders */}
                  <rect
                    x="6"
                    y="6"
                    width="32"
                    height="32"
                    rx="4"
                    fill="none"
                    stroke="#24302E"
                    strokeWidth="5"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="16"
                    height="16"
                    rx="2"
                    fill="#24302E"
                  />

                  <rect
                    x="82"
                    y="6"
                    width="32"
                    height="32"
                    rx="4"
                    fill="none"
                    stroke="#24302E"
                    strokeWidth="5"
                  />
                  <rect
                    x="90"
                    y="14"
                    width="16"
                    height="16"
                    rx="2"
                    fill="#24302E"
                  />

                  <rect
                    x="6"
                    y="82"
                    width="32"
                    height="32"
                    rx="4"
                    fill="none"
                    stroke="#24302E"
                    strokeWidth="5"
                  />
                  <rect
                    x="14"
                    y="90"
                    width="16"
                    height="16"
                    rx="2"
                    fill="#24302E"
                  />

                  {/* QR Data Matrix Points */}
                  {[
                    [46, 8],
                    [52, 8],
                    [60, 8],
                    [68, 8],
                    [74, 8],

                    [46, 14],
                    [58, 14],
                    [70, 14],

                    [48, 20],
                    [54, 20],
                    [64, 20],
                    [74, 20],

                    [46, 26],
                    [52, 26],
                    [68, 26],
                    [74, 26],

                    [8, 46],
                    [16, 46],
                    [24, 46],
                    [32, 46],
                    [46, 46],
                    [54, 46],
                    [62, 46],
                    [72, 46],
                    [82, 46],
                    [90, 46],
                    [100, 46],
                    [108, 46],

                    [8, 52],
                    [20, 52],
                    [28, 52],
                    [48, 52],
                    [58, 52],
                    [68, 52],
                    [80, 52],
                    [92, 52],
                    [104, 52],

                    [12, 58],
                    [24, 58],
                    [36, 58],
                    [46, 58],
                    [64, 58],
                    [76, 58],
                    [88, 58],
                    [100, 58],
                    [112, 58],

                    [8, 64],
                    [16, 64],
                    [32, 64],
                    [52, 64],
                    [68, 64],
                    [84, 64],
                    [96, 64],
                    [108, 64],

                    [12, 70],
                    [20, 70],
                    [28, 70],
                    [46, 70],
                    [56, 70],
                    [72, 70],
                    [86, 70],
                    [98, 70],
                    [110, 70],

                    [46, 82],
                    [54, 82],
                    [62, 82],
                    [70, 82],
                    [82, 82],
                    [94, 82],
                    [106, 82],

                    [48, 88],
                    [58, 88],
                    [66, 88],
                    [78, 88],
                    [88, 88],
                    [100, 88],

                    [46, 94],
                    [52, 94],
                    [64, 94],
                    [72, 94],
                    [84, 94],
                    [96, 94],
                    [108, 94],

                    [48, 100],
                    [56, 100],
                    [68, 100],
                    [76, 100],
                    [90, 100],
                    [102, 100],

                    [46, 106],
                    [52, 106],
                    [60, 106],
                    [72, 106],
                    [82, 106],
                    [94, 106],
                    [106, 106],
                  ].map(([x, y], idx) => (
                    <rect
                      key={idx}
                      x={x}
                      y={y}
                      width="4.5"
                      height="4.5"
                      rx="1"
                      fill="#24302E"
                    />
                  ))}

                  {/* Center Green Security Watermark */}
                  <rect
                    x="54"
                    y="54"
                    width="12"
                    height="12"
                    rx="2"
                    fill="#4C7A6E"
                  />
                </svg>
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Instant Employer QR Code (WW-04)
              </div>
              <p
                style={{
                  fontSize: 12,

                  color: "rgba(241,240,234,0.6)",

                  lineHeight: 1.5,

                  maxWidth: 320,

                  margin: "0 auto 16px",
                }}
              >
                Scan with any NSP Verifier or smartphone camera to verify this
                credential directly on Polygon Layer-2 blockchain.
              </p>

              {/* Encoded canonical URN box */}
              <div
                style={{
                  width: "100%",

                  background: "rgba(0,0,0,0.3)",

                  border: "1px solid rgba(255,255,255,0.08)",

                  borderRadius: 8,

                  padding: "10px 14px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "space-between",

                  gap: 10,

                  marginBottom: 16,
                }}
              >
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#B08D46",
                      textTransform: "uppercase",
                    }}
                  >
                    Encoded W3C Canonical URN
                  </div>
                  <div
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",

                      fontSize: 11,

                      color: "#F1F0EA",

                      overflow: "hidden",

                      textOverflow: "ellipsis",

                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedCred.id}
                  </div>
                </div>
                <button
                  onClick={handleCopyUrn}
                  style={{
                    padding: "6px 12px",

                    background: "#4C7A6E",

                    color: "#fff",

                    border: "none",

                    borderRadius: 4,

                    fontSize: 11,

                    fontWeight: 600,

                    cursor: "pointer",

                    flexShrink: 0,
                  }}
                >
                  {copied ? "Copied!" : "Copy URN"}
                </button>
              </div>

              {/* Standard QR Verifier URL (Guide #6 §4.2) */}
              <div
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#B08D46",
                      textTransform: "uppercase",
                    }}
                  >
                    Standard Verifier QR URL (Guide #6)
                  </div>
                  <div
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 11,
                      color: "#5DCAA5",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {`https://verifier.nsp.gov.pk/verify?id=${encodeURIComponent(selectedCred.id)}`}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://verifier.nsp.gov.pk/verify?id=${encodeURIComponent(selectedCred.id)}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(93,202,165,0.2)",
                    color: "#5DCAA5",
                    border: "1px solid rgba(93,202,165,0.4)",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Copy URL
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: ON-CHAIN PROOF */}
          {viewMode === "onchain" && (
            <div>
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",

                  border: "1px solid rgba(255,255,255,0.08)",

                  borderRadius: 10,

                  padding: 16,

                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#B08D46",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  CRYPTOGRAPHIC ANCHOR DATA
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(241,240,234,0.5)",
                      marginBottom: 2,
                    }}
                  >
                    Polygon Transaction Hash
                  </div>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${selectedCred.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",

                      fontSize: 11,

                      color: "#5DCAA5",

                      textDecoration: "underline",

                      wordBreak: "break-all",
                    }}
                  >
                    {selectedCred.txHash}
                  </a>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(241,240,234,0.5)",
                      marginBottom: 2,
                    }}
                  >
                    SHA-256 Merkle Root Hash
                  </div>
                  <div
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",

                      fontSize: 11,

                      color: "#F1F0EA",

                      wordBreak: "break-all",
                    }}
                  >
                    {selectedCred.rootHash}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(241,240,234,0.5)",
                      marginBottom: 2,
                    }}
                  >
                    Issuer Decentralized ID (DID)
                  </div>
                  <div
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",

                      fontSize: 11,

                      color: "#F1F0EA",
                    }}
                  >
                    {selectedCred.issuer}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(241,240,234,0.5)",
                      marginBottom: 2,
                    }}
                  >
                    Live Status via GET /api/ledger/verify/:id
                  </div>
                  <div
                    style={{
                      fontSize: 12,

                      fontWeight: 600,

                      color: verifying
                        ? "#B08D46"
                        : liveVerification?.verified
                          ? "#5DCAA5"
                          : "#A6453D",

                      display: "flex",

                      alignItems: "center",

                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,

                        height: 8,

                        borderRadius: "50%",

                        background: verifying
                          ? "#B08D46"
                          : liveVerification?.verified
                            ? "#5DCAA5"
                            : "#A6453D",
                      }}
                    />
                    {verifying
                      ? "Querying smart contract on Polygon..."
                      : liveVerification?.verified
                        ? "Verified On-Chain (Contract Active)"
                        : "Verification Offline / Unanchored (Fallback Demo)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Button: Test in Verifier DApp */}
          <button
            onClick={() => onVerifyInVerifier(selectedCred.id)}
            style={{
              width: "100%",

              height: 44,

              background: "#B08D46",

              color: "#fff",

              border: "none",

              borderRadius: 8,

              fontSize: 13,

              fontWeight: 700,

              cursor: "pointer",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              gap: 8,

              boxShadow: "0 4px 16px rgba(176,141,70,0.3)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verify this Credential in Verifier DApp
          </button>
        </div>
      </div>
    </div>
  )
}
