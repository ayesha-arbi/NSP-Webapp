import { useCallback, useEffect, useState } from "react"
import { api, ApiError, BackupCodesStatusResponse } from "../services/api"

export default function BackupCodesSection() {
  const [status, setStatus] = useState<BackupCodesStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [codes, setCodes] = useState<string[]>([])
  const [acknowledged, setAcknowledged] = useState(false)
  const [actionMessage, setActionMessage] = useState("")

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.backupCodesStatus()
      setStatus(response)
      setError("")
    } catch {
      setStatus(null)
      setError("")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  useEffect(() => {
    if (codes.length === 0) return
    const preventEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.preventDefault()
    }
    window.addEventListener("keydown", preventEscape)
    return () => window.removeEventListener("keydown", preventEscape)
  }, [codes.length])

  async function generateCodes() {
    setGenerating(true)
    setError("")
    try {
      const response = await api.generateBackupCodes()
      if (response.backupCodes.length !== 10) {
        throw new Error("The server returned an invalid recovery-code set.")
      }
      setCodes(response.backupCodes)
      setAcknowledged(false)
      setActionMessage("")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to generate backup codes."
      setError(message)
      if (err instanceof ApiError && err.status === 409) {
        await loadStatus()
        setError(message)
      }
    } finally {
      setGenerating(false)
    }
  }

  async function copyAll() {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(codes.join("\n"))
      setActionMessage("Copied to clipboard")
    } catch {
      setActionMessage("Copy failed. Select and save the codes manually.")
    }
  }

  function downloadCodes() {
    if (!URL.createObjectURL) {
      setActionMessage("Download is unavailable. Copy the codes instead.")
      return
    }
    const url = URL.createObjectURL(
      new Blob([`${codes.join("\n")}\n`], { type: "text/plain;charset=utf-8" }),
    )
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "nsp-recovery-codes.txt"
    anchor.click()
    URL.revokeObjectURL(url)
    setActionMessage("Download prepared")
  }

  function closeCodes() {
    if (!acknowledged) return
    setCodes([])
    setAcknowledged(false)
    setActionMessage("")
    void loadStatus()
  }

  return (
    <>
      <div
        style={{
          background: "#F1F0EA",
          border: "1px solid #D6D3C6",
          borderRadius: 6,
          padding: "14px 16px",
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, color: "#24302E", marginBottom: 4 }}>
          {loading
            ? "Checking backup codes…"
            : status
              ? `${status.unusedCodes} of ${status.totalCodes} backup codes remaining`
              : "Backup code status unavailable"}
        </div>
        <div style={{ color: "#8C897C" }}>
          Each recovery code is single-use. Existing codes cannot be displayed
          again.
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#FCEBEB",
            border: "1px solid #E8B4B4",
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 14,
            color: "#501313",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {!loading && status?.totalCodes === 0 && (
        <button
          onClick={() => void generateCodes()}
          disabled={generating}
          style={{
            height: 36,
            padding: "0 16px",
            background: generating ? "#8C897C" : "#4C7A6E",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: generating ? "wait" : "pointer",
          }}
        >
          {generating ? "Generating…" : "Generate Backup Codes"}
        </button>
      )}

      {codes.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="backup-codes-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,48,46,0.58)",
            display: "grid",
            placeItems: "center",
            zIndex: 300,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 32,
              width: "100%",
              maxWidth: 560,
              boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
            }}
          >
            <h2
              id="backup-codes-title"
              style={{ margin: "0 0 8px", color: "#24302E" }}
            >
              Save your backup codes
            </h2>
            <div
              style={{
                background: "#FCE8D6",
                border: "1px solid #B08D46",
                color: "#5C3300",
                borderRadius: 6,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              These codes will never be displayed again. Save them in a secure
              location.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
                background: "#F1F0EA",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                padding: 16,
              }}
            >
              {codes.map((code, index) => (
                <code key={code} style={{ color: "#24302E", fontSize: 13 }}>
                  <span aria-hidden="true">{index + 1}. </span>
                  <span>{code}</span>
                </code>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => void copyAll()} style={secondaryButton}>
                Copy All
              </button>
              <button onClick={downloadCodes} style={secondaryButton}>
                Download as .txt
              </button>
            </div>
            {actionMessage && (
              <p aria-live="polite" style={{ color: "#4C7A6E", fontSize: 12 }}>
                {actionMessage}
              </p>
            )}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 20,
                color: "#24302E",
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              I have safely saved these 10 recovery codes
            </label>
            <button
              onClick={closeCodes}
              disabled={!acknowledged}
              style={{
                ...primaryButton,
                marginTop: 20,
                background: acknowledged ? "#4C7A6E" : "#D6D3C6",
                cursor: acknowledged ? "pointer" : "not-allowed",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const secondaryButton: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  background: "#fff",
  color: "#4C7A6E",
  border: "1px solid #D6D3C6",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
}

const primaryButton: React.CSSProperties = {
  height: 40,
  padding: "0 22px",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
}
