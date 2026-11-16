import { useState, useRef, useEffect } from "react"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import jsQR from "jsqr"
import { BtnPrimary, BtnSecondary } from "../components/Btn"

interface Props {
  onBack: () => void
  onManualEntry: () => void
  onScanSuccess: (credentialId: string) => void
}

type ScanState = "permission" | "scanning" | "error-notdetected" | "error-format"

const ID_KEYS = [
  "credentialId",
  "credential_id",
  "credentialID",
  "credential",
  "cid",
  "id",
]

const SCAN_TIMEOUT_MS = 20000

// Pulls the credential ID out of whatever the worker's wallet QR contains:
//  - JSON:  {"credentialId":"..."}
//  - URL:   https://.../verify?id=...  or  https://.../verify/<id>
//  - Plain: the ID itself
// Nothing is hardcoded: whatever is in the QR is passed to the parent as-is.
// The parent / backend decides if the ID actually exists.
function parseCredentialId(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  let candidate: string | null = null

  if (text.startsWith("{")) {
    try {
      const obj = JSON.parse(text)
      for (const k of ID_KEYS) {
        const v = obj?.[k]
        if (typeof v === "string" || typeof v === "number") {
          candidate = String(v).trim()
          break
        }
      }
    } catch {
      return null
    }
  } else if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text)
      for (const k of ID_KEYS) {
        const v = url.searchParams.get(k)
        if (v) {
          candidate = v.trim()
          break
        }
      }
      if (!candidate) {
        const last = url.pathname.split("/").filter(Boolean).pop()
        if (last) candidate = decodeURIComponent(last).trim()
      }
    } catch {
      return null
    }
  } else {
    candidate = text
  }

  // Basic sanity only: not empty, no whitespace, sane length
  if (!candidate || candidate.length > 128 || /\s/.test(candidate)) return null
  return candidate
}

export default function QRScannerScreen({
  onBack,
  onManualEntry,
  onScanSuccess,
}: Props) {
  const [scanState, setScanState] = useState<ScanState>("permission")
  const [denied, setDenied] = useState(false)
  const [deniedMsg, setDeniedMsg] = useState(
    "Camera permission was not granted. You can allow it in your browser settings, or use a Credential ID instead.",
  )
  const [streamActive, setStreamActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Keep latest callback without restarting the camera when the parent re-renders
  const onScanSuccessRef = useRef(onScanSuccess)
  onScanSuccessRef.current = onScanSuccess

  useEffect(() => {
    if (scanState !== "scanning") {
      setStreamActive(false)
      return
    }

    let cancelled = false
    let activeStream: MediaStream | null = null
    let rafId = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    const stop = () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      if (timeoutId) clearTimeout(timeoutId)
      activeStream?.getTracks().forEach((t) => t.stop())
    }

    const tick = () => {
      if (cancelled) return
      const video = videoRef.current

      if (
        video &&
        ctx &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        video.videoWidth > 0
      ) {
        // Downscale for speed
        const scale = Math.min(1, 640 / video.videoWidth)
        canvas.width = Math.floor(video.videoWidth * scale)
        canvas.height = Math.floor(video.videoHeight * scale)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(img.data, img.width, img.height, {
          inversionAttempts: "attemptBoth", // handles light-on-dark wallet screens
        })

        if (code && code.data) {
          const id = parseCredentialId(code.data)
          stop()
          if (id) {
            onScanSuccessRef.current(id)
          } else {
            setScanState("error-format")
          }
          return
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    if (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          // Effect was cleaned up before camera was ready: release it
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          activeStream = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
          setStreamActive(true)
          rafId = requestAnimationFrame(tick)

          timeoutId = setTimeout(() => {
            if (cancelled) return
            stop()
            setScanState("error-notdetected")
          }, SCAN_TIMEOUT_MS)
        })
        .catch((err) => {
          console.info("Camera unavailable or denied:", err?.message)
          if (cancelled) return
          setStreamActive(false)
          setDeniedMsg(
            "Camera permission was not granted. You can allow it in your browser settings, or use a Credential ID instead.",
          )
          setScanState("permission")
          setDenied(true)
        })
    } else {
      // No camera API (e.g. page not served over HTTPS)
      setDeniedMsg(
        "Camera is not available in this browser or connection. Open this page over HTTPS, or use a Credential ID instead.",
      )
      setScanState("permission")
      setDenied(true)
    }

    return stop
  }, [scanState])

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
            Hold the worker's certificate up to your camera.
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

            {/* Permission denied / camera unavailable */}
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
                  {deniedMsg}
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
                    minHeight: 320,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: streamActive ? 1 : 0,
                      transition: "opacity 0.3s ease",
                      zIndex: 1,
                    }}
                  />
                  {streamActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 10,
                        background: "rgba(0,0,0,0.65)",
                        color: "#5DCAA5",
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 4,
                        display: "flex",
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
                        }}
                      />
                      Live Camera
                    </div>
                  )}
                  <div
                    style={{
                      position: "relative",
                      width: 220,
                      height: 220,
                      zIndex: 5,
                    }}
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
                  </div>
                  <p
                    style={{
                      color: "rgba(241,240,234,0.8)",
                      fontSize: 13,
                      fontWeight: 500,
                      zIndex: 5,
                      textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                    }}
                  >
                    {streamActive
                      ? "Position the QR code inside the frame"
                      : "Starting camera…"}
                  </p>
                </div>
                <div
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                    borderTop: "1px solid #D6D3C6",
                  }}
                >
                  <BtnSecondary onClick={() => setScanState("permission")}>
                    Cancel
                  </BtnSecondary>
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