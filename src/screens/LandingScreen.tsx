import NavBar from "../components/NavBar"

import Footer from "../components/Footer"

import { BtnPrimary, BtnSecondary } from "../components/Btn"

interface Props {
  onManualEntry: () => void

  onQRScan: () => void
}

export default function LandingScreen({ onManualEntry, onQRScan }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F1F0EA",
      }}
    >
      <NavBar />

      <div style={{ background: "#24302E", padding: "48px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              color: "#B08D46",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Employer Verification
          </p>
          <h1
            style={{
              color: "#F1F0EA",
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 12,
              maxWidth: 540,
            }}
          >
            Verify a NSP HUNAR
          </h1>
          <p
            style={{
              color: "rgba(241,240,234,0.55)",
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 480,
            }}
          >
            Check whether a worker's credential is valid and active against
            Pakistan's national blockchain ledger. No login required.
          </p>
        </div>
      </div>
      <div style={{ height: 3, background: "#B08D46", flexShrink: 0 }} />

      <main style={{ flex: 1, padding: "40px 32px 64px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Top: method cards + sidebar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "#8C897C",
                  textTransform: "uppercase",
                }}
              >
                Choose a verification method
              </p>

              {/* Scan QR — PRIMARY */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #D6D3C6",
                  borderRadius: 8,

                  padding: "24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#F1F0EA",
                    border: "1px solid #D6D3C6",

                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect
                      x="2"
                      y="2"
                      width="7"
                      height="7"
                      rx="0.5"
                      stroke="#24302E"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <rect
                      x="13"
                      y="2"
                      width="7"
                      height="7"
                      rx="0.5"
                      stroke="#24302E"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <rect
                      x="2"
                      y="13"
                      width="7"
                      height="7"
                      rx="0.5"
                      stroke="#24302E"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <rect
                      x="3.5"
                      y="3.5"
                      width="4"
                      height="4"
                      rx="0.5"
                      fill="#24302E"
                    />
                    <rect
                      x="14.5"
                      y="3.5"
                      width="4"
                      height="4"
                      rx="0.5"
                      fill="#24302E"
                    />
                    <rect
                      x="3.5"
                      y="14.5"
                      width="4"
                      height="4"
                      rx="0.5"
                      fill="#24302E"
                    />
                    <path
                      d="M13 14h3M16 14v3M13 17h3"
                      stroke="#24302E"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#24302E",
                      marginBottom: 6,
                    }}
                  >
                    Scan QR Code
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#5C5A50",
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    Use your device camera to scan the QR code on the worker's
                    certificate or digital wallet.
                  </p>
                  <BtnPrimary onClick={onQRScan}>
                    Scan QR Code
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7h8M8 4l3 3-3 3"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </BtnPrimary>
                </div>
              </div>

              {/* Enter ID — SECONDARY */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #D6D3C6",
                  borderRadius: 8,

                  padding: "24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#F1F0EA",
                    border: "1px solid #D6D3C6",

                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect
                      x="3"
                      y="6"
                      width="16"
                      height="10"
                      rx="1.5"
                      stroke="#24302E"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M7 11h8M11 8v6"
                      stroke="#24302E"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#24302E",
                      marginBottom: 6,
                    }}
                  >
                    Enter Credential ID
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#5C5A50",
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    Type the NSP Credential ID printed on the certificate or
                    shown in the worker's digital wallet.
                  </p>
                  <BtnSecondary onClick={onManualEntry}>
                    Enter Credential ID
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7h8M8 4l3 3-3 3"
                        stroke="#24302E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </BtnSecondary>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #D6D3C6",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #D6D3C6",
                    background: "#F1F0EA",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#8C897C",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Before you start
                  </span>
                </div>
                <div
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {[
                    "No account or login is required.",

                    "You need the credential ID from the worker's certificate.",

                    "Credentials are verified against the national blockchain ledger.",

                    "This service is for employers and verifiers only.",
                  ].map((t) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#B08D46",

                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path
                            d="M2 4.5l1.8 1.8L7 3"
                            stroke="#24302E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#5C5A50",
                          lineHeight: 1.55,
                        }}
                      >
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#24302E",
                  borderRadius: 8,
                  padding: "20px",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#B08D46",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Takes less than 30 seconds
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(241,240,234,0.5)",
                    lineHeight: 1.6,
                  }}
                >
                  No login. No account. Results are instant.
                </p>
              </div>
            </div>
          </div>

          {/* How it works — full width */}
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.07em",
                color: "#8C897C",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              How it works
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {[
                {
                  step: "01",
                  title: "Choose a method",
                  desc: "Scan the QR code on the worker's certificate or type the Credential ID directly.",
                },

                {
                  step: "02",
                  title: "We check the ledger",
                  desc: "The credential hash is recomputed and compared against the on-chain record in the blockchain ledger.",
                },

                {
                  step: "03",
                  title: "Get an instant result",
                  desc: "The result displays as Verified, Tampered, or Revoked with full credential details and a copy-able receipt.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #D6D3C6",
                    borderRadius: 8,
                    padding: "28px 24px",

                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#D6D3C6",
                      letterSpacing: "0.04em",
                      display: "block",
                      marginBottom: 14,
                    }}
                  >
                    {item.step}
                  </span>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#24302E",
                      marginBottom: 10,
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{ fontSize: 13, color: "#5C5A50", lineHeight: 1.7 }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
