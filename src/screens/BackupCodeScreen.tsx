import { useState } from "react"
import { api, ApiError } from "../services/api"
import { authStore } from "../services/authStore"

interface BackupCodeScreenProps {
  email: string
  password: string
  onSuccess: () => void
  onBackToMfa: () => void
  onBackToLogin: () => void
}

export default function BackupCodeScreen({
  email,
  password,
  onSuccess,
  onBackToMfa,
  onBackToLogin,
}: BackupCodeScreenProps) {
  const [backupCode, setBackupCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [locked, setLocked] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const code = backupCode.trim()
    if (!code) {
      setError("Enter a backup code to continue.")
      return
    }

    setPending(true)
    setError("")
    setLocked(false)
    try {
      const response = await api.verifyBackupCode(email, password, code)
      authStore.setSession(
        response.user,
        response.accessToken,
        response.refreshToken,
      )
      onSuccess()
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      const message = err instanceof Error ? err.message : "Verification failed."
      const normalized = message.toLowerCase()

      if (normalized.includes("account locked")) {
        setLocked(true)
        setError(
          `Account temporarily suspended for 15 minutes. ${message}`,
        )
      } else if (
        normalized.includes("already-used") ||
        normalized.includes("already used")
      ) {
        setError("This backup code is invalid or already used. Try another unused code.")
      } else if (apiError?.status === 429) {
        setError("Request cooldown active. Please wait before trying again.")
      } else if (apiError?.status === 0) {
        setError("Cannot reach the server. Check your connection and try again.")
      } else {
        setError(message)
      }
    } finally {
      setPending(false)
    }
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
          justifyContent: "space-between",
          padding: "0 32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "#B08D46",
              borderRadius: 6,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
              National Skills Passport
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}> — </span>
            <span style={{ color: "#B08D46", fontSize: 13 }}>Issuer Portal</span>
          </div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          NAVTTC · Pakistan
        </span>
      </header>

      <main
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: 32,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: 440,
            background: "#fff",
            border: "1px solid #D6D3C6",
            borderRadius: 8,
            padding: 40,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              background: "#F1E7D2",
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              color: "#B08D46",
              fontSize: 24,
              marginBottom: 20,
            }}
          >
            ⛨
          </div>
          <h1 style={{ fontSize: 22, color: "#24302E", margin: "0 0 6px" }}>
            Use a backup code
          </h1>
          <p style={{ fontSize: 14, color: "#5C5A50", lineHeight: 1.6 }}>
            Enter one of your saved recovery codes for <strong>{email}</strong>.
            Each code can be used only once.
          </p>

          {error && (
            <div
              role="alert"
              style={{
                background: "#FCEBEB",
                border: `1px solid ${locked ? "#A6453D" : "#E8B4B4"}`,
                color: "#501313",
                borderRadius: 6,
                padding: "10px 14px",
                margin: "20px 0",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <label
            htmlFor="backup-code"
            style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 24 }}
          >
            Backup code
          </label>
          <div style={{ position: "relative", marginTop: 6 }}>
            <input
              id="backup-code"
              type={showCode ? "text" : "password"}
              autoComplete="one-time-code"
              value={backupCode}
              onChange={(event) => {
                setBackupCode(event.target.value)
                setError("")
                setLocked(false)
              }}
              disabled={pending}
              style={{
                width: "100%",
                height: 42,
                border: `1px solid ${error ? "#A6453D" : "#D6D3C6"}`,
                borderRadius: 6,
                padding: "0 82px 0 12px",
                fontFamily: "IBM Plex Mono, monospace",
                letterSpacing: 1,
              }}
            />
            <button
              type="button"
              onClick={() => setShowCode((value) => !value)}
              disabled={pending}
              style={{
                position: "absolute",
                right: 10,
                top: 11,
                border: 0,
                background: "none",
                color: "#4C7A6E",
                cursor: "pointer",
              }}
            >
              {showCode ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              height: 42,
              marginTop: 24,
              border: 0,
              borderRadius: 6,
              background: pending ? "#8C897C" : "#4C7A6E",
              color: "#fff",
              fontWeight: 600,
              cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Verifying…" : "Verify backup code"}
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #D6D3C6",
              marginTop: 20,
              paddingTop: 16,
            }}
          >
            <button type="button" onClick={onBackToMfa} disabled={pending} style={linkStyle}>
              Back to authenticator
            </button>
            <button type="button" onClick={onBackToLogin} disabled={pending} style={linkStyle}>
              Back to login
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  border: 0,
  background: "none",
  color: "#4C7A6E",
  fontSize: 13,
  padding: 0,
  cursor: "pointer",
}
