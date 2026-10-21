import { useState } from "react"

import NavBar from "../components/NavBar"

import Footer from "../components/Footer"

import { BtnPrimary, BtnSecondary } from "../components/Btn"

interface Props {
  onBack: () => void

  onManualEntry: () => void

  onScanSuccess: (credentialId: string) => void
}

type ScanState = "permission" | "scanning" | "error-notdetected" | "error-format"

export default function QRScannerScreen({
  onBack,
  onManualEntry,
  onScanSuccess,
}: Props) {
  const [scanState, setScanState] = useState<ScanState>("permission")

  const [denied, setDenied] = useState(false)

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F1F0EA",
      }}
    >
      <NavBar
        breadcrumbs={[
          { label: "Verify a Credential", onClick: onBack },

          { label: "Scan QR Code" },
        ]}
      />

      <div style={{ background: "#24302E", padding: "40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",

              border: "1px solid rgba(241,240,234,0.2)",
              borderRadius: 6,
              padding: "6px 12px",

              color: "rgba(241,240,234,0.7)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",

              marginBottom: 20,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(241,240,234,0.4)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(241,240,234,0.2)")
            }
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M8 2.5L4.5 6.5L8 10.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
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
            Credential Verification
          </p>
          <h1
            style={{
              color: "#F1F0EA",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Scan QR Code
          </h1>
          <p
            style={{
              color: "rgba(241,240,234,0.55)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Hold the worker's certificate or digital wallet up to your camera.
          </p>
        </div>
      </div>
      <div style={{ height: 3, background: "#B08D46", flexShrink: 0 }} />

      <main style={{ flex: 1, padding: "40px 32px 64px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {/* Scanner card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Permission request */}
            {scanState === "permission" && !denied && (
              <>
                <div
                  style={{
                    background: "#24302E",
                    flex: 1,

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",

                      border: "2px solid rgba(176,141,70,0.4)",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle
                        cx="16"
                        cy="13"
                        r="5"
                        stroke="#B08D46"
                        strokeWidth="1.8"
                        fill="none"
                      />
                      <path
                        d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10"
                        stroke="#B08D46"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p
                    style={{
                      color: "rgba(241,240,234,0.5)",
                      fontSize: 14,
                      textAlign: "center",
                      maxWidth: 260,
                      lineHeight: 1.6,
                    }}
                  >
                    Camera access is needed to scan the QR code
                  </p>
                </div>
                <div
                  style={{ padding: "24px", borderTop: "1px solid #D6D3C6" }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      color: "#5C5A50",
                      lineHeight: 1.6,
                      marginBottom: 20,
                    }}
                  >
                    Allow camera access to scan QR codes. Your camera feed is
                    never stored or transmitted.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <BtnPrimary onClick={() => setScanState("scanning")}>
                      Allow camera access
                    </BtnPrimary>
                    <BtnSecondary onClick={() => setDenied(true)}>
                      Cancel
                    </BtnSecondary>
                  </div>
                </div>
              </>
            )}

            {/* Permission denied */}
            {denied && (
              <div style={{ padding: "24px", borderLeft: "3px solid #A6453D" }}>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#24302E",
                    marginBottom: 8,
                  }}
                >
                  Camera access denied
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#5C5A50",
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  Camera permission was not granted. You can allow it in your
                  browser settings, or use a Credential ID instead.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <BtnPrimary
                    onClick={() => {
                      setDenied(false)
                      setScanState("permission")
                    }}
                  >
                    Try again
                  </BtnPrimary>
                  <BtnSecondary onClick={onManualEntry}>
                    Enter Credential ID instead
                  </BtnSecondary>
                </div>
              </div>
            )}

            {/* Active scanning */}
            {scanState === "scanning" && (
              <>
                <div
                  style={{
                    background: "#24302E",
                    flex: 1,

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,

                    position: "relative",
                  }}
                >
                  <div
                    style={{ position: "relative", width: 220, height: 220 }}
                  >
                    {[
                      {
                        top: 0,
                        left: 0,
                        borderTop: "3px solid #B08D46",
                        borderLeft: "3px solid #B08D46",
                      },

                      {
                        top: 0,
                        right: 0,
                        borderTop: "3px solid #B08D46",
                        borderRight: "3px solid #B08D46",
                      },

                      {
                        bottom: 0,
                        left: 0,
                        borderBottom: "3px solid #B08D46",
                        borderLeft: "3px solid #B08D46",
                      },

                      {
                        bottom: 0,
                        right: 0,
                        borderBottom: "3px solid #B08D46",
                        borderRight: "3px solid #B08D46",
                      },
                    ].map((s, i) => (
                      <div
                        key={i}
                        style={
                          {
                            position: "absolute",
                            width: 28,
                            height: 28,
                            ...s,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                    <div
                      style={{
                        position: "absolute",
                        left: 4,
                        right: 4,
                        height: 2,

                        background: "#B08D46",

                        animation: "scanline 1.8s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 24,
                        display: "grid",
                        gridTemplateColumns: "repeat(5,1fr)",
                        gap: 3,
                        opacity: 0.08,
                      }}
                    >
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          style={{ background: "white", borderRadius: 1 }}
                        />
                      ))}
                    </div>
                  </div>
                  <p
                    style={{
                      color: "rgba(241,240,234,0.6)",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Position the QR code inside the frame
                  </p>
                </div>
                <div
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    borderTop: "1px solid #D6D3C6",
                  }}
                >
                  <BtnSecondary onClick={() => setScanState("permission")}>
                    Cancel
                  </BtnSecondary>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <BtnSecondary
                      onClick={() => setScanState("error-notdetected")}
                    >
                      Simulate error
                    </BtnSecondary>
                    <BtnSecondary
                      onClick={() => onScanSuccess("NSP-004821")}
                    >
                      Scan Legacy ID
                    </BtnSecondary>
                    <BtnPrimary
                      onClick={() =>
                        onScanSuccess(
                          "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",
                        )
                      }
                    >
                      Scan Guide #5 URN
                    </BtnPrimary>
                  </div>
                </div>
              </>
            )}

            {/* Error: not detected */}
            {scanState === "error-notdetected" && (
              <>
                <div
                  style={{
                    background: "#24302E",
                    flex: 1,

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",

                      border: "2px solid rgba(176,141,70,0.4)",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 8v6M12 17v1"
                        stroke="#B08D46"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p style={{ color: "rgba(241,240,234,0.5)", fontSize: 13 }}>
                    QR code could not be detected
                  </p>
                </div>
                <div
                  style={{ padding: "24px", borderTop: "1px solid #D6D3C6" }}
                >
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#24302E",
                      marginBottom: 8,
                    }}
                  >
                    QR code not detected
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#5C5A50",
                      lineHeight: 1.6,
                      marginBottom: 20,
                    }}
                  >
                    Make sure the QR code is well-lit, fully visible, and
                    centred within the frame.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <BtnPrimary onClick={() => setScanState("scanning")}>
                      Try again
                    </BtnPrimary>
                    <BtnSecondary onClick={onManualEntry}>
                      Enter Credential ID instead
                    </BtnSecondary>
                    <BtnSecondary onClick={onBack}>
                      Back to landing
                    </BtnSecondary>
                  </div>
                </div>
              </>
            )}

            {/* Error: invalid format */}
            {scanState === "error-format" && (
              <>
                <div
                  style={{
                    background: "#24302E",
                    flex: 1,

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",

                      border: "2px solid rgba(166,69,61,0.4)",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="#A6453D"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p style={{ color: "rgba(241,240,234,0.5)", fontSize: 13 }}>
                    Invalid QR format
                  </p>
                </div>
                <div
                  style={{ padding: "24px", borderTop: "1px solid #D6D3C6" }}
                >
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#24302E",
                      marginBottom: 8,
                    }}
                  >
                    Invalid QR format
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#5C5A50",
                      lineHeight: 1.6,
                      marginBottom: 20,
                    }}
                  >
                    The scanned QR code is not a valid NSP credential. Make sure
                    you are scanning the correct document.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <BtnPrimary onClick={() => setScanState("scanning")}>
                      Try again
                    </BtnPrimary>
                    <BtnSecondary onClick={onManualEntry}>
                      Enter Credential ID instead
                    </BtnSecondary>
                    <BtnSecondary onClick={onBack}>
                      Back to landing
                    </BtnSecondary>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignSelf: "stretch",
            }}
          >
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
                  padding: "12px 20px",
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
                  Scanning tips
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
                  "Ensure the QR code is fully visible and not damaged",

                  "Hold steady, 15–20cm from the code",

                  "Avoid glare or shadows across the QR code",

                  "If scanning fails, use the Credential ID instead",
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

            <BtnSecondary
              onClick={onManualEntry}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Enter Credential ID instead
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2.5 6.5h8M8 4l2.5 2.5L8 9"
                  stroke="#24302E"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </BtnSecondary>

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
                  padding: "12px 20px",
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
                  Camera privacy
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
                  "Your camera feed is processed locally on your device.",

                  "No images or video are stored or transmitted.",

                  "Camera access can be revoked at any time in your browser settings.",
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
          </div>
        </div>
      </main>

      <Footer />
      <style>{`@keyframes scanline { 0%{top:4px} 50%{top:calc(100% - 6px)} 100%{top:4px} }`}</style>
    </div>
  )
}
