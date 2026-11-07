import { useState, useEffect } from "react"
import { api } from "../services/api"

export type RecordStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "MINTED"
export type CredentialStatus = "Valid" | "Revoked"

interface HistoryEvent {
  action: string
  performedBy: string
  datetime: string
}

interface Candidate {
  photo?: string
  name: string
  fatherName: string
  dob: string
  cnic: string
  trade: string
  hub: string
  id: string
  enrolledAt: string
}

interface Assessment {
  id: string
  score: number
  maxScore: number
  grade: string
  tester: string
  submittedAt: string
  superintendent?: string
  approvedAt?: string
  status: RecordStatus
}

interface Rejection {
  reason: string
  rejectedBy: string
  rejectedAt: string
}

interface Credential {
  id: string
  status: CredentialStatus
  issuerDid: string
  hash: string
  txHash: string
  blockNumber: number
  mintedAt: string
  revocationReason?: string
  revokedAt?: string
}

interface MediaItem {
  type: string
  url: string
  name: string
}

interface RecordData {
  candidate: Candidate
  assessment: Assessment
  rejection?: Rejection
  credential?: Credential
  media?: MediaItem[]
  history: HistoryEvent[]
}

interface RecordDetailProps {
  onBack?: () => void
  onResubmit?: () => void
  userRole?: "trade-tester" | "center-superintendent" | "super-admin"
  assessmentId?: string
  data?: RecordData
}

const Icons = {
  Check: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Eye: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  X: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  AlertCircle: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  User: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  FileText: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Download: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ArrowLeft: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Shield: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Clock: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
}

function StatusPill({ status }: { status: RecordStatus }) {
  const map: Record<RecordStatus, {
    bg: string
    text: string
    label: string
    svg: React.ReactNode
  }> = {
    DRAFT: {
      bg: "#F1EFE8",
      text: "#5F5E5A",
      label: "Draft",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="#888780"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        </svg>
      ),
    },
    SUBMITTED: {
      bg: "#F1E7D2",
      text: "#8C6F35",
      label: "In Review",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
          <path d="M17 10 A7 7 0 0 1 10 17 L10 10 Z" fill="#B08D46" />
          <path d="M10 17 A7 7 0 0 1 3 10 L10 10 Z" fill="#B08D46" />
        </svg>
      ),
    },
    APPROVED: {
      bg: "#E4EEFC",
      text: "#123B7A",
      label: "Approved",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#2E6FE0" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#2E6FE0" />
          <path d="M17 10 A7 7 0 0 1 10 17 L10 10 Z" fill="#2E6FE0" />
          <path d="M10 17 A7 7 0 0 1 3 10 L10 10 Z" fill="#2E6FE0" />
        </svg>
      ),
    },
    MINTED: {
      bg: "#DCE7E3",
      text: "#2F5C4E",
      label: "Completed",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#4C7A6E" />
          <path
            d="M6 10 L9 13 L14 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    REJECTED: {
      bg: "#EFE3C9",
      text: "#9C6B1F",
      label: "Needs Attention",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#B08D46" />
          <path
            d="M10 5 L10 11 M10 14 L10 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  }
  const s = (map as Record<string, any>)[status] || (map as any).draft || Object.values(map)[0]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px 0 6px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        background: s.bg,
        color: s.text,
      }}
    >
      {s.svg}
      {s.label}
    </span>
  )
}

function CredentialStatusPill({ status }: { status: CredentialStatus }) {
  const map = {
    Valid: {
      bg: "#DCE7E3",
      text: "#2F5C4E",
      label: "Verified",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#4C7A6E" />
          <path
            d="M6 10 L9 13 L14 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    Revoked: {
      bg: "#EBDAD8",
      text: "#8C3B34",
      label: "Revoked",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#A6453D" />
          <path
            d="M7 7 L13 13 M13 7 L7 13"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  }
  const s = (map as Record<string, any>)[status] || (map as any).draft || Object.values(map)[0]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px 0 6px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        background: s.bg,
        color: s.text,
      }}
    >
      {s.svg}
      {s.label}
    </span>
  )
}

function SectionCard({
  title,
  children,
  noPadding = false,
}: {
  title: string
  children: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #D6D3C6",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #D6D3C6",
          background: "#F1F0EA",
        }}
      >
        <h2
          style={{ fontSize: 16, fontWeight: 600, color: "#4C7A6E", margin: 0 }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: noPadding ? 0 : 24 }}>{children}</div>
    </div>
  )
}

function DataField({
  label,
  value,
  mono = false,
  highlight = false,
  multiline = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  highlight?: boolean
  multiline?: boolean
}) {
  return (
    <div style={{ marginBottom: multiline ? 0 : 16 }}>
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "#5C5A50",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: highlight ? 18 : 14,
          fontWeight: highlight ? 700 : 500,
          color: highlight ? "#4C7A6E" : "#24302E",
          fontFamily: mono ? "IBM Plex Mono, monospace" : "Inter, sans-serif",
          lineHeight: multiline ? 1.5 : 1,
        }}
      >
        {value || "—"}
      </div>
    </div>
  )
}

export default function CandidateRecordScreen({
  onBack,
  onResubmit,
  userRole = "super-admin",
  assessmentId,
  data: initialData,
}: RecordDetailProps) {
  const [data, setData] = useState<RecordData | null>(initialData || null)
  const [loading, setLoading] = useState<boolean>(!initialData && !!assessmentId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setData(initialData)
      setLoading(false)
      return
    }

    if (assessmentId) {
      loadAssessmentData(assessmentId)
    }
  }, [assessmentId, initialData])

  const loadAssessmentData = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getAssessment(id)
      
      // Transform API response to RecordData format
      const assessment = response.assessment
      const transformedData: RecordData = {
        candidate: {
          name: assessment.candidateName || "Unknown",
          fatherName: "",
          dob: "",
          cnic: "",
          trade: assessment.tradeCategory || "Unknown",
          hub: "",
          id: assessment.candidateId || "",
          enrolledAt: assessment.createdAt || "",
        },
        assessment: {
          id: assessment.assessmentId,
          score: assessment.score,
          maxScore: 100,
          grade: assessment.grade,
          tester: "",
          submittedAt: assessment.submittedAt || assessment.createdAt,
          superintendent: "",
          approvedAt: assessment.approvedAt,
          status: assessment.status as RecordStatus,
        },
        history: [
          {
            action: "Assessment Created",
            performedBy: "System",
            datetime: assessment.createdAt,
          },
          ...(assessment.submittedAt ? [{
            action: "Assessment Submitted",
            performedBy: "Trade Tester",
            datetime: assessment.submittedAt,
          }] : []),
          ...(assessment.approvedAt ? [{
            action: "Assessment Approved",
            performedBy: "Center Superintendent",
            datetime: assessment.approvedAt,
          }] : []),
        ],
      }

      if (assessment.rejectionReason) {
        transformedData.rejection = {
          reason: assessment.rejectionReason,
          rejectedBy: "Center Superintendent",
          rejectedAt: assessment.approvedAt || "",
        }
      }

      setData(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assessment data")
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 64 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            color: "#5C5A50",
            fontSize: 16,
          }}
        >
          Loading record data...
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 64 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            color: "#A6453D",
            fontSize: 16,
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  // Empty state
  if (!data) {
    return (
      <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 64 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            color: "#5C5A50",
            fontSize: 16,
          }}
        >
          No record data available. Please provide an assessment ID or record data.
        </div>
      </div>
    )
  }

  const isRejected = data.assessment.status === "REJECTED"
  const isMinted = data.assessment.status === "MINTED"
  const isRevoked = data.credential?.status === "Revoked"

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 64 }}>
      {/* Header Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                background: "#fff",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                cursor: "pointer",
                color: "#5C5A50",
              }}
            >
              <Icons.ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1
              className="display"
              style={{
                fontSize: 32,
                fontWeight: 400,
                color: "#4C7A6E",
                margin: "0 0 4px",
                letterSpacing: -0.2,
              }}
            >
              Candidate Record Detail
            </h1>
            <div
              style={{
                fontSize: 14,
                color: "#5C5A50",
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {data.assessment.id}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <StatusPill status={data.assessment.status} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SectionCard title="Candidate Information">
            <div style={{ display: "flex", gap: 32 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#E4E2D9",
                  border: "1px solid #D6D3C6",
                  flexShrink: 0,
                }}
              >
                {data.candidate.photo ? (
                  <img
                    src={data.candidate.photo}
                    alt={data.candidate.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8C897C",
                    }}
                  >
                    <Icons.User size={48} />
                  </div>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px 24px",
                }}
              >
                <DataField
                  label="Full Name"
                  value={data.candidate.name}
                  highlight
                />
                <DataField
                  label="Father's Name"
                  value={data.candidate.fatherName}
                />
                <DataField
                  label="Date of Birth"
                  value={data.candidate.dob}
                  mono
                />
                <DataField
                  label="CNIC (Masked)"
                  value={data.candidate.cnic}
                  mono
                />
                <DataField
                  label="Candidate ID"
                  value={data.candidate.id}
                  mono
                />
                <DataField
                  label="Enrollment Date"
                  value={data.candidate.enrolledAt}
                  mono
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Assessment Information">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 24px",
              }}
            >
              <DataField label="Trade Category" value={data.candidate.trade} />
              <DataField label="Testing Hub" value={data.candidate.hub} />
              <DataField label="Trade Tester" value={data.assessment.tester} />
              <DataField
                label="Submission Date/Time"
                value={data.assessment.submittedAt}
                mono
              />
              {data.assessment.superintendent && (
                <>
                  <DataField
                    label="Center Superintendent"
                    value={data.assessment.superintendent}
                  />
                  {data.assessment.approvedAt && (
                    <DataField
                      label="Approval Date/Time"
                      value={data.assessment.approvedAt}
                      mono
                    />
                  )}
                </>
              )}
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: "1px dashed #D6D3C6",
                display: "flex",
                gap: 48,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "#5C5A50",
                    marginBottom: 8,
                  }}
                >
                  Score
                </div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <span
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: "#4C7A6E",
                      fontFamily: "IBM Plex Mono, monospace",
                      lineHeight: 1,
                    }}
                  >
                    {data.assessment.score}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      color: "#8C897C",
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    / {data.assessment.maxScore}
                  </span>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "#5C5A50",
                    marginBottom: 8,
                  }}
                >
                  Grade
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 16px",
                    background: "#EAF3DE",
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#4C7A6E",
                  }}
                >
                  {data.assessment.grade}
                </span>
              </div>
            </div>
          </SectionCard>

          {isRejected && data.rejection && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #FCCACA",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #FCCACA",
                  background: "#FAD4D4",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icons.AlertCircle size={18} color="#A6453D" />
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#A6453D",
                    margin: 0,
                  }}
                >
                  Rejection Information
                </h2>
              </div>
              <div style={{ padding: 24 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px 24px",
                    marginBottom: 20,
                  }}
                >
                  <DataField
                    label="Rejected By"
                    value={data.rejection.rejectedBy}
                  />
                  <DataField
                    label="Rejection Date/Time"
                    value={data.rejection.rejectedAt}
                    mono
                  />
                </div>
                <DataField
                  label="Rejection Reason"
                  value={data.rejection.reason}
                  multiline
                />
              </div>
            </div>
          )}

          <SectionCard title="Credential Information">
            {isMinted && data.credential ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                  }}
                >
                  <CredentialStatusPill status={data.credential.status} />
                </div>

                {isRevoked && (
                  <div
                    style={{
                      padding: 16,
                      background: "#FCEBEB",
                      borderRadius: 6,
                      marginBottom: 24,
                      border: "1px solid #FCCACA",
                    }}
                  >
                    <DataField
                      label="Revocation Date/Time"
                      value={data.credential.revokedAt}
                      mono
                    />
                    <DataField
                      label="Revocation Reason"
                      value={data.credential.revocationReason}
                      multiline
                    />
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 16,
                  }}
                >
                  <DataField
                    label="Credential ID"
                    value={data.credential.id}
                    mono
                  />
                  <DataField
                    label="Issuer DID"
                    value={data.credential.issuerDid}
                    mono
                  />
                  <DataField
                    label="Minted Date/Time"
                    value={data.credential.mintedAt}
                    mono
                  />

                  <div
                    style={{
                      padding: 16,
                      background: "#F1F0EA",
                      borderRadius: 6,
                      border: "1px solid #D6D3C6",
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#24302E",
                        marginBottom: 12,
                      }}
                    >
                      Blockchain Proof
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <DataField
                        label="Block Number"
                        value={data.credential.blockNumber}
                        mono
                      />
                      <DataField
                        label="SHA-256 Hash"
                        value={
                          <span style={{ wordBreak: "break-all" }}>
                            {data.credential.hash}
                          </span>
                        }
                        mono
                      />
                      <DataField
                        label="Polygon Transaction Hash (Amoy Testnet)"
                        value={
                          <a
                            href={`https://amoy.polygonscan.com/tx/${data.credential.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4C7A6E",
                              textDecoration: "underline",
                              wordBreak: "break-all",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {data.credential.txHash} ↗
                          </a>
                        }
                        mono
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "#5C5A50",
                  fontSize: 14,
                }}
              >
                Credential not yet issued.
              </div>
            )}
          </SectionCard>

          <SectionCard title="Assessment Media">
            {data.media && data.media.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 16,
                }}
              >
                {data.media.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #D6D3C6",
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#F1F0EA",
                    }}
                  >
                    <div style={{ height: 120, background: "#E4E2D9" }}>
                      <img
                        src={item.url}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#5C5A50",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#5C5A50", fontSize: 14 }}>
                No media attached.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#4C7A6E",
                margin: "0 0 16px",
              }}
            >
              Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {isMinted && !isRevoked && (
                <>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      height: 44,
                      padding: "0 16px",
                      background: "#4C7A6E",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Icons.Shield size={18} /> View Credential
                  </button>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      height: 44,
                      padding: "0 16px",
                      background: "#fff",
                      color: "#4C7A6E",
                      border: "1px solid #4C7A6E",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View Verification
                  </button>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      height: 44,
                      padding: "0 16px",
                      background: "#fff",
                      color: "#24302E",
                      border: "1px solid #D6D3C6",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Icons.Download size={18} /> Download PDF
                  </button>
                </>
              )}

              {isRejected && userRole === "trade-tester" && (
                <button
                  onClick={onResubmit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    width: "100%",
                    height: 44,
                    padding: "0 16px",
                    background: "#4C7A6E",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Resubmit Record
                </button>
              )}

              {!isMinted && !isRejected && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#5C5A50",
                    textAlign: "center",
                    padding: "12px 0",
                  }}
                >
                  No actions available at this status.
                </div>
              )}
            </div>
          </div>

          <SectionCard title="Record History" noPadding>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {data.history.map((event, idx) => {
                  const isLast = idx === data.history.length - 1
                  return (
                    <div
                      key={idx}
                      style={{ display: "flex", gap: 16, position: "relative" }}
                    >
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            left: 11,
                            top: 24,
                            bottom: -8,
                            width: 2,
                            background: "#D6D3C6",
                          }}
                        />
                      )}
                      <div style={{ marginTop: 2 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#E4E2D9",
                            border: "2px solid #fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#5C5A50",
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <Icons.Clock size={12} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 20 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#24302E",
                            marginBottom: 4,
                          }}
                        >
                          {event.action}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#5C5A50",
                            marginBottom: 2,
                          }}
                        >
                          {event.performedBy}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#8C897C",
                            fontFamily: "IBM Plex Mono, monospace",
                          }}
                        >
                          {event.datetime}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
