import { useState, useRef, useEffect } from "react"

interface StepUpModalProps {
  /** The scope label to display, e.g. "Approve Assessment" */
  scopeLabel: string
  /** Description of the action requiring elevation */
  actionDescription: string
  /** Whether the modal is currently visible */
  open: boolean
  /** Loading state while verifying */
  loading?: boolean
  /** Error message from failed verification */
  error?: string
  /** Called with the entered code (6-digit TOTP or 8-char backup) */
  onSubmit: (code: string, isBackupCode: boolean) => void
  /** Called when user cancels */
  onCancel: () => void
}

export default function StepUpModal({
  scopeLabel,
  actionDescription,
  open,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: StepUpModalProps) {
  const [code, setCode] = useState("")
  const [useBackup, setUseBackup] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCode("")
      setUseBackup(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const isValid = useBackup ? code.length === 8 : /^\d{6}$/.test(code)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return
    onSubmit(code, useBackup)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(36,48,46,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#FAFAF6",
          borderRadius: 12,
          width: 420,
          maxWidth: "92vw",
          padding: 28,
          boxShadow: "0 8px 32px rgba(36,48,46,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#EFE3C9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9C6B1F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#24302E",
                margin: 0,
              }}
            >
              Step-Up MFA Required
            </h2>
            <p style={{ fontSize: 12, color: "#5C5A50", margin: 0 }}>
              {scopeLabel}
            </p>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: "#5C5A50",
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}
        >
          {actionDescription}
        </p>

        {/* Code input */}
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#24302E",
            marginBottom: 6,
          }}
        >
          {useBackup
            ? "Backup Code (8 characters)"
            : "Authenticator Code (6 digits)"}
        </label>
        <input
          ref={inputRef}
          type="text"
          inputMode={useBackup ? "text" : "numeric"}
          maxLength={useBackup ? 8 : 6}
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value.replace(useBackup ? /[^a-zA-Z0-9]/g : /\D/g, ""),
            )
          }
          placeholder={useBackup ? "ABCD1234" : "000000"}
          disabled={loading}
          autoComplete="one-time-code"
          style={{
            width: "100%",
            height: 44,
            borderRadius: 6,
            border: `1px solid ${error ? "#A6453D" : "#D6D3C6"}`,
            padding: "0 12px",
            fontSize: 18,
            fontFamily: "monospace",
            letterSpacing: useBackup ? 2 : 6,
            textAlign: "center",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Error */}
        {error && (
          <p
            style={{
              fontSize: 12,
              color: "#A6453D",
              margin: "8px 0 0",
              fontWeight: 500,
            }}
          >
            {error}
          </p>
        )}

        {/* Toggle backup code */}
        <button
          type="button"
          onClick={() => {
            setUseBackup(!useBackup)
            setCode("")
          }}
          style={{
            background: "none",
            border: "none",
            color: "#4C7A6E",
            fontSize: 12,
            cursor: "pointer",
            padding: "8px 0",
            textDecoration: "underline",
          }}
        >
          {useBackup
            ? "Use authenticator code instead"
            : "Use a backup code instead"}
        </button>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              flex: 1,
              height: 42,
              background: isValid && !loading ? "#4C7A6E" : "#D6D3C6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: isValid && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              height: 42,
              padding: "0 20px",
              background: "#fff",
              color: "#24302E",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        {/* 5-minute expiry note */}
        <p
          style={{
            fontSize: 11,
            color: "#8C897C",
            margin: "12px 0 0",
            textAlign: "center",
          }}
        >
          Step-up tokens expire after 5 minutes and are single-use.
        </p>
      </form>
    </div>
  )
}
