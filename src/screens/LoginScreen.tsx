import { useState, useEffect } from "react"
import { api, ApiError } from "../services/api"

interface LoginScreenProps {
  onSuccess: (
    role: "trade-tester" | "center-superintendent" | "super-admin",
    email: string,
  ) => void
}

type LoginState = "idle" | "loading" | "error"
type ModalType = "none" | "locked" | "unauthorized-device"

const DEMO_ACCOUNTS = {
  "tradetester@nsp.com": "trade-tester",
  "tester@hub.pk": "trade-tester",
  "cs@hub.pk": "center-superintendent",
  "super@hub.pk": "super-admin",
} as const

/* ─── tiny icon helpers ─── */
function EyeOpen() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeClosed() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

/* ─── live countdown hook ─── */
function useCountdown(initialSeconds: number, running: boolean) {
  const [secs, setSecs] = useState(initialSeconds)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [running])
  const m = String(Math.floor(secs / 60)).padStart(2, "0")
  const s = String(secs % 60).padStart(2, "0")
  return { display: `${m}:${s}`, expired: secs === 0 }
}

/* ─── spinner ─── */
function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.75s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}

/* ─── brand logo mark ─── */
function LogoMark({
  size = 32,
  bg = "#B08D46",
}: {
  size?: number
  bg?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: Math.round(size * 0.22),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  )
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("tradetester@nsp.com")
  const [password, setPassword] = useState("TradeTester123")
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [state, setState] = useState<LoginState>("idle")
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [generalError, setGeneralError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [modal, setModal] = useState<ModalType>("none")

  const lockTimer = useCountdown(1724, modal === "locked")

  /* ── validation ── */
  function validate() {
    const e: typeof fieldErrors = {}
    if (!email.trim()) e.email = "Email address is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address."
    if (!password) e.password = "Password is required."
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setState("loading")
    setGeneralError("")

    try {
      const res = await api.login(email.trim(), password)
      if (res.success) {
        setState("idle")
        const role =
          res.user?.role === "CENTER_SUPERINTENDENT"
            ? "center-superintendent"
            : res.user?.role === "SUPER_ADMIN"
              ? "super-admin"
              : "trade-tester"
        onSuccess(role, email.trim())
        return
      }
    } catch (err: any) {
      const next = attempts + 1
      setAttempts(next)

      if (next >= 5 || err?.message?.toLowerCase().includes("locked")) {
        setState("idle")
        setModal("locked")
        return
      }

      if (email === "device@hub.pk") {
        setState("idle")
        setModal("unauthorized-device")
        return
      }

      // Offline simulation fallback for testing when backend server is not running
      const role = DEMO_ACCOUNTS[(email as keyof typeof DEMO_ACCOUNTS)]
      if (
        role &&
        (password === "TradeTester123" || password === "password123")
      ) {
        setState("idle")
        onSuccess(role, email.trim())
        return
      }

      setState("error")
      setGeneralError(
        err?.message || "Login failed. Please check your credentials.",
      )
    }
  }

  /* ── shared input style ── */
  const inp = (err?: string): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${err ? "#A6453D" : "#D6D3C6"}`,
    borderRadius: 6,
    fontSize: 14,
    background: state === "loading" ? "#F1F0EA" : "#fff",
    color: "#24302E",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  })

  const isLocked = modal !== "none"

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F1F0EA",
      }}
    >
      {/* ── top bar ── */}
      <header
        style={{
          height: 56,
          background: "#24302E",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={30} />
          <div style={{ lineHeight: 1 }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
              National Skills Passport
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 8px" }}>
              |
            </span>
            <span style={{ color: "#B08D46", fontSize: 13, fontWeight: 500 }}>
              Issuer Portal
            </span>
          </div>
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 12,
            letterSpacing: 0.3,
          }}
        >
          NAVTTC · Government of Pakistan
        </span>
      </header>

      {/* ── main split ── */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* left brand panel */}
        <div
          style={{
            width: 480,
            background: "#24302E",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 56px",
            flexShrink: 0,
          }}
        >
          <div style={{ marginBottom: 48 }}>
            <LogoMark size={56} bg="#B08D46" />
          </div>

          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 16px",
              lineHeight: 1.3,
            }}
          >
            Pakistan's National
            <br />
            Skills Credentialing System
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 48px",
              lineHeight: 1.7,
            }}
          >
            Issue verifiable, blockchain-anchored credentials to
            NAVTTC-certified trade workers across all registered hubs.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "✦", text: "NADRA-verified candidate identity" },
              { icon: "✦", text: "Tamper-proof on-chain credentials" },
              { icon: "✦", text: "Real-time hub progress tracking" },
              { icon: "✦", text: "Role-based access control" },
            ].map((f) => (
              <div
                key={f.text}
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <span
                  style={{
                    color: "#B08D46",
                    fontSize: 10,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.5,
                  }}
                >
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              paddingTop: 64,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              marginTop: 64,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Restricted access. Authorised NAVTTC personnel only.
              <br />
              All activity is logged and audited.
            </p>
          </div>
        </div>

        {/* right form panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* heading */}
            <div style={{ marginBottom: 36 }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 8px",
                }}
              >
                Sign in to Issuer Portal
              </h1>
              <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
                Enter your NAVTTC credentials to continue.
              </p>
            </div>

            {/* general error banner */}
            {generalError && (
              <div
                style={{
                  background: "#FCEBEB",
                  border: "1px solid #E8B4B4",
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginBottom: 24,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
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
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span
                  style={{ fontSize: 13, color: "#501313", lineHeight: 1.5 }}
                >
                  {generalError}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* email */}
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
                  Email Address <span style={{ color: "#A6453D" }}>*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@navttc.gov.pk"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldErrors((f) => ({ ...f, email: undefined }))
                    setGeneralError("")
                  }}
                  disabled={state === "loading" || isLocked}
                  style={inp(fieldErrors.email)}
                />
                {fieldErrors.email && (
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 12,
                      color: "#A6453D",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A6453D"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* password */}
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#24302E",
                    marginBottom: 6,
                  }}
                >
                  Password <span style={{ color: "#A6453D" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFieldErrors((f) => ({ ...f, password: undefined }))
                      setGeneralError("")
                    }}
                    disabled={state === "loading" || isLocked}
                    style={{ ...inp(fieldErrors.password), paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#8C897C",
                      display: "flex",
                      padding: 0,
                    }}
                  >
                    {showPw ? <EyeOpen /> : <EyeClosed />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 12,
                      color: "#A6453D",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A6453D"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* remember / forgot */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 28,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "#4C7A6E", width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: 13, color: "#5C5A50" }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  style={{
                    fontSize: 13,
                    color: "#4C7A6E",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={state === "loading" || isLocked}
                style={{
                  width: "100%",
                  height: 42,
                  background:
                    state === "loading" || isLocked ? "#D6D3C6" : "#4C7A6E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  cursor:
                    state === "loading" || isLocked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.15s",
                }}
              >
                {state === "loading" ? (
                  <>
                    <Spinner /> Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* security note */}
            <div
              style={{
                marginTop: 24,
                padding: "12px 14px",
                background: "#F1F0EA",
                border: "1px solid #E8E6DF",
                borderRadius: 6,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C897C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontSize: 12, color: "#8C897C", lineHeight: 1.6 }}>
                Access is restricted to authorised NAVTTC personnel.
                Unauthorised access attempts are logged and may result in legal
                action.
              </span>
            </div>

            {/* demo helpers */}
            <div
              style={{
                marginTop: 28,
                borderTop: "1px solid #E8E6DF",
                paddingTop: 20,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#8C897C",
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  fontWeight: 600,
                }}
              >
                Demo Quick Login
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {Object.keys(DEMO_ACCOUNTS).map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setEmail(e)
                      setPassword(
                        e === "tradetester@nsp.com"
                          ? "TradeTester123"
                          : "password123",
                      )
                      setGeneralError("")
                      setFieldErrors({})
                    }}
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      background:
                        e === "tradetester@nsp.com" ? "#EAF3DE" : "#fff",
                      border: `1px solid ${
                        e === "tradetester@nsp.com" ? "#4C7A6E" : "#D6D3C6"
                      }`,
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "#24302E",
                      fontFamily: "IBM Plex Mono, monospace",
                      fontWeight: e === "tradetester@nsp.com" ? 600 : 400,
                    }}
                  >
                    {e === "tradetester@nsp.com" ? `${e} (Live Backend)` : e}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  onClick={() => setModal("locked")}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    background: "#FCEBEB",
                    border: "1px solid #E8B4B4",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#8C3B34",
                  }}
                >
                  Preview: Account Locked
                </button>
                <button
                  onClick={() => setModal("unauthorized-device")}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    background: "#FCE8D6",
                    border: "1px solid #B08D46",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#5C3300",
                  }}
                >
                  Preview: Unauthorized Device
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ACCOUNT LOCKED MODAL
      ══════════════════════════════════════════ */}
      {modal === "locked" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,48,46,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 36,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
            }}
          >
            {/* header */}
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: "#FCEBEB",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="26"
                  height="26"
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
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#24302E",
                    margin: "0 0 6px",
                  }}
                >
                  Account Locked
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: "#5C5A50",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Your account has been temporarily suspended after 5
                  consecutive failed login attempts.
                </p>
              </div>
            </div>

            {/* reason banner */}
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #E8B4B4",
                borderRadius: 6,
                padding: "12px 16px",
                marginBottom: 20,
                fontSize: 13,
                color: "#501313",
                lineHeight: 1.5,
              }}
            >
              <strong>5 consecutive failed login attempts</strong> were recorded
              from this device. For security, all sign-in attempts are now
              blocked.
            </div>

            {/* countdown card */}
            <div
              style={{
                background: "#F1F0EA",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                padding: "16px 20px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
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
                    Lock Duration
                  </div>
                  <div style={{ fontSize: 12, color: "#8C897C" }}>
                    Automatic unlock after timer expires
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#5C5A50",
                    background: "#F1EFE8",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  30 minutes
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "#5C5A50" }}>
                  Time remaining
                </span>
                <span
                  style={{
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 22,
                    fontWeight: 700,
                    color: lockTimer.expired ? "#4C7A6E" : "#A6453D",
                  }}
                >
                  {lockTimer.expired ? "Unlocked" : lockTimer.display}
                </span>
              </div>
              {!lockTimer.expired && (
                <div
                  style={{
                    height: 4,
                    background: "#E8E6DF",
                    borderRadius: 2,
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#A6453D",
                      borderRadius: 2,
                      width: `${(1724 - parseInt(lockTimer.display.replace(":", "")) * 60) / 17.24}%`,
                      transition: "width 1s linear",
                    }}
                  />
                </div>
              )}
            </div>

            {/* actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <button
                style={{
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
                Request Administrative Unlock
              </button>
              <button
                style={{
                  height: 42,
                  background: "#fff",
                  color: "#24302E",
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Self-Service Unlock via Email
              </button>
            </div>

            {/* help */}
            <div
              style={{
                padding: "12px 14px",
                background: "#F1F0EA",
                border: "1px solid #E8E6DF",
                borderRadius: 6,
                marginBottom: 20,
                fontSize: 12,
                color: "#5C5A50",
                lineHeight: 1.6,
              }}
            >
              If you believe this is an error, contact your hub administrator or
              reach NAVTTC support at{" "}
              <strong style={{ color: "#24302E" }}>
                support@navttc.gov.pk
              </strong>
            </div>

            <button
              onClick={() => setModal("none")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#4C7A6E",
                fontWeight: 500,
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 5,
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
              Back to Login
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          UNAUTHORIZED DEVICE MODAL
      ══════════════════════════════════════════ */}
      {modal === "unauthorized-device" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,48,46,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 36,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
            }}
          >
            {/* header */}
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: "#FCE8D6",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B08D46"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#24302E",
                    margin: "0 0 6px",
                  }}
                >
                  Unauthorized Device
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: "#5C5A50",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  This device is not registered for your assigned hub and cannot
                  be used to access the Issuer Portal.
                </p>
              </div>
            </div>

            {/* blocking banner */}
            <div
              style={{
                background: "#FCE8D6",
                border: "1px solid #B08D46",
                borderRadius: 6,
                padding: "12px 16px",
                marginBottom: 20,
                fontSize: 13,
                color: "#5C3300",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
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
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                Access is <strong>blocked</strong> until this device is
                registered and authorised by a hub administrator.
              </span>
            </div>

            {/* device info */}
            <div
              style={{
                background: "#F1F0EA",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                padding: "16px 20px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8C897C",
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 12,
                }}
              >
                Device Information
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px 24px",
                  fontSize: 13,
                }}
              >
                <div>
                  <div
                    style={{ color: "#8C897C", marginBottom: 3, fontSize: 12 }}
                  >
                    Device ID
                  </div>
                  <div
                    style={{
                      color: "#24302E",
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    DEV-7F2A-9K1M
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#8C897C", marginBottom: 3, fontSize: 12 }}
                  >
                    Authorization Status
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        background: "#A6453D",
                        borderRadius: "50%",
                      }}
                    />
                    <span
                      style={{
                        color: "#A6453D",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Not Authorized
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#8C897C", marginBottom: 3, fontSize: 12 }}
                  >
                    Assigned Hub
                  </div>
                  <div
                    style={{
                      color: "#24302E",
                      fontWeight: 600,
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 12,
                    }}
                  >
                    Lahore-C01
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#8C897C", marginBottom: 3, fontSize: 12 }}
                  >
                    Device Type
                  </div>
                  <div style={{ color: "#24302E", fontSize: 13 }}>
                    Chrome · Windows 11
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#8C897C", marginBottom: 3, fontSize: 12 }}
                  >
                    IP Address
                  </div>
                  <div
                    style={{
                      color: "#24302E",
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 12,
                    }}
                  >
                    203.128.22.14
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#8C897C", marginBottom: 3, fontSize: 12 }}
                  >
                    Attempted At
                  </div>
                  <div
                    style={{
                      color: "#24302E",
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 12,
                    }}
                  >
                    {new Date().toLocaleString("en-PK")}
                  </div>
                </div>
              </div>
            </div>

            {/* actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                style={{
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
                Request Device Authorization
              </button>
              <button
                onClick={() => setModal("none")}
                style={{
                  height: 42,
                  background: "#fff",
                  color: "#24302E",
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
