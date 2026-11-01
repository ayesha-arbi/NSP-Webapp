import { useState, useRef } from "react"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"

import NavBar from "../components/NavBar"

import Footer from "../components/Footer"

import { BtnPrimary, BtnSecondary } from "../components/Btn"

interface Props {
  onBack: () => void
  onQRScan: () => void
  onVerify: (credentialId: string) => void | Promise<void>
  isLoading?: boolean
}

type State = "idle" | "loading" | "error-empty" | "error-invalid"


  onQRScan: () => void

  onVerify: (credentialId: string) => void
}

type State = "idle" | "loading" | "error-empty" | "error-invalid" | "error-notfound"

const STEPS = [
  "Retrieving credential record",

  "Checking credential integrity",

  "Recomputing verification hash",

  "Comparing with blockchain ledger",

  "Checking credential status",
]

export default function ManualEntryScreen({
  onBack,
  onQRScan,
  onVerify,
  isLoading: externalLoading,
}: Props) {
  const [value, setValue] = useState("")
  const [state, setState] = useState<State>("idle")
  const inputRef = useRef<HTMLInputElement>(null)

  const isUrnOrDid =
    value.toLowerCase().startsWith("urn:") ||
    value.toLowerCase().startsWith("did:")
  const suffix = isUrnOrDid ? value : value.replace(/^NSP-?/i, "")

  const handleVerify = async () => {
    const trimmed = value.trim()
    if (!trimmed || (!isUrnOrDid && !suffix)) {
      setState("error-empty")
      inputRef.current?.focus()
      return
    }

    if (!isUrnOrDid && suffix.length < 3) {
}: Props) {
  const [value, setValue] = useState("")

  const [state, setState] = useState<State>("idle")

  const [loadStep, setLoadStep] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  const isUrn = value.trim().toLowerCase().startsWith("urn:")
  const suffix = isUrn ? value.trim() : value.replace(/^NSP-?/i, "")

  const handleVerify = () => {
    const trimmed = value.trim()

    if (!trimmed) {
      setState("error-empty")
      inputRef.current?.focus()
      return
    }

    if (trimmed.length < 5) {
      setState("error-invalid")
      inputRef.current?.focus()
      return
    }

    const idToVerify = isUrnOrDid
      ? trimmed
      : trimmed.toUpperCase().startsWith("NSP-")
        ? trimmed.toUpperCase()
        : `NSP-${trimmed.toUpperCase()}`

    setState("loading")
    try {
      await onVerify(idToVerify)
    } catch {
      // Any uncaught error resets loading state
    } finally {
      setState("idle")
    }
  }


    setState("loading")

    let step = 0

    setLoadStep(0)

    const iv = setInterval(() => {
      step++

      if (step < STEPS.length) {
        setLoadStep(step)
      } else {
        clearInterval(iv)

        if (trimmed.toUpperCase().startsWith("NSP-X")) {
          setState("error-notfound")
        } else {
          onVerify(trimmed)
        }
      }
    }, 320)
  }

  const handleClear = () => {
    setValue("")
    setState("idle")
    inputRef.current?.focus()
  }

  const isLoading = state === "loading" || !!externalLoading
  const hasInputError = state === "error-empty" || state === "error-invalid"
  const isLoading = state === "loading"

  const hasInputError = state === "error-empty" || state === "error-invalid"

  const isNotFound = state === "error-notfound"

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
          { label: "Scan QR Code", onClick: onQRScan },

          { label: "Scan QR Code", onClick: onQRScan },

          { label: "Enter Credential ID" },
        ]}
      />

      <div style={{ background: "#24302E", padding: "40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <button
            onClick={onQRScan}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1px solid rgba(241,240,234,0.2)",
              borderRadius: 6,
              padding: "6px 12px",

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
            Back to QR Scanner
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
            Enter Credential ID
          </h1>
          <p
            style={{
              color: "rgba(241,240,234,0.55)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Type the ID exactly as it appears on the worker&apos;s certificate
            or digital wallet.
            Type the ID exactly as it appears on the worker's certificate or
            digital wallet.
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
            alignItems: "start",
          }}
        >
          <div>
            {/* Error summary */}
            {hasInputError && (
              <div
                style={{
                  background: "#EBDAD8",
                  border: "1px solid #A6453D",
                  borderLeft: "4px solid #A6453D",
                  borderRadius: "0 6px 6px 0",
                  padding: "16px 20px",
            {(hasInputError || isNotFound) && (
              <div
                style={{
                  background: isNotFound ? "#F1E7D2" : "#EBDAD8",

                  border: `1px solid ${isNotFound ? "#B08D46" : "#A6453D"}`,

                  borderLeft: `4px solid ${isNotFound ? "#B08D46" : "#A6453D"}`,

                  borderRadius: "0 6px 6px 0",

                  padding: "16px 20px",

                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#8C3B34",
                    marginBottom: 4,
                  }}
                >
                  There is a problem
                </p>
                <p style={{ fontSize: 13, color: "#8C3B34", lineHeight: 1.55 }}>
                  {state === "error-empty" &&
                    "Enter a Credential ID to continue."}
                  {state === "error-invalid" &&
                    "Enter a valid Credential ID, for example NSP-004821 or a canonical URN."}
                </p>
                    color: isNotFound ? "#8C6F35" : "#8C3B34",
                    marginBottom: 4,
                  }}
                >
                  {isNotFound ? "Credential not found" : "There is a problem"}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: isNotFound ? "#8C6F35" : "#8C3B34",
                    lineHeight: 1.55,
                    marginBottom: isNotFound ? 12 : 0,
                  }}
                >
                  {state === "error-empty" &&
                    "Enter a Credential ID to continue."}
                  {state === "error-invalid" &&
                    "Enter a valid Credential ID, for example NSP-004821."}
                  {state === "error-notfound" &&
                    "No credential was found with this ID. Check the ID and try again."}
                </p>
                {isNotFound && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <BtnPrimary onClick={handleClear}>Try again</BtnPrimary>
                    <BtnSecondary onClick={onQRScan}>
                      Scan QR Code instead
                    </BtnSecondary>
                  </div>
                )}
              </div>
            )}

            {/* Form card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "24px 24px 20px" }}>
                <label
                  htmlFor="cid"
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#24302E",
                    marginBottom: 4,
                  }}
                >
                  Credential ID
                </label>
                <p style={{ fontSize: 13, color: "#8C897C", marginBottom: 12 }}>
                  For example, NSP-004821 or urn:uuid:...
                </p>

                {/* Input container */}
                <div
                  style={{
                    display: "flex",
                    maxWidth: 460,
                    marginBottom: 20,
                    border: `1px solid ${
                      hasInputError ? "#A6453D" : "#D6D3C6"
                    }`,
                    borderRadius: 6,
                    overflow: "hidden",
                  For example, NSP-004821
                </p>

                {/* Split input */}
                <div
                  style={{
                    display: "flex",
                    maxWidth: 380,
                    marginBottom: 20,

                    border: `1px solid ${
                      hasInputError ? "#A6453D" : "#D6D3C6"
                    }`,

                    borderRadius: 6,
                    overflow: "hidden",

                    transition: "border-color 0.15s",
                  }}
                  onFocusCapture={(e) =>
                    (e.currentTarget.style.border = "1px solid #4C7A6E")
                  }
                  onBlurCapture={(e) =>
                    (e.currentTarget.style.border = `1px solid ${
                      hasInputError ? "#A6453D" : "#D6D3C6"
                    }`)
                  }
                >
                  {!isUrnOrDid && (
                    <div
                      style={{
                        background: "#F1F0EA",
                        borderRight: "1px solid #D6D3C6",
                        padding: "10px 14px",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#5C5A50",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      NSP–
                    </div>
                  )}
                  <div
                    style={{
                      background: "#F1F0EA",
                      borderRight: "1px solid #D6D3C6",
                      padding: "10px 14px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: isUrn ? "#4C7A6E" : "#5C5A50",
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isUrn ? "URN" : "NSP–"}
                  </div>
                  <input
                    ref={inputRef}
                    id="cid"
                    type="text"
                    value={suffix}
                    onChange={(e) => {
                      const text = e.target.value.trim()
                      if (
                        text.toLowerCase().startsWith("urn:") ||
                        text.toLowerCase().startsWith("did:") ||
                        /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(text)
                      ) {
                        setValue(text)
                      } else {
                        setValue(
                          "NSP-" +
                            e.target.value
                              .toUpperCase()
                              .replace(/[^0-9A-Z_-]/g, ""),
                        )
                    value={isUrn ? value : suffix}
                    onChange={(e) => {
                      const val = e.target.value
                      if (
                        val.toLowerCase().startsWith("urn:") ||
                        (val.includes("-") && val.length > 18)
                      ) {
                        setValue(val.trim())
                      } else {
                        const clean = val
                          .replace(/^NSP-?/i, "")
                          .toUpperCase()
                          .replace(/[^0-9A-Z]/g, "")
                        setValue(clean ? "NSP-" + clean : "")
                      }
                      setState("idle")
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !isLoading && handleVerify()
                    }
                    placeholder={isUrnOrDid ? "urn:uuid:..." : "004821"}
                    placeholder={
                      isUrn
                        ? "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7"
                        : "004821"
                    }
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck={false}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "none",
                      outline: "none",
                      fontSize: 15,
                      fontSize: isUrn ? 13 : 16,
                      fontWeight: 600,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "#24302E",
                      background: isLoading ? "#F1F0EA" : "#FFFFFF",
                      letterSpacing: "0.04em",
                    }}
                  />
                  {value && !isLoading && (
                    <button
                      type="button"
                      onClick={handleClear}
                      title="Clear"
                      style={{
                        background: "#FFFFFF",
                        border: "none",
                        borderLeft: "1px solid #D6D3C6",
                        padding: "0 12px",
                        cursor: "pointer",
                        color: "#8C897C",
                        display: "flex",
                        alignItems: "center",
                        fontFamily: "inherit",

                        padding: "0 12px",
                        cursor: "pointer",
                        color: "#8C897C",

                        display: "flex",
                        alignItems: "center",
                        fontFamily: "inherit",

                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#A6453D")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8C897C")
                      }
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                      >
                        <path
                          d="M3 3l7 7M10 3L3 10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <BtnPrimary onClick={handleVerify} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          style={{ animation: "spin 0.8s linear infinite" }}
                        >
                          <circle
                            cx="7"
                            cy="7"
                            r="5.5"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M7 1.5a5.5 5.5 0 015.5 5.5"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        Verifying against ledger...
                      </>
                    ) : (
                      "Verify Credential"
                    )}
                  </BtnPrimary>
                  <button
                    type="button"
                    onClick={onQRScan}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,

                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,

                      fontSize: 13,
                      fontWeight: 500,
                      color: "#5C5A50",
                      fontFamily: "inherit",

                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#24302E")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#5C5A50")
                    }
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect
                        x="1"
                        y="1"
                        width="4.5"
                        height="4.5"
                        rx="0.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        fill="none"
                      />
                      <rect
                        x="7.5"
                        y="1"
                        width="4.5"
                        height="4.5"
                        rx="0.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        fill="none"
                      />
                      <rect
                        x="1"
                        y="7.5"
                        width="4.5"
                        height="4.5"
                        rx="0.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        fill="none"
                      />
                      <rect
                        x="1.8"
                        y="1.8"
                        width="2.9"
                        height="2.9"
                        fill="currentColor"
                      />
                      <rect
                        x="8.3"
                        y="1.8"
                        width="2.9"
                        height="2.9"
                        fill="currentColor"
                      />
                      <rect
                        x="1.8"
                        y="8.3"
                        width="2.9"
                        height="2.9"
                        fill="currentColor"
                      />
                    </svg>
                    Scan QR instead
                  </button>
                </div>
              </div>

              {/* Progress */}
              {isLoading && (
                <div
                  style={{
                    borderTop: "1px solid #D6D3C6",
                    padding: "20px 24px",
                    background: "#F1F0EA",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8C6F35",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                    }}
                  >
                    Checking credential
                  </p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {STEPS.map((step, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "5px 0",

                          opacity: i <= loadStep ? 1 : 0.3,
                          transition: "opacity 0.3s",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            flexShrink: 0,

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            background:
                              i < loadStep ? "#B08D46" : "transparent",

                            border:
                              i < loadStep
                                ? "none"
                                : `2px solid ${
                                    i === loadStep ? "#B08D46" : "#D6D3C6"
                                  }`,

                            transition: "all 0.25s",
                          }}
                        >
                          {i < loadStep && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <path
                                d="M2 5l2.5 2.5L8 3"
                                stroke="#24302E"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          {i === loadStep && (
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#B08D46",
                              }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color:
                              i < loadStep
                                ? "#8C6F35"
                                : i === loadStep
                                  ? "#24302E"
                                  : "#8C897C",

                            fontWeight: i === loadStep ? 600 : 400,
                          }}
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
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
                  Where to find the ID
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
                  "Printed below the QR code on the physical certificate",
                  "Shown in the worker's NSP digital wallet app",
                  "Begins with NSP- or urn:uuid:",
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
          {!isLoading && (
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
                    Where to find the ID
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
                    "Printed below the QR code on the physical certificate",

                    "Shown in the worker's NSP digital wallet app",

                    "Starts with NSP- followed by digits",
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
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#B08D46",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Test Credentials (Click to Fill)
                </p>
                {[
                  {
                    id: "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",
                    label: "Guide #5 Canonical URN",
                  },
                  { id: "NSP-004821", label: "Verified (Legacy)" },
                  { id: "NSP-T001", label: "Tampered" },
                  { id: "NSP-R001", label: "Revoked" },
                  { id: "NSP-X001", label: "Not found" },
                ].map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setValue(d.id)
                      setState("idle")
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(241,240,234,0.07)",
                      cursor: "pointer",
                    }}
                    title={`Click to fill ${d.id}`}
                  >
                    <code
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "rgba(241,240,234,0.85)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 160,
                      }}
                    >
                      {d.id}
                    </code>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#B08D46",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {d.label}
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
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#B08D46",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Quick Test IDs (Click to fill)
              </p>
              {[
                { id: "NSP-004821", label: "Standard ID" },
                {
                  id: "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",
                  label: "Canonical URN",
                },
                { id: "NSP-T001", label: "Tampered test" },
                { id: "NSP-R001", label: "Revoked test" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setValue(d.id)
                    setState("idle")
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    border: "none",
                    borderBottom: "1px solid rgba(241,240,234,0.07)",
                    background: "none",
                    width: "100%",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "inherit",
                  }}
                >
                  <code
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "rgba(241,240,234,0.75)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 170,
                    }}
                  >
                    {d.id}
                  </code>
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(241,240,234,0.35)",
                      flexShrink: 0,
                    }}
                  >
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
