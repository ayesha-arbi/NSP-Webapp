import { useState, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { api, ApiError } from "../services/api"

interface MFAEnrollmentScreenProps {
  email?: string
  enrollmentToken: string
  onSuccess: () => void
  onBackToLogin: () => void
}

type EnrollmentState = "loading" | "ready" | "submitting" | "success" | "error"

export default function MFAEnrollmentScreen({
  email,
  enrollmentToken,
  onSuccess,
  onBackToLogin,
}: MFAEnrollmentScreenProps) {
  const [state, setState] = useState<EnrollmentState>("loading")
  const [secret, setSecret] = useState("")
  const [otpauthUrl, setOtpauthUrl] = useState("")
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [errorMessage, setErrorMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const refs = useRef<(HTMLInputElement | null)[]>([])
  const isSubmitting = useRef(false)

  // Start enrollment on mount
  useEffect(() => {
    let active = true

    async function initEnrollment() {
      setState("loading")
      setErrorMessage("")
      try {
        const res = await api.startMfaEnrollment(enrollmentToken)
        if (active && res.secret && res.otpauthUrl) {
          setSecret(res.secret)
          setOtpauthUrl(res.otpauthUrl)
          setState("ready")
          setTimeout(() => refs.current[0]?.focus(), 100)
          return
        }
      } catch (err: any) {
        if (active) {
          setState("error")
          setErrorMessage(
            err?.message ||
              "Could not start MFA enrollment. The enrollment token may have expired.",
          )
        }
      }
    }

    void initEnrollment()

    return () => {
      active = false
    }
  }, [enrollmentToken, email])

  function handleDigit(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    setErrorMessage("")
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        e.preventDefault()
        const next = [...digits]
        next[i - 1] = ""
        setDigits(next)
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault()
      refs.current[i - 1]?.focus()
    } else if (e.key === "ArrowRight" && i < 5) {
      e.preventDefault()
      refs.current[i + 1]?.focus()
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (digits.join("").length === 6 && state !== "submitting") {
        void handleConfirm()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!text) return

    const next = [...digits]
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i]
    }
    setDigits(next)
    setErrorMessage("")
    const focusIdx = Math.min(text.length, 5)
    refs.current[focusIdx]?.focus()
  }

  async function handleConfirm() {
    if (isSubmitting.current || state === "submitting" || state === "success")
      return

    const mfaCode = digits.join("")
    if (mfaCode.length < 6) {
      setErrorMessage("Please enter all 6 digits.")
      return
    }

    isSubmitting.current = true
    setState("submitting")
    setErrorMessage("")

    try {
      const res = await api.confirmMfaEnrollment(enrollmentToken, mfaCode)
      if (res.success || (res as any).message) {
        setState("success")
        setTimeout(onSuccess, 1200)
        return
      }
      setState("ready")
      setErrorMessage(res.message || "Invalid verification code.")
    } catch (err: any) {
      setAttempts((a) => a + 1)
      setState("ready")
      setErrorMessage(
        err?.message ||
          "Invalid verification code. Please check your authenticator app and try again.",
      )
    } finally {
      isSubmitting.current = false
    }
  }

  function copySecret() {
    if (!secret) return
    navigator.clipboard?.writeText(secret).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const code = digits.join("")

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1F0EA",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: 56,
          background: "#24302E",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "#B08D46",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
              NSP HUNAR
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              {" "}
              —{" "}
            </span>
            <span style={{ color: "#B08D46", fontSize: 13, fontWeight: 500 }}>
              Security Onboarding
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 40,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            {/* Shield Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                background: "#E4EEFC",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2E6FE0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#24302E",
                margin: "0 0 8px",
              }}
            >
              Set Up Two-Factor Authentication
            </h1>

            <p
              style={{
                fontSize: 14,
                color: "#5C5A50",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              Scan the QR code below using your authenticator app (such as
              Google Authenticator, Microsoft Authenticator, or Authy) to link
              your account for <span style={{ fontWeight: 600 }}>{email}</span>.
            </p>

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                style={{
                  background: "#FCEBEB",
                  border: "1px solid #A6453D",
                  borderRadius: 6,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "#501313",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#A6453D"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMessage}
              </div>
            )}

            {/* Success Banner */}
            {state === "success" && (
              <div
                style={{
                  background: "#EAF3DE",
                  border: "1px solid #4C7A6E",
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "#173404",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4C7A6E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                MFA enrollment completed successfully! Redirecting to login…
              </div>
            )}

            {state === "loading" ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#5C5A50",
                  fontSize: 14,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4C7A6E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="0.8s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                </div>
                Generating secure authenticator setup key…
              </div>
            ) : (
              <div>
                {/* QR Code Container */}
                <div
                  style={{
                    background: "#FAFAF8",
                    border: "1px solid #E4E2D9",
                    borderRadius: 8,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  {otpauthUrl ? (
                    <div
                      style={{
                        padding: 12,
                        background: "#fff",
                        borderRadius: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      <QRCodeSVG
                        value={otpauthUrl}
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 180,
                        height: 180,
                        background: "#E4E2D9",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#5C5A50",
                        fontSize: 12,
                      }}
                    >
                      QR Code Unavailable
                    </div>
                  )}

                  {/* Secret Key Display */}
                  <div
                    style={{
                      marginTop: 16,
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "#5C5A50",
                        margin: "0 0 6px",
                      }}
                    >
                      Can&apos;t scan? Enter key manually into your app:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <code
                        style={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#24302E",
                          background: "#EBEAE4",
                          padding: "4px 8px",
                          borderRadius: 4,
                          letterSpacing: 1.5,
                        }}
                      >
                        {secret || "—"}
                      </code>
                      <button
                        type="button"
                        onClick={copySecret}
                        style={{
                          background: copied ? "#EAF3DE" : "#fff",
                          border: `1px solid ${copied ? "#4C7A6E" : "#D6D3C6"}`,
                          color: copied ? "#173404" : "#24302E",
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form to submit 6-digit verification code */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleConfirm()
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#24302E",
                      marginBottom: 8,
                      textAlign: "center",
                    }}
                  >
                    Enter the 6-digit verification code generated by your app:
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                    onPaste={handlePaste}
                  >
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          refs.current[i] = el
                        }}
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleDigit(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={state === "submitting" || state === "success"}
                        style={{
                          width: 44,
                          height: 52,
                          textAlign: "center",
                          fontSize: 20,
                          fontWeight: 700,
                          fontFamily: "IBM Plex Mono, monospace",
                          borderColor: errorMessage ? "#A6453D" : "#D6D3C6",
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      code.length < 6 ||
                      state === "submitting" ||
                      state === "success"
                    }
                    style={{
                      width: "100%",
                      height: 42,
                      background:
                        code.length < 6 || state === "submitting"
                          ? "#5C5A50"
                          : "#4C7A6E",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor:
                        code.length < 6 || state === "submitting"
                          ? "not-allowed"
                          : "pointer",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {state === "submitting" ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from="0 12 12"
                              to="360 12 12"
                              dur="0.8s"
                              repeatCount="indefinite"
                            />
                          </path>
                        </svg>
                        Verifying and Activating…
                      </>
                    ) : (
                      "Verify & Activate MFA"
                    )}
                  </button>
                </form>

                <div style={{ borderTop: "1px solid #D6D3C6", paddingTop: 16 }}>
                  <button
                    onClick={onBackToLogin}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#5C5A50",
                      fontSize: 13,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
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
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
