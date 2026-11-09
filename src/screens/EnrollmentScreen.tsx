import { useState, useRef } from "react"

import Select from "@/components/Select"

import {
  api,
  CandidateRecord,
  ApiError,
  uploadCandidatePhoto,
} from "../services/api"
import { authStore } from "../services/authStore"

interface ExistingCandidateRecord {
  id: string
  status: string
  hub: string
  enrolledAt: string
  fullName?: string
  trade?: string
  cnic?: string
  raw?: any
}

interface EnrollmentScreenProps {
  onNavigateToAssessment?: (candidate: CandidateRecord) => void
  onNavigateToRecord?: (candidateId: string, candidateData?: any) => void
}

type EnrollmentModal = "none" | "nadra-success" | "nadra-fail" | "duplicate" | "photo-uploading" | "photo-done" | "photo-fail" | "enrol-success"

type OfflineState = "none" | "offline" | "syncing" | "synced" | "sync-fail"

const TRADES = [
  "Electrician",
  "Plumbing",
  "Welding",
  "Masonry",
  "Carpentry",
  "HVAC Technician",
  "Auto Mechanic",
  "Tailoring",
  "Computer Operation",
  "Solar Panel Installation",
]

const HUBS = [
  "Lahore-C01",
  "Karachi-C02",
  "Islamabad-C03",
  "Faisalabad-C04",
  "Peshawar-C05",
  "Multan-C06",
  "Rawalpindi-C07",
  "Hyderabad-C08",
]

function UploadIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8C897C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

export default function EnrollmentScreen({
  onNavigateToAssessment,
  onNavigateToRecord,
}: EnrollmentScreenProps) {
  const userHubId = authStore.getState().user?.hubLocationId
  const initialHub = userHubId != null && userHubId > 0 && userHubId <= HUBS.length
    ? HUBS[userHubId - 1]
    : ""

  const [form, setForm] = useState({
    fullName: "",
    fatherName: "",
    dob: "",
    cnic: "",
    trade: "",
    hub: initialHub,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [apiError, setApiError] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createdCandidate, setCreatedCandidate] =
    useState<CandidateRecord | null>(null)

  const [existingRecord, setExistingRecord] =
    useState<ExistingCandidateRecord | null>(null)

  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  const [nadraStatus, setNadraStatus] =
    useState<"unverified" | "verifying" | "verified" | "failed">("unverified")

  const [modal, setModal] = useState<EnrollmentModal>("none")

  const [offline, setOffline] = useState<OfflineState>("none")

  const [photoFile, setPhotoFile] = useState<string | null>(null)

  const [uploadProgress, setUploadProgress] = useState(0)

  const [enrollmentStatus, setEnrollmentStatus] =
    useState<"draft" | "in-progress">("draft")

  const fileRef = useRef<HTMLInputElement>(null)

  const lastFile = useRef<File | null>(null)

  const [photoS3Uri, setPhotoS3Uri] = useState<string | null>(null)

  const [photoError, setPhotoError] = useState("")

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    type = "text",
    mono = false,
  ) => (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#24302E",
          marginBottom: 6,
        }}
      >
        {label} <span style={{ color: "#A6453D" }}>*</span>
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }))
          setErrors((er) => ({ ...er, [key]: "" }))
          setApiError("")
        }}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: `1px solid ${errors[key] ? "#A6453D" : "#D6D3C6"}`,

          borderRadius: 6,
          fontSize: 14,
          background: "#fff",
          color: "#24302E",

          fontFamily: mono ? "IBM Plex Mono, monospace" : "Inter, sans-serif",
        }}
      />
      {errors[key] && (
        <p style={{ fontSize: 12, color: "#A6453D", margin: "4px 0 0" }}>
          {errors[key]}
        </p>
      )}
    </div>
  )

  function validate() {
    const e: Record<string, string> = {}

    if (!form.fullName.trim()) e.fullName = "Full name is required."

    if (!form.fatherName.trim()) e.fatherName = "Father's name is required."

    if (!form.dob) e.dob = "Date of birth is required."

    if (!form.cnic.trim()) e.cnic = "CNIC is required."
    else if (!/^\d{5}-\d{7}-\d$/.test(form.cnic.trim()))
      e.cnic = "Format: XXXXX-XXXXXXX-X"

    if (!form.trade) e.trade = "Trade category is required."

    if (!form.hub) e.hub = "Hub assignment is required."

    setErrors(e)

    return Object.keys(e).length === 0
  }

  async function handleNadraVerify() {
    if (!form.cnic || !/^\d{5}-\d{7}-\d$/.test(form.cnic.trim())) {
      setErrors((e) => ({ ...e, cnic: "Enter a valid CNIC before verifying." }))

      return
    }

    setNadraStatus("verifying")

    await new Promise((r) => setTimeout(r, 1200))

    setNadraStatus("verified")
    setModal("nadra-success")
  }

  // request pre-signed URL, PUT straight to S3, keep the s3Uri for enrolment.

  async function uploadPhoto(file: File) {
    setPhotoS3Uri(null)

    setPhotoError("")

    setUploadProgress(30)

    setModal("photo-uploading")

    try {
      const uri = await uploadCandidatePhoto(file)

      setPhotoS3Uri(uri)

      setUploadProgress(100)

      setModal("photo-done")
    } catch (err: any) {
      setPhotoError(err?.message || "Upload failed")

      setUploadProgress(100)

      setModal("photo-fail")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file) return

    lastFile.current = file

    if (photoFile) URL.revokeObjectURL(photoFile)

    setPhotoFile(URL.createObjectURL(file))

    void uploadPhoto(file)
  }

  function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault()

    setEnrollmentStatus("draft")
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    if (!photoS3Uri) {
      setApiError("Please upload the candidate photo before continuing.")

      return
    }

    setApiError("")

    setIsSubmitting(true)

    try {
      const res = await api.enrolCandidate({
        fullName: form.fullName.trim(),

        fatherName: form.fatherName.trim(),

        dob: form.dob,

        cnic: form.cnic.trim(),

        photoS3Uri,

        tradeCategory: form.trade,
      })

      if (res.success && res.candidate) {
        setCreatedCandidate(res.candidate)

        setNadraStatus("verified")

        setEnrollmentStatus("in-progress")

        setModal("enrol-success")
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          // FR-CAND-01: Distinguish hub quota from duplicate CNIC
          if (
            err.message?.toLowerCase().includes("maximum enrolment limit") ||
            err.message?.toLowerCase().includes("maximum enrollment limit") ||
            err.data?.message
              ?.toLowerCase()
              .includes("maximum enrolment limit") ||
            err.data?.message
              ?.toLowerCase()
              .includes("maximum enrollment limit")
          ) {
            setApiError(
              "Hub Quota Reached: Maximum candidates have already enrolled in this hub.",
            )
          } else {
            const resData = err.data || {}
            const candidatePayload =
              resData.candidate ||
              resData.existingCandidate ||
              resData.existingRecord ||
              resData.record ||
              resData.data?.candidate ||
              resData.data?.existingCandidate ||
              resData.data ||
              {}

            let extractedId =
              candidatePayload.id ||
              candidatePayload.candidateId ||
              candidatePayload.candidate_id ||
              candidatePayload.recordId ||
              candidatePayload.record_id ||
              resData.id ||
              resData.candidateId ||
              resData.candidate_id ||
              resData.recordId ||
              resData.record_id ||
              ""

            if (!extractedId && typeof resData.message === "string") {
              const match = resData.message.match(
                /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|CAND-[A-Za-z0-9-]+)/,
              )
              if (match) {
                extractedId = match[1]
              }
            }

            const rawStatus =
              candidatePayload.status ||
              candidatePayload.enrollmentStatus ||
              candidatePayload.recordStatus ||
              resData.status ||
              "In Review"

            const formattedStatus =
              typeof rawStatus === "string"
                ? rawStatus.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : "In Review"

            const hubName =
              candidatePayload.hub ||
              candidatePayload.hubLocationId ||
              candidatePayload.testingHubId ||
              candidatePayload.testing_hub_id ||
              resData.hub ||
              resData.testingHubId ||
              (candidatePayload.hubLocationId != null
                ? `Hub ${candidatePayload.hubLocationId}`
                : "") ||
              form.hub ||
              "Lahore-C01"

            const rawEnrolledAt =
              candidatePayload.enrolledAt ||
              candidatePayload.enrolled_at ||
              candidatePayload.createdAt ||
              candidatePayload.created_at ||
              candidatePayload.enrollmentDate ||
              resData.enrolledAt ||
              resData.createdAt

            let formattedDate = ""
            if (rawEnrolledAt) {
              try {
                formattedDate = new Date(rawEnrolledAt).toISOString().split("T")[0]
              } catch {
                formattedDate = String(rawEnrolledAt)
              }
            }
            if (!formattedDate) {
              formattedDate = new Date().toISOString().split("T")[0]
            }

            const rec: ExistingCandidateRecord = {
              id: extractedId ? String(extractedId) : "",
              status: formattedStatus,
              hub: String(hubName),
              enrolledAt: formattedDate,
              fullName:
                candidatePayload.fullName ||
                candidatePayload.full_name ||
                candidatePayload.name ||
                form.fullName,
              trade:
                candidatePayload.tradeCategory ||
                candidatePayload.trade_category ||
                candidatePayload.trade ||
                form.trade,
              cnic: candidatePayload.cnic || form.cnic,
              raw: candidatePayload,
            }

            // Graceful fallback: if ID wasn't in 409 payload, attempt lookup by CNIC from candidate list
            if (!rec.id && form.cnic) {
              try {
                const candidates = await api.listCandidates()
                const cleanedCnic = form.cnic.replace(/\D/g, "")
                const match = candidates.find(
                  (c) => c.cnic && c.cnic.replace(/\D/g, "") === cleanedCnic,
                )
                if (match) {
                  rec.id = match.id || match.candidateId || ""
                  if (match.fullName) rec.fullName = match.fullName
                  if (match.tradeCategory) rec.trade = match.tradeCategory
                  if (match.createdAt) {
                    rec.enrolledAt = new Date(match.createdAt).toISOString().split("T")[0]
                  }
                  if (match.hub) rec.hub = match.hub
                }
              } catch {
                // Graceful fallback if list request fails
              }
            }

            setExistingRecord(rec)
            setDuplicateError(null)
            setModal("duplicate")
          }
          return
        }

        if (err.status === 422) {
          setNadraStatus("failed")

          setModal("nadra-fail")

          return
        }
      }

      // Never fabricate a candidate locally: a fake id would 404 at assessment creation.

      setApiError(
        err instanceof ApiError && err.status === 0
          ? "Cannot reach the server. Enrolment needs a connection, please try again when online."
          : err?.message || "Enrolment failed.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewExistingRecord = () => {
    const recordId = existingRecord?.id?.trim()
    if (!recordId) {
      setDuplicateError(
        "Candidate record ID is missing or invalid. Please check the candidates list.",
      )
      return
    }

    setModal("none")
    setDuplicateError(null)

    if (onNavigateToRecord) {
      onNavigateToRecord(recordId, existingRecord)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #D6D3C6",

    borderRadius: 6,
    fontSize: 14,
    background: "#fff",
    color: "#24302E",
    fontFamily: "Inter, sans-serif",
  }

  return (
    <div>
      {/* Offline banner */}
      {offline !== "none" && (
        <div
          style={{
            background:
              offline === "offline" || offline === "sync-fail"
                ? "#FCE8D6"
                : offline === "syncing"
                  ? "#E4EEFC"
                  : "#EAF3DE",
            border: `1px solid ${
              offline === "offline" || offline === "sync-fail"
                ? "#B08D46"
                : offline === "syncing"
                  ? "#2E6FE0"
                  : "#4C7A6E"
            }`,
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  offline === "offline"
                    ? "#B08D46"
                    : offline === "syncing"
                      ? "#2E6FE0"
                      : offline === "sync-fail"
                        ? "#A6453D"
                        : "#4C7A6E",
                flexShrink: 0,
              }}
            />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#24302E" }}>
                {offline === "offline"
                  ? "Offline Mode"
                  : offline === "syncing"
                    ? "Syncing…"
                    : offline === "sync-fail"
                      ? "Sync Failed"
                      : "Synchronized"}
              </span>
              <span style={{ fontSize: 13, color: "#5C5A50" }}>
                {offline === "offline"
                  ? " · 3 records queued locally · Last sync: Today 08:42"
                  : offline === "syncing"
                    ? " · Uploading 3 records…"
                    : offline === "sync-fail"
                      ? " · Unable to reach server. Retry later."
                      : " · All records uploaded successfully"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {offline !== "synced" && (
              <button
                onClick={() => setOffline("syncing")}
                style={{
                  height: 30,
                  padding: "0 12px",
                  background: "#4C7A6E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sync Now
              </button>
            )}
            <button
              onClick={() => setOffline("none")}
              style={{
                height: 30,
                padding: "0 12px",
                background: "#fff",
                color: "#24302E",
                border: "1px solid #D6D3C6",
                borderRadius: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            className="display"
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#24302E",
              margin: "0 0 4px",
              letterSpacing: -0.2,
            }}
          >
            Enroll Candidate
          </h1>
          <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
            Complete all sections to register a new candidate.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 26,
              padding: "0 10px",
              background: enrollmentStatus === "draft" ? "#F1EFE8" : "#FCE8D6",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: enrollmentStatus === "draft" ? "#5C5A50" : "#5C3300",
            }}
          >
            {enrollmentStatus === "draft" ? "◌ Draft" : "◑ In Progress"}
          </span>
          <button
            onClick={() => setOffline("offline")}
            style={{
              height: 30,
              padding: "0 12px",
              background: "#fff",
              color: "#5C5A50",
              border: "1px solid #D6D3C6",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Preview Offline
          </button>
        </div>
      </div>

      {apiError && (
        <div
          role="alert"
          style={{
            background: "#FCEBEB",
            border: "1px solid #A6453D",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#501313",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{apiError}</span>
          <button
            type="button"
            onClick={() => setApiError("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#501313",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleContinue} noValidate>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}
        >
          {/* Main form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Candidate Info */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#24302E",
                  margin: "0 0 20px",
                  paddingBottom: 12,
                  borderBottom: "1px solid #F1EFE8",
                }}
              >
                Candidate Information
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {field("fullName", "Full Name", "e.g. Muhammad Aamir Khan")}
                {field("fatherName", "Father's Name", "e.g. Khan Muhammad")}
                {field("dob", "Date of Birth", "", "date")}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#24302E",
                      marginBottom: 6,
                    }}
                  >
                    CNIC <span style={{ color: "#A6453D" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.cnic}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, cnic: e.target.value }))
                      setErrors((er) => ({ ...er, cnic: "" }))
                      setNadraStatus("unverified")
                    }}
                    placeholder="XXXXX-XXXXXXX-X"
                    style={{
                      ...inputStyle,
                      fontFamily: "IBM Plex Mono, monospace",
                      letterSpacing: 1,
                      border: `1px solid ${
                        errors.cnic ? "#A6453D" : "#D6D3C6"
                      }`,
                    }}
                  />
                  {errors.cnic && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#A6453D",
                        margin: "4px 0 0",
                      }}
                    >
                      {errors.cnic}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#24302E",
                      marginBottom: 6,
                    }}
                  >
                    Trade Category <span style={{ color: "#A6453D" }}>*</span>
                  </label>
                  <Select
                    value={form.trade}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, trade: v }))
                      setErrors((er) => ({ ...er, trade: "" }))
                    }}
                    options={[
                      { value: "", label: "Select trade…" },
                      ...TRADES.map((t) => ({ value: t, label: t })),
                    ]}
                    style={{
                      ...inputStyle,
                      border: `1px solid ${
                        errors.trade ? "#A6453D" : "#D6D3C6"
                      }`,
                      height: 38,
                      width: "100%",
                    }}
                  />
                  {errors.trade && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#A6453D",
                        margin: "4px 0 0",
                      }}
                    >
                      {errors.trade}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#24302E",
                      marginBottom: 6,
                    }}
                  >
                    Hub Assignment <span style={{ color: "#A6453D" }}>*</span>
                  </label>
                  <Select
                    value={form.hub}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, hub: v }))
                      setErrors((er) => ({ ...er, hub: "" }))
                    }}
                    options={[
                      { value: "", label: "Select hub…" },
                      ...HUBS.map((h) => ({ value: h, label: h })),
                    ]}
                    style={{
                      ...inputStyle,
                      border: `1px solid ${errors.hub ? "#A6453D" : "#D6D3C6"}`,
                      height: 38,
                      width: "100%",
                    }}
                  />
                  {errors.hub && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#A6453D",
                        margin: "4px 0 0",
                      }}
                    >
                      {errors.hub}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Verification */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#24302E",
                  margin: "0 0 20px",
                  paddingBottom: 12,
                  borderBottom: "1px solid #F1EFE8",
                }}
              >
                Identity Verification
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "#F1F0EA",
                  borderRadius: 6,
                  border: "1px solid #D6D3C6",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#24302E",
                      marginBottom: 2,
                    }}
                  >
                    Identity Verification
                  </div>
                  <div style={{ fontSize: 13, color: "#5C5A50" }}>
                    Verify the candidate's CNIC against national records.
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {nadraStatus === "verified" && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#173404",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="8" fill="#4C7A6E" />
                        <polyline
                          points="4,8 6.5,11 12,5"
                          stroke="white"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Verified
                    </span>
                  )}
                  {nadraStatus === "failed" && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#501313",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="8" fill="#A6453D" />
                        <line
                          x1="5"
                          y1="5"
                          x2="11"
                          y2="11"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1="11"
                          y1="5"
                          x2="5"
                          y2="11"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Failed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNadraVerify}
                    disabled={
                      nadraStatus === "verifying" || nadraStatus === "verified"
                    }
                    style={{
                      height: 36,
                      padding: "0 16px",
                      background:
                        nadraStatus === "verified" ? "#F1F0EA" : "#4C7A6E",
                      color: nadraStatus === "verified" ? "#8C897C" : "#fff",
                      border: `1px solid ${
                        nadraStatus === "verified" ? "#D6D3C6" : "transparent"
                      }`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor:
                        nadraStatus === "verifying" ||
                        nadraStatus === "verified"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {nadraStatus === "verifying"
                      ? "Verifying…"
                      : nadraStatus === "verified"
                        ? "Verified"
                        : "Verify Identity"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Photo upload */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#24302E",
                  margin: "0 0 16px",
                  paddingBottom: 12,
                  borderBottom: "1px solid #F1EFE8",
                }}
              >
                Candidate Photo
              </h2>
              {photoFile ? (
                <div>
                  <img
                    src={photoFile}
                    alt="Candidate photo preview"
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #D6D3C6",
                      marginBottom: 12,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoS3Uri(null)
                        lastFile.current = null
                        if (fileRef.current) fileRef.current.value = ""
                      }}
                      style={{
                        flex: 1,
                        height: 34,
                        background: "#fff",
                        color: "#8C3B34",
                        border: "1px solid #A6453D",
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      style={{
                        flex: 1,
                        height: 34,
                        background: "#fff",
                        color: "#24302E",
                        border: "1px solid #D6D3C6",
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "2px dashed #D6D3C6",
                    borderRadius: 6,
                    padding: "32px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#4C7A6E")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#D6D3C6")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <UploadIcon />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#24302E",
                      marginBottom: 4,
                    }}
                  >
                    Drag & drop or browse
                  </div>
                  <div style={{ fontSize: 12, color: "#8C897C" }}>
                    JPG, PNG · Max 5 MB · Min 200×200px
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            {/* Summary */}
            <div
              style={{
                background: "#F1F0EA",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#24302E",
                  margin: "0 0 12px",
                }}
              >
                Enrollment Summary
              </h3>
              {[
                {
                  label: "Identity",
                  val:
                    nadraStatus === "verified"
                      ? "Verified ✓"
                      : nadraStatus === "failed"
                        ? "Failed"
                        : "Pending",
                  color:
                    nadraStatus === "verified"
                      ? "#173404"
                      : nadraStatus === "failed"
                        ? "#501313"
                        : "#8C897C",
                },

                {
                  label: "Photo",
                  val: photoS3Uri ? "Uploaded ✓" : "Not uploaded",
                  color: photoS3Uri ? "#173404" : "#8C897C",
                },

                {
                  label: "Status",
                  val: enrollmentStatus === "draft" ? "Draft" : "In Progress",
                  color: "#24302E",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    padding: "6px 0",
                    borderBottom: "1px solid #E8E6DF",
                  }}
                >
                  <span style={{ color: "#5C5A50" }}>{s.label}</span>
                  <span style={{ color: s.color, fontWeight: 500 }}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <button
            type="submit"
            disabled={
              isSubmitting || apiError.includes("Testing Hub Quota Reached")
            }
            style={{
              height: 40,
              padding: "0 24px",
              background:
                isSubmitting || apiError.includes("Testing Hub Quota Reached")
                  ? "#5C5A50"
                  : "#4C7A6E",

              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,

              cursor:
                isSubmitting || apiError.includes("Testing Hub Quota Reached")
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isSubmitting
              ? "Enrolling Candidate…"
              : "Enrol Candidate (Save & Continue)"}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            style={{
              height: 40,
              padding: "0 24px",
              background: "#fff",
              color: "#24302E",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() =>
              setForm({
                fullName: "",
                fatherName: "",
                dob: "",
                cnic: "",
                trade: "",
                hub: initialHub,
              })
            }
            style={{
              height: 40,
              padding: "0 24px",
              background: "#fff",
              color: "#8C3B34",
              border: "1px solid #A6453D",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reset Form
          </button>
        </div>
      </form>

      {/* Enrollment Success Modal */}
      {modal === "enrol-success" && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#EAF3DE",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4C7A6E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Candidate Successfully Enrolled
              </h2>
              <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
                Candidate record has been saved and is ready for trade
                assessment.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 20px",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Candidate ID
                </div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {createdCandidate?.id || "UUID-generated"}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Full Name
                </div>
                <div style={{ color: "#24302E", fontWeight: 600 }}>
                  {form.fullName}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Trade Category
                </div>
                <div style={{ color: "#24302E" }}>{form.trade}</div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>Status</div>
                <span style={{ color: "#173404", fontWeight: 600 }}>
                  Ready for Assessment
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {onNavigateToAssessment && (
              <button
                onClick={() => {
                  setModal("none")

                  if (createdCandidate) onNavigateToAssessment(createdCandidate)
                }}
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
                Proceed to Score Entry →
              </button>
            )}
            <button
              onClick={() => {
                setModal("none")

                setForm({
                  fullName: "",
                  fatherName: "",
                  dob: "",
                  cnic: "",
                  trade: "",
                  hub: initialHub,
                })
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
              Enrol Another
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Verification Success Modal */}
      {modal === "nadra-success" && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#EAF3DE",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4C7A6E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Identity Verified
              </h2>
              <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
                Identity records match for the provided CNIC.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#EAF3DE",
              border: "1px solid #4C7A6E",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 24px",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Candidate Name
                </div>
                <div style={{ color: "#24302E", fontWeight: 600 }}>
                  {form.fullName || "Muhammad Aamir Khan"}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>CNIC</div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {form.cnic}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Verification Result
                </div>
                <div style={{ color: "#173404", fontWeight: 600 }}>
                  Identity Match
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Timestamp
                </div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setModal("none")}
            style={{
              width: "100%",
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
            Continue Enrollment
          </button>
        </ModalOverlay>
      )}

      {/* Verification Fail Modal */}
      {modal === "nadra-fail" && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#FCEBEB",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A6453D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Verification Failed
              </h2>
              <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
                The CNIC provided does not match identity records.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#FCEBEB",
              border: "1px solid #A6453D",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#501313",
            }}
          >
            Identity mismatch detected. The provided CNIC could not be verified
            against the national registry.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setNadraStatus("unverified")
                setModal("none")
              }}
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
              Retry Verification
            </button>
            <button
              onClick={() => setModal("none")}
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
        </ModalOverlay>
      )}

      {/* Duplicate Candidate Modal */}
      {modal === "duplicate" && (
        <ModalOverlay>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#FCE8D6",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B08D46"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Duplicate Candidate
              </h2>
              <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
                A candidate with this CNIC already exists in the system.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#8C897C",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Existing Record
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 24px",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Record ID
                </div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {existingRecord?.id || "ID Not Available"}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>Status</div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#123B7A",
                    background: "#E4EEFC",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {existingRecord?.status || "Enrolled"}
                </span>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>Hub</div>
                <div style={{ color: "#24302E" }}>
                  {existingRecord?.hub || form.hub || "Lahore-C01"}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Enrolled
                </div>
                <div
                  style={{
                    color: "#24302E",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {existingRecord?.enrolledAt || "—"}
                </div>
              </div>
            </div>
            {duplicateError && (
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background: "#FCEBEB",
                  border: "1px solid #A6453D",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#501313",
                }}
              >
                {duplicateError}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleViewExistingRecord}
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
              View Existing Record
            </button>
            <button
              onClick={() => {
                setModal("none")
                setExistingRecord(null)
                setDuplicateError(null)
              }}
              style={{
                height: 40,
                padding: "0 20px",
                background: "#fff",
                color: "#8C3B34",
                border: "1px solid #A6453D",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel Enrollment
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Photo Upload Progress */}
      {(modal === "photo-uploading" ||
        modal === "photo-done" ||
        modal === "photo-fail") && (
        <ModalOverlay>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#24302E",
              margin: "0 0 20px",
            }}
          >
            {modal === "photo-uploading"
              ? "Uploading Photo…"
              : modal === "photo-done"
                ? "Upload Complete"
                : "Upload Failed"}
          </h2>
          {photoFile && (
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <img
                src={photoFile}
                alt="Preview"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #D6D3C6",
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#24302E",
                    marginBottom: 2,
                  }}
                >
                  {lastFile.current?.name ?? "photo"}
                </div>
                <div style={{ fontSize: 12, color: "#8C897C" }}>
                  {lastFile.current
                    ? `${(lastFile.current.size / 1024 / 1024).toFixed(1)} MB`
                    : ""}
                </div>
              </div>
            </div>
          )}
          <div
            style={{
              background: "#F1F0EA",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              <span style={{ color: "#5C5A50" }}>
                {modal === "photo-uploading"
                  ? "Uploading to S3…"
                  : modal === "photo-done"
                    ? "Upload successful"
                    : photoError || "Upload failed"}
              </span>
              <span style={{ fontWeight: 600, color: "#24302E" }}>
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div style={{ height: 6, background: "#D6D3C6", borderRadius: 3 }}>
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  background: modal === "photo-fail" ? "#A6453D" : "#B08D46",
                  borderRadius: 3,
                  transition: "width 0.2s",
                }}
              />
            </div>
          </div>
          {modal === "photo-done" && (
            <button
              onClick={() => setModal("none")}
              style={{
                width: "100%",
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
              Done
            </button>
          )}
          {modal === "photo-fail" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() =>
                  lastFile.current && uploadPhoto(lastFile.current)
                }
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
                Retry Upload
              </button>
              <button
                onClick={() => setModal("none")}
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
          )}
        </ModalOverlay>
      )}
    </div>
  )
}

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
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
          maxWidth: 500,
          width: "90%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
