import { useState, useRef, useEffect, useCallback } from "react"
import jsQR from "jsqr"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import { BtnPrimary, BtnSecondary } from "../components/Btn"
import { extractCredentialId } from "../services/credentialExtractor"

interface Props {
  onBack: () => void
  onManualEntry: () => void
  onScanSuccess: (credentialId: string) => void
}

type ScanState = "permission" | "scanning" | "error-notdetected" | "error-format" | "error-nocamera"

export default function QRScannerScreen({
  onBack,
  onManualEntry,
  onScanSuccess,
}: Props) {
  const [scanState, setScanState] = useState<ScanState>("permission")
  const [denied, setDenied] = useState(false)
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const stopStream = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const handleDetectedRaw = useCallback(
    (raw: string) => {
      const extractedId = extractCredentialId(raw)
      stopStream()

      if (extractedId) {
        onScanSuccess(extractedId)
      } else {
        setScanState("error-format")
      }
    },
    [onScanSuccess, stopStream],
  )

  // Start real camera stream
  const startCamera = useCallback(async () => {
    stopStream()
    setDenied(false)
    setCameraErrorMsg(null)
    setScanState("scanning")

    try {
      let stream: MediaStream
      try {
        // Prefer rear camera on mobile devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch {
        // Fallback to any available video input
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: unknown) {
      const error = err as { name?: string message?: string }
      if (
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError"
      ) {
        setDenied(true)
        setScanState("permission")
      } else if (
        error?.name === "NotFoundError" ||
        error?.name === "DevicesNotFoundError"
      ) {
        setCameraErrorMsg(
          "No camera device was detected on your computer or device.",
        )
        setScanState("error-nocamera")
      } else {
        setCameraErrorMsg(
          error?.message || "Could not start video stream from camera.",
        )
        setScanState("error-nocamera")
      }
    }
  }, [stopStream])

  // Continuous frame analysis loop
  useEffect(() => {
    if (scanState !== "scanning") {
      stopStream()
      return
    }

    let isScanning = true
    let lastScanTime = 0

    const scanFrame = async (timestamp: number) => {
      if (!isScanning) return

      const video = videoRef.current
      const canvas = canvasRef.current

      // Throttle analysis to ~10-12 frames per second to save battery/CPU
      if (
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0
      ) {
        if (timestamp - lastScanTime >= 90) {
          lastScanTime = timestamp

          // 1. Try BarcodeDetector if natively supported
          let detected = false
          if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
              const BarcodeDetectorClass = (window as unknown as {
                BarcodeDetector: new (opts: { formats: string[] }) => {
                  detect: (
                    el: HTMLVideoElement,
                  ) => Promise<Array<{ rawValue?: string }>>
                }
              }).BarcodeDetector
              const detector = new BarcodeDetectorClass({
                formats: ["qr_code"],
              })
              const barcodes = await detector.detect(video)
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                detected = true
                isScanning = false
                handleDetectedRaw(barcodes[0].rawValue)
                return
              }
            } catch {
              // BarcodeDetector not supported for this element or platform, fallback to jsQR
            }
          }

          // 2. Fallback to jsQR on canvas image data
          if (!detected) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              )
              const qr = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                {
                  inversionAttempts: "dontInvert",
                },
              )
              if (qr && qr.data) {
                isScanning = false
                handleDetectedRaw(qr.data)
                return
              }
            }
          }
        }
      }

      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(scanFrame)
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame)

    return () => {
      isScanning = false
      stopStream()
    }
  }, [scanState, handleDetectedRaw, stopStream])

  // Decode QR from uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          setScanState("error-notdetected")
          return
        }

        ctx.drawImage(img, 0, 0, img.width, img.height)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const qr = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        })

        if (qr && qr.data) {
          handleDetectedRaw(qr.data)
        } else {
          setScanState("error-notdetected")
        }
      }
      img.src = (reader.result as string)
    }
    reader.readAsDataURL(file)
    // Reset file input
    e.target.value = ""
  }

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
            Hold the worker&apos;s certificate or digital wallet up to your
            camera.
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
                    minHeight: 340,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: 24,
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
                      color: "rgba(241,240,234,0.7)",
                      fontSize: 15,
                      textAlign: "center",
                      maxWidth: 300,
                      lineHeight: 1.6,
                    }}
                  >
                    Camera access is needed to scan the worker&apos;s credential
                    QR code
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
                    Allow camera access to scan QR codes live. Your camera
                    stream is processed entirely within your browser and is
                    never stored or transmitted.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <BtnPrimary onClick={startCamera}>
                      Start camera scanner
                    </BtnPrimary>
                    <BtnSecondary onClick={() => fileInputRef.current?.click()}>
                      Upload QR image
                    </BtnSecondary>
                    <BtnSecondary onClick={onManualEntry}>
                      Enter ID manually
                    </BtnSecondary>
                  </div>
                </div>
              </>
            )}

            {/* Permission denied */}
            {denied && (
              <div
                style={{
                  padding: "32px",
                  borderLeft: "4px solid #A6453D",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 18,
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
                  Camera permission was not granted by your browser. You can
                  enable it in your browser site permissions, upload an image of
                  the QR code, or type the Credential ID manually.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <BtnPrimary onClick={startCamera}>
                    Try camera again
                  </BtnPrimary>
                  <BtnSecondary onClick={() => fileInputRef.current?.click()}>
                    Upload QR image
                  </BtnSecondary>
                  <BtnSecondary onClick={onManualEntry}>
                    Enter Credential ID instead
                  </BtnSecondary>
                </div>
              </div>
            )}

            {/* Active camera scanning */}
            {scanState === "scanning" && (
              <>
                <div
                  style={{
                    background: "#18201F",
                    flex: 1,
                    minHeight: 380,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.9,
                    }}
                  />

                  {/* Viewfinder Target Box Overlay */}
                  <div
                    style={{
                      position: "relative",
                      width: 220,
                      height: 220,
                      zIndex: 2,
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
                        boxShadow: "0 0 8px #B08D46",
                        animation: "scanline 2s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      position: "relative",
                      zIndex: 2,
                      marginTop: 16,
                      color: "rgba(241,240,234,0.9)",
                      fontSize: 13,
                      fontWeight: 500,
                      background: "rgba(0,0,0,0.6)",
                      padding: "4px 14px",
                      borderRadius: 16,
                    }}
                  >
                    Align the QR code within the frame to verify
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
                  <BtnSecondary
                    onClick={() => {
                      stopStream()
                      setScanState("permission")
                    }}
                  >
                    Stop camera
                  </BtnSecondary>
                  <div style={{ display: "flex", gap: 10 }}>
                    <BtnSecondary onClick={() => fileInputRef.current?.click()}>
                      Upload QR image
                    </BtnSecondary>
                    <BtnSecondary onClick={onManualEntry}>
                      Enter ID manually
                    </BtnSecondary>
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
                    minHeight: 340,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: 24,
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
                  <p style={{ color: "rgba(241,240,234,0.7)", fontSize: 14 }}>
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
                    Make sure the QR code is clearly lit, in focus, and
                    completely visible.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <BtnPrimary onClick={startCamera}>Scan again</BtnPrimary>
                    <BtnSecondary onClick={() => fileInputRef.current?.click()}>
                      Upload image file
                    </BtnSecondary>
                    <BtnSecondary onClick={onManualEntry}>
                      Enter Credential ID instead
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
                    minHeight: 340,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: 24,
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
                  <p style={{ color: "rgba(241,240,234,0.7)", fontSize: 14 }}>
                    Invalid QR code format
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
                    The scanned QR code does not contain a recognized National
                    Skills Passport credential identifier. Please ensure you are
                    scanning an official NSP certificate or digital wallet code.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <BtnPrimary onClick={startCamera}>
                      Scan another QR code
                    </BtnPrimary>
                    <BtnSecondary onClick={() => fileInputRef.current?.click()}>
                      Upload QR image
                    </BtnSecondary>
                    <BtnSecondary onClick={onManualEntry}>
                      Enter Credential ID instead
                    </BtnSecondary>
                  </div>
                </div>
              </>
            )}

            {/* Error: no camera detected */}
            {scanState === "error-nocamera" && (
              <div
                style={{
                  padding: "32px",
                  borderLeft: "4px solid #B08D46",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#24302E",
                    marginBottom: 8,
                  }}
                >
                  Camera unavailable
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#5C5A50",
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  {cameraErrorMsg ||
                    "Could not connect to a camera. You can upload an image of the QR code or enter the Credential ID manually."}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <BtnPrimary onClick={() => fileInputRef.current?.click()}>
                    Upload QR image
                  </BtnPrimary>
                  <BtnSecondary onClick={onManualEntry}>
                    Enter Credential ID instead
                  </BtnSecondary>
                  <BtnSecondary onClick={onBack}>Back</BtnSecondary>
                </div>
              </div>
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
                  "If camera is unavailable, use file upload or manual entry",
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
                  "Your camera stream is processed locally inside your browser.",
                  "No video or frame captures are stored or transmitted anywhere.",
                  "Camera access can be revoked anytime in your browser settings.",
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

      {/* Hidden file input for uploading QR code images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* Hidden canvas for image and video frame analysis */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <Footer />
      <style>{`@keyframes scanline { 0%{top:4px} 50%{top:calc(100% - 6px)} 100%{top:4px} }`}</style>
    </div>
  )
}
