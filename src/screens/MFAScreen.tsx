import { useState, useRef, useEffect } from "react"

import { api, ApiError, User } from "../services/api"

import { authStore } from "../services/authStore"

interface MFAScreenProps {
  email?: string

  onSuccess: () => void

  onBack: () => void

  onUseBackupCode?: () => void
}

type MFAState = "default" | "loading" | "invalid" | "expired" | "too-many" | "success"

export default function MFAScreen({
  email,
  onSuccess,
  onBack,
  onUseBackupCode,
}: MFAScreenProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""])

  const [state, setState] = useState<MFAState>("default")

  const [customError, setCustomError] = useState("")

  const [countdown, setCountdown] = useState(120)

  const [showBackup, setShowBackup] = useState(false)

  const [backupCode, setBackupCode] = useState("")

  const [backupPassword, setBackupPassword] = useState("")

  const [backupError, setBackupError] = useState("")

  const refs = useRef<(HTMLInputElement | null)[]>([])

  const isSubmitting = useRef(false)

  // Auto-focus first input on mount
  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  // Live countdown timer with automatic expiration
  useEffect(() => {
    if (countdown <= 0) {
      setState("expired")
      return
    }

    const t = setInterval(() => setCountdown((c) => c - 1), 1000)

    return () => clearInterval(t)
  }, [countdown])

  function handleDigit(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1)

    const next = [...digits]

    next[i] = d

    setDigits(next)

    setState("default")

    setCustomError("")

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
      if (digits.join("").length === 6 && state !== "loading") {
        void handleVerify()
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
    setState("default")
    setCustomError("")

    const focusIdx = Math.min(text.length, 5)
    refs.current[focusIdx]?.focus()
  }

  async function handleVerify() {
    if (isSubmitting.current || state === "loading" || state === "success")
      return

    const code = digits.join("")

    if (code.length < 6) return

    if (countdown <= 0) {
      setState("expired")
      return
    }

    isSubmitting.current = true
    setState("loading")
    setCustomError("")

    try {
      const res = await api.verifyMfa(email, code)
      const user = res.user || (res as any).data?.user
      const accessToken =
        res.accessToken ||
        (res as any).token ||
        (res as any).data?.accessToken ||
        (res as any).data?.token
      const refreshToken =
        (res as any).refreshToken || (res as any).data?.refreshToken

      if (res.success && user && accessToken && refreshToken) {
        authStore.setSession(user, accessToken, refreshToken)

        setState("success")

        setTimeout(onSuccess, 600)

        return
      }

      setState("invalid")
      setDigits(["", "", "", "", "", ""])
      refs.current[0]?.focus()
      setCustomError(
        res.success
          ? "Unable to create a complete authentication session. Please sign in again."
          : res.message || "Verification failed.",
      )
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setState("too-many")
        return
      }

      const errMsg = err?.message?.toLowerCase() || ""
      if (errMsg.includes("expired")) {
        setState("expired")
        return
      }

      setState("invalid")

      setDigits(["", "", "", "", "", ""])

      refs.current[0]?.focus()

      setCustomError(
        err instanceof ApiError && err.status === 0
          ? "Cannot reach the server. Check your connection and try again."
          : err?.message || "Invalid MFA verification code.",
      )
    } finally {
      isSubmitting.current = false
    }
  }

  function handleResend() {
    if (countdown > 0) return

    setCountdown(120)

    setDigits(["", "", "", "", "", ""])

    setState("default")

    setCustomError("")

    refs.current[0]?.focus()
  }

  async function handleBackupVerify() {
    const trimmed = backupCode.trim()
    if (!trimmed) {
      setBackupError("Please enter your backup code.")
      return
    }
    if (!backupPassword.trim()) {
      setBackupError("Please enter your password.")
      return
    }

    setBackupError("")
    setState("loading")

    try {
      const res = await api.verifyBackupCode(
        email,
        backupPassword.trim(),
        backupCode.trim(),
      )
      if (res.success && res.user) {
        authStore.setSession(res.user, res.accessToken, res.refreshToken)
        setTimeout(onSuccess, 400)
        return
      }
      setBackupError(res.message || "Verification failed.")
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || ""
      if (msg.includes("locked")) {
        setBackupError(
          "Account locked for 15 minutes due to too many failed attempts. Please try again later.",
        )
      } else if (msg.includes("already-used") || msg.includes("already used")) {
        setBackupError(
          "This backup code has already been used. Please try another unused code.",
        )
      } else {
        setBackupError(err?.message || "Invalid backup code.")
      }
    }
  }

  const code = digits.join("")

  const minutes = Math.floor(countdown / 60)
    .toString()
    .padStart(2, "0")

  const secs = (countdown % 60).toString().padStart(2, "0")

  const stateMessages: Record<string, {
    bg: string
    border: string
    text: string
    color: string
  }> = {
    invalid: {
      bg: "#FCEBEB",
      border: "#A6453D",
      text: customError || "Incorrect verification code. Please try again.",
      color: "#501313",
    },

    expired: {
      bg: "#FCE8D6",
      border: "#B08D46",
      text: "This code has expired. Please request a new one.",
      color: "#5C3300",
    },

    "too-many": {
      bg: "#FCEBEB",
      border: "#A6453D",
      text: "Too many failed attempts. Please wait before trying again.",
      color: "#501313",
    },
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1F0EA",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
              National Skills Passport
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              {" "}
              —{" "}
            </span>
            <span style={{ color: "#B08D46", fontSize: 13, fontWeight: 500 }}>
              Issuer Portal
            </span>
          </div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          NAVTTC · Pakistan
        </span>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 40,
            }}
          >
            {/* Icon */}
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
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#24302E",
                margin: "0 0 6px",
              }}
            >
              Verify your identity
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#5C5A50",
                margin: "0 0 28px",
                lineHeight: 1.6,
              }}
            >
              Enter the 6-digit code from your authenticator app. This code
              expires in {minutes}:{secs}.
            </p>

            {state in stateMessages && (
              <div
                style={{
                  background: stateMessages[state].bg,
                  border: `1px solid ${stateMessages[state].border}`,
                  borderRadius: 6,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: stateMessages[state].color,
                }}
              >
                {stateMessages[state].text}
              </div>
            )}

            {state === "success" && (
              <div
                style={{
                  background: "#EAF3DE",
                  border: "1px solid #4C7A6E",
                  borderRadius: 6,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "#173404",
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
                  stroke="#4C7A6E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Identity verified. Redirecting to dashboard…
              </div>
            )}

            {/* OTP form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleVerify()
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  marginBottom: 28,
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
                    disabled={
                      state === "loading" ||
                      state === "success" ||
                      state === "too-many"
                    }
                    style={{
                      borderColor:
                        state === "invalid"
                          ? "#A6453D"
                          : state === "success"
                            ? "#4C7A6E"
                            : "#D6D3C6",
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={
                  code.length < 6 ||
                  state === "loading" ||
                  state === "success" ||
                  state === "too-many"
                }
                style={{
                  width: "100%",
                  height: 40,
                  background:
                    code.length < 6 || state === "loading"
                      ? "#5C5A50"
                      : "#4C7A6E",

                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,

                  cursor:
                    code.length < 6 || state === "loading"
                      ? "not-allowed"
                      : "pointer",
                  marginBottom: 20,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {state === "loading" ? (
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
                    Verifying…
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <button
                onClick={handleResend}
                disabled={countdown > 0}
                style={{
                  background: "none",
                  border: "none",
                  cursor: countdown > 0 ? "not-allowed" : "pointer",
                  color: countdown > 0 ? "#8C897C" : "#4C7A6E",
                  fontWeight: 500,
                  padding: 0,
                  fontSize: 13,
                }}
              >
                {countdown > 0
                  ? `Resend code in ${minutes}:${secs}`
                  : "Resend code"}
              </button>
              <button
                onClick={() => onUseBackupCode?.()}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#4C7A6E",
                  fontWeight: 500,
                  padding: 0,
                  fontSize: 13,
                }}
              >
                Lost your authenticator device? Use a backup code
              </button>
            </div>

            <div style={{ borderTop: "1px solid #D6D3C6", paddingTop: 16 }}>
              <button
                onClick={onBack}
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
        </div>
      </div>

      {/* Backup Code Modal */}
      {false && showBackup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,48,46,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 32,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#24302E",
                margin: "0 0 8px",
              }}
            >
              Use Backup Code
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#5C5A50",
                margin: "0 0 20px",
                lineHeight: 1.6,
              }}
            >
              Enter one of your backup codes. Each code can only be used once
              and will be invalidated after use.
            </p>

            <div
              style={{
                background: "#FCE8D6",
                border: "1px solid #F5C89A",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
                color: "#5C3300",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
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
              Backup codes are single-use. Using this code will permanently
              invalidate it.
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
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => {
                  setBackupCode(e.target.value)
                  setBackupError("")
                }}
                placeholder="XXXXX-XXXX-XXXX"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${backupError ? "#A6453D" : "#D6D3C6"}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "IBM Plex Mono, monospace",
                  letterSpacing: 1,
                  color: "#24302E",
                  background: "#fff",
                }}
              />
              {backupError && (
                <p
                  style={{ fontSize: 12, color: "#A6453D", margin: "4px 0 0" }}
                >
                  {backupError}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleBackupVerify}
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
                Verify Backup Code
              </button>
              <button
                onClick={() => {
                  setShowBackup(false)
                  setBackupCode("")
                  setBackupError("")
                }}
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
          </div>
        </div>
      )}
    </div>
  )
}
