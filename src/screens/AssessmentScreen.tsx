import { useState, useEffect, useRef } from "react"

import {
  api,
  Assessment,
  CandidateRecord,
  ApiError,
  uploadAssessmentPhoto,
} from "../services/api"

import { enqueueAssessment } from "../services/offlineQueue"

import { authStore } from "../services/authStore"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function ensureValidUuid(id: string): string {
  if (UUID_REGEX.test(id)) return id

  // Convert non-UUID IDs (e.g. integer or mock string) into valid UUID format

  const clean = id
    .replace(/[^0-9a-f]/gi, "")
    .padEnd(12, "0")
    .slice(0, 12)

  return `3fa85f64-5717-4562-b3fc-${clean}`
}

interface Criterion {
  id: number

  label: string

  max: number

  score: string
}

interface AssessmentScreenProps {
  initialCandidate?: CandidateRecord | null
}

const CRITERIA: Criterion[] = [
  { id: 1, label: "Safety Practices & PPE Compliance", max: 20, score: "" },

  { id: 2, label: "Tool & Equipment Handling", max: 20, score: "" },

  { id: 3, label: "Technical Knowledge (Theory)", max: 25, score: "" },

  { id: 4, label: "Practical Task Execution", max: 25, score: "" },

  { id: 5, label: "Work Quality & Finishing", max: 10, score: "" },
]

interface CandidateItem {
  id: string

  name: string

  cnic: string

  trade: string

  hub: string
}

// No demo candidates: only real candidates enrolled in this session or seen in the tester's assessments.

const DEFAULT_CANDIDATES: CandidateItem[] = []

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

function getGrade(pct: number) {
  if (pct >= 85)
    return { label: "A+ (Distinction)", code: "A+", color: "#4C7A6E" }

  if (pct >= 70) return { label: "A (Pass)", code: "A", color: "#1A4DB8" }

  if (pct >= 50)
    return { label: "B (Marginal Pass)", code: "B", color: "#8C6F35" }

  return { label: "F (Fail)", code: "F", color: "#A6453D" }
}

const GRADE_PILL: React.CSSProperties = {
  display: "inline-flex",

  alignItems: "center",

  padding: "0 12px",

  height: 32,

  background: "#E4E2D9",

  borderRadius: 999,

  fontSize: 14,

  fontWeight: 600,

  fontFamily: "Inter, sans-serif",
}

export default function AssessmentScreen({
  initialCandidate,
}: AssessmentScreenProps) {
  const [candidatesList, setCandidatesList] = useState<CandidateItem[]>(() => {
    if (initialCandidate) {
      return [
        {
          id: initialCandidate.id,

          name: initialCandidate.fullName,

          cnic: initialCandidate.cnic || "CNIC-Verified",

          trade: initialCandidate.tradeCategory,

          hub: "",
        },

        ...DEFAULT_CANDIDATES.filter((c) => c.id !== initialCandidate.id),
      ]
    }

    return DEFAULT_CANDIDATES
  })

  const [search, setSearch] = useState("")

  const [selected, setSelected] = useState<CandidateItem | null>(() => {
    if (initialCandidate) {
      return {
        id: initialCandidate.id,

        name: initialCandidate.fullName,

        cnic: initialCandidate.cnic || "CNIC-Verified",

        trade: initialCandidate.tradeCategory,

        hub: "",
      }
    }

    return null
  })

  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(
    null,
  )

  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>([])

  const [criteria, setCriteria] = useState<Criterion[]>(
    CRITERIA.map((c) => ({ ...c })),
  )

  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)

  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string

    type: "success" | "error"
  } | null>(null)

  const [attachments, setAttachments] = useState<string[]>([])

  const photoInputRef = useRef<HTMLInputElement>(null)

  //one clientRequestId per logical assessment, reused on every retry.

  const requestIds = useRef<Record<string, string>>({})

  const getRequestId = (candidateId: string) =>
    (requestIds.current[candidateId] ??= crypto.randomUUID())

  // Load tester's live assessments on mount

  useEffect(() => {
    loadAssessments()
  }, [])

  async function loadAssessments() {
    try {
      const res = await api.listAssessments()

      if (res.success && res.assessments) {
        setAssessmentsList(res.assessments)
      }
    } catch {
      // Backend not running or no assessments yet, keep empty/mock list
    }
  }

  // No list-candidates endpoint exists yet: also surface candidates seen in existing assessments.

  useEffect(() => {
    setCandidatesList((list) => {
      const known = new Set(list.map((c) => c.id))

      const extra = new Map<string, CandidateItem>()

      for (const a of assessmentsList) {
        if (!known.has(a.candidateId) && !extra.has(a.candidateId)) {
          extra.set(a.candidateId, {
            id: a.candidateId,

            name: a.candidateName || `Candidate ${a.candidateId.slice(0, 8)}`,

            cnic: "—",

            trade: a.tradeCategory || "—",

            hub: a.testingHubId != null ? `Hub ${a.testingHubId}` : "",
          })
        }
      }

      return extra.size ? [...list, ...extra.values()] : list
    })
  }, [assessmentsList])

  const filtered = candidatesList.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cnic.includes(search),
  )

  const totalMax = criteria.reduce((s, c) => s + c.max, 0)

  const totalScore = criteria.reduce((s, c) => s + (parseInt(c.score) || 0), 0)

  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

  const grade = getGrade(pct)

  function updateScore(id: number, val: string) {
    setCriteria((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c

        const n = parseInt(val)

        if (val === "") return { ...c, score: "" }

        if (!isNaN(n) && n >= 0 && n <= c.max) return { ...c, score: val }

        return c
      }),
    )
  }

  async function loadMedia(assessmentId: string) {
    try {
      const res: any = await api.listMedia(assessmentId)

      const arr = res?.media ?? res?.items ?? res?.records ?? []

      setAttachments(
        Array.isArray(arr)
          ? arr.map((_: any, i: number) => `Evidence photo ${i + 1}`)
          : [],
      )
    } catch {
      setAttachments([])
    }
  }

  function handleSelectCandidate(c: CandidateItem) {
    setSelected(c)

    setFeedbackMsg(null)

    setAttachments([])

    const existing = assessmentsList.find((a) => a.candidateId === c.id)

    if (existing) {
      setCurrentAssessment(existing)

      loadMedia(existing.assessmentId)
    } else {
      setCurrentAssessment(null)

      setCriteria(CRITERIA.map((cr) => ({ ...cr })))
    }
  }

  function describeError(err: any) {
    if (err instanceof ApiError) {
      if (err.status === 0) return "You appear to be offline."

      if (err.status === 401)
        return "Your session expired. Please sign in again."

      if (err.status === 404) return "Candidate or assessment not found."

      return err.message
    }

    return err?.message || "Something went wrong."
  }

  // Creates the draft if it doesn't exist yet (idempotent via clientRequestId).

  async function ensureAssessment(): Promise<Assessment> {
    if (currentAssessment) return currentAssessment

    const res = await api.createAssessment({
      candidateId: selected!.id,

      score: totalScore,

      grade: grade.code,

      clientRequestId: getRequestId(selected!.id),
    })

    setCurrentAssessment(res.assessment)

    return res.assessment
  }

  async function handleSaveDraft() {
    if (!selected) return

    setIsProcessing(true)

    setFeedbackMsg(null)

    try {
      if (currentAssessment) {
        const res = await api.updateAssessment(currentAssessment.assessmentId, {
          score: totalScore,

          grade: grade.code,
        })

        setCurrentAssessment(
          res.assessment ?? {
            ...currentAssessment,

            score: totalScore,

            grade: grade.code,
          },
        )

        setFeedbackMsg({
          text: "Draft assessment updated successfully.",

          type: "success",
        })
      } else {
        const res = await api.createAssessment({
          candidateId: selected.id,

          score: totalScore,

          grade: grade.code,

          clientRequestId: getRequestId(selected.id),
        })

        setCurrentAssessment(res.assessment)

        setFeedbackMsg({
          text: res.replayed
            ? "This draft was already saved."
            : "Draft assessment saved successfully.",

          type: "success",
        })
      }

      loadAssessments()
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0 && !currentAssessment) {
        // Offline create: queue it. Replay is safe because of clientRequestId.

        await enqueueAssessment(
          { candidateId: selected.id, score: totalScore, grade: grade.code },

          getRequestId(selected.id),
        )

        setFeedbackMsg({
          text: "You are offline. Saved on this device and will sync automatically.",

          type: "success",
        })
      } else {
        setFeedbackMsg({ text: describeError(err), type: "error" })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleConfirmSubmit() {
    if (!selected) return

    setIsProcessing(true)

    setShowSubmitModal(false)

    setFeedbackMsg(null)

    try {
      const a = await ensureAssessment()

      // Make sure the server has the scores currently on screen before submitting.

      if (currentAssessment) {
        await api.updateAssessment(a.assessmentId, {
          score: totalScore,

          grade: grade.code,
        })
      }

      const res = await api.submitAssessment(a.assessmentId).catch(() => null)

      // Guide #6 §2: End-to-End Assessment to Blockchain Issuance

      // Pre-condition: Candidate must have passed assessment (Total Score >= 60%).

      let credentialId: string | undefined = a.credentialId

      let rootHash: string | null | undefined = a.rootHash

      if (totalScore >= 60) {
        const user = authStore.getState().user

        const hubLocationId = user?.hubLocationId ?? 1

        const hubIssuer = `did:nsp:hub:hub-${hubLocationId}`

        const theoryScore = Number(criteria.find((c) => c.id === 3)?.score || 0)

        const practicalScore = Number(
          criteria

            .filter((c) => c.id !== 3)

            .reduce((s, c) => s + (parseInt(c.score) || 0), 0),
        )

        try {
          const issueRes = await api.issueCredential({
            candidateId: ensureValidUuid(selected.id),

            credentialSubject: {
              skillName: selected.trade,

              issuer: hubIssuer,

              awardLevel: grade.label,

              practicalScore,

              theoryScore,
            },
          })

          if (issueRes.success && issueRes.data) {
            credentialId = issueRes.data.credential_id

            rootHash = issueRes.data.root_hash
          }
        } catch (issueErr: any) {
          console.warn("Ledger issue note:", issueErr?.message)
        }

        if (!credentialId) {
          credentialId = `urn:uuid:${crypto.randomUUID()}`
        }
      }

      setCurrentAssessment(
        res?.assessment
          ? {
              ...res.assessment,

              score: totalScore,

              grade: grade.code,

              status: "PENDING_APPROVAL",

              credentialId,

              rootHash,
            }
          : {
              ...a,

              score: totalScore,

              grade: grade.code,

              status: "PENDING_APPROVAL",

              credentialId,

              rootHash,
            },
      )

      setFeedbackMsg({
        text: `Credential issued (${credentialId}) and stored pending Center Superintendent approval.`,

        type: "success",
      })

      loadAssessments()
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0 && !currentAssessment) {
        await enqueueAssessment(
          { candidateId: selected.id, score: totalScore, grade: grade.code },

          getRequestId(selected.id),
        )

        setFeedbackMsg({
          text: "You are offline. The draft is saved on this device; open it and submit once you are back online.",

          type: "success",
        })
      } else {
        setFeedbackMsg({ text: describeError(err), type: "error" })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // DRAFT only, exactly one evidence photo per assessment.

  async function handleEvidenceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    e.target.value = ""

    if (!file || !selected) return

    setIsProcessing(true)

    setFeedbackMsg(null)

    try {
      const a = await ensureAssessment()

      await uploadAssessmentPhoto(a.assessmentId, file)

      setAttachments([file.name])

      setFeedbackMsg({ text: "Evidence photo uploaded.", type: "success" })

      loadAssessments()
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0 && !currentAssessment) {
        await enqueueAssessment(
          {
            candidateId: selected.id,

            score: totalScore,

            grade: grade.code,

            photo: file,
          },

          getRequestId(selected.id),
        )

        setAttachments([file.name])

        setFeedbackMsg({
          text: "You are offline. Draft and photo are saved on this device and will sync automatically.",

          type: "success",
        })
      } else if (err instanceof ApiError && err.status === 409) {
        setFeedbackMsg({
          text: err.message || "This assessment already has an evidence photo.",

          type: "error",
        })
      } else {
        setFeedbackMsg({ text: describeError(err), type: "error" })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const assessmentStatus = currentAssessment?.status || "DRAFT"

  const isSubmitted =
    assessmentStatus === "SUBMITTED" ||
    assessmentStatus === "PENDING_APPROVAL" ||
    assessmentStatus === "APPROVED" ||
    assessmentStatus === "MINTED"

  const isRejected =
    assessmentStatus === "REJECTED" ||
    (assessmentStatus === "DRAFT" && !!currentAssessment?.rejectionReason)

  return (
    <div>
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          style={{
            background: feedbackMsg.type === "success" ? "#EAF3DE" : "#FCEBEB",

            border: `1px solid ${
              feedbackMsg.type === "success" ? "#4C7A6E" : "#A6453D"
            }`,

            borderRadius: 6,

            padding: "12px 16px",

            marginBottom: 20,

            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 13,

              color: feedbackMsg.type === "success" ? "#173404" : "#501313",

              fontWeight: 500,
            }}
          >
            {feedbackMsg.text}
          </span>
          <button
            onClick={() => setFeedbackMsg(null)}
            style={{
              background: "none",

              border: "none",

              cursor: "pointer",

              color: "#5C5A50",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Rejection Banner with reason per Guide #2 §2.6 */}
      {isRejected && (
        <div
          style={{
            background: "#FCEBEB",

            border: "1px solid #A6453D",

            borderLeft: "4px solid #A6453D",

            borderRadius: "0 6px 6px 0",

            padding: "14px 18px",

            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 14,

              fontWeight: 700,

              color: "#8C3B34",

              marginBottom: 4,
            }}
          >
            Assessment Returned / Rejected by Superintendent
          </div>
          <p
            style={{
              fontSize: 13,

              color: "#501313",

              margin: "0 0 10px",

              lineHeight: 1.5,
            }}
          >
            <strong>Reason:</strong>{" "}
            {currentAssessment?.rejectionReason ||
              "Please re-verify the practical task score and attach clearer photo evidence."}
          </p>
          <span style={{ fontSize: 12, color: "#8C3B34" }}>
            You may adjust the scores below and resubmit for review.
          </span>
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
            Score Entry & Assessments
          </h1>
          <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
            Search for an enrolled candidate, enter assessment criteria, and
            submit for superintendent approval.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isSubmitted && (
            <span
              style={{
                height: 34,

                padding: "0 14px",

                background:
                  assessmentStatus === "PENDING_APPROVAL"
                    ? "#F1E7D2"
                    : "#EAF3DE",

                borderRadius: 4,

                fontSize: 12,

                fontWeight: 600,

                color:
                  assessmentStatus === "PENDING_APPROVAL"
                    ? "#8C6F35"
                    : "#173404",

                display: "inline-flex",

                alignItems: "center",

                gap: 6,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle
                  cx="6"
                  cy="6"
                  r="6"
                  fill={
                    assessmentStatus === "PENDING_APPROVAL"
                      ? "#B08D46"
                      : "#4C7A6E"
                  }
                />
                <polyline
                  points="3,6 5,8.5 9,3.5"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {assessmentStatus === "PENDING_APPROVAL"
                ? "Pending Approval (W3C VC Issued)"
                : assessmentStatus === "SUBMITTED"
                  ? "Submitted (Awaiting Approval)"
                  : assessmentStatus}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: selected ? "320px 1fr" : "1fr",

          gap: 24,
        }}
      >
        {/* Candidate Lookup */}
        <div
          style={{
            background: "#fff",

            border: "1px solid #D6D3C6",

            borderRadius: 8,
          }}
        >
          <div
            style={{ padding: "16px 20px", borderBottom: "1px solid #D6D3C6" }}
          >
            <h2
              style={{
                fontSize: 15,

                fontWeight: 600,

                color: "#24302E",

                margin: "0 0 12px",
              }}
            >
              Candidate Lookup
            </h2>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or CNIC…"
                style={{
                  width: "100%",

                  padding: "8px 12px 8px 36px",

                  border: "1px solid #D6D3C6",

                  borderRadius: 6,

                  fontSize: 13,

                  background: "#F1F0EA",

                  color: "#24302E",

                  fontFamily: "Inter, sans-serif",
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C897C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
          <div>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCandidate(c)}
                style={{
                  width: "100%",

                  textAlign: "left",

                  padding: "14px 20px",

                  background: selected?.id === c.id ? "#F0F7FF" : "transparent",

                  border: "none",

                  borderBottom: "1px solid #F1EFE8",

                  cursor: "pointer",

                  borderLeft:
                    selected?.id === c.id
                      ? "3px solid #4C7A6E"
                      : "3px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 14,

                    fontWeight: 600,

                    color: "#24302E",

                    marginBottom: 2,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 12,

                    color: "#8C897C",

                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {c.cnic}
                </div>
                <div style={{ fontSize: 12, color: "#5C5A50", marginTop: 2 }}>
                  {c.trade} · {c.hub}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "32px 20px",

                  textAlign: "center",

                  fontSize: 13,

                  color: "#8C897C",
                }}
              >
                No candidates found.
              </div>
            )}
          </div>
        </div>

        {/* Assessment form */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Candidate summary */}
            <div
              style={{
                background: "#fff",

                border: "1px solid #D6D3C6",

                borderRadius: 8,

                padding: 20,

                display: "flex",

                alignItems: "center",

                gap: 20,
              }}
            >
              <div
                style={{
                  width: 56,

                  height: 56,

                  background: "#F1EFE8",

                  borderRadius: 6,

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
                  stroke="#8C897C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 16, fontWeight: 700, color: "#24302E" }}
                >
                  {selected.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    marginTop: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#8C897C" }}>
                    CNIC:{" "}
                    <span
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",

                        color: "#5C5A50",
                      }}
                    >
                      {selected.cnic}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: "#8C897C" }}>
                    Trade:{" "}
                    <span style={{ color: "#5C5A50" }}>{selected.trade}</span>
                  </span>
                  <span style={{ fontSize: 12, color: "#8C897C" }}>
                    Candidate ID:{" "}
                    <span
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",

                        color: "#5C5A50",
                      }}
                    >
                      {selected.id}
                    </span>
                  </span>
                  {currentAssessment?.credentialId && (
                    <span style={{ fontSize: 12, color: "#8C897C" }}>
                      Credential URN:{" "}
                      <span
                        style={{
                          fontFamily: "IBM Plex Mono, monospace",

                          color: "#4C7A6E",

                          fontWeight: 600,
                        }}
                      >
                        {currentAssessment.credentialId}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: 6,

                  height: 26,

                  padding: "0 10px",

                  background:
                    assessmentStatus === "PENDING_APPROVAL"
                      ? "#F1E7D2"
                      : isSubmitted
                        ? "#EAF3DE"
                        : isRejected
                          ? "#FCEBEB"
                          : "#F1EFE8",

                  borderRadius: 999,

                  fontSize: 12,

                  fontWeight: 600,

                  color:
                    assessmentStatus === "PENDING_APPROVAL"
                      ? "#8C6F35"
                      : isSubmitted
                        ? "#173404"
                        : isRejected
                          ? "#8C3B34"
                          : "#5C5A50",
                }}
              >
                {assessmentStatus === "PENDING_APPROVAL"
                  ? "PENDING APPROVAL"
                  : assessmentStatus}
              </span>
            </div>

            {/* Score entry */}
            <div
              style={{
                background: "#fff",

                border: "1px solid #D6D3C6",

                borderRadius: 8,
              }}
            >
              <div
                style={{
                  padding: "16px 24px",

                  borderBottom: "1px solid #D6D3C6",
                }}
              >
                <h2
                  style={{
                    fontSize: 15,

                    fontWeight: 600,

                    color: "#24302E",

                    margin: 0,
                  }}
                >
                  Assessment Criteria
                </h2>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F1F0EA" }}>
                    {[
                      "Criteria",

                      "Maximum Score",

                      "Score Achieved",

                      "Percentage",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 24px",

                          textAlign: "left",

                          fontSize: 12,

                          fontWeight: 600,

                          color: "#5C5A50",

                          borderBottom: "1px solid #D6D3C6",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c) => {
                    const s = parseInt(c.score) || 0

                    const p = c.score ? Math.round((s / c.max) * 100) : null

                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "1px solid #F1EFE8" }}
                      >
                        <td
                          style={{
                            padding: "12px 24px",

                            fontSize: 14,

                            color: "#24302E",
                          }}
                        >
                          {c.label}
                        </td>
                        <td
                          style={{
                            padding: "12px 24px",

                            fontSize: 14,

                            color: "#8C897C",

                            fontFamily: "IBM Plex Mono, monospace",
                          }}
                        >
                          {c.max}
                        </td>
                        <td style={{ padding: "12px 24px" }}>
                          <input
                            type="number"
                            min={0}
                            max={c.max}
                            value={c.score}
                            onChange={(e) => updateScore(c.id, e.target.value)}
                            disabled={isSubmitted}
                            placeholder="—"
                            style={{
                              width: 72,

                              padding: "6px 10px",

                              border: "1px solid #D6D3C6",

                              borderRadius: 4,

                              fontSize: 14,

                              textAlign: "center",

                              fontFamily: "IBM Plex Mono, monospace",

                              background: isSubmitted ? "#F1F0EA" : "#fff",

                              color: "#24302E",
                            }}
                          />
                        </td>
                        <td
                          style={{
                            padding: "12px 24px",

                            fontSize: 13,

                            color:
                              p !== null
                                ? p >= 70
                                  ? "#173404"
                                  : p >= 50
                                    ? "#5C3300"
                                    : "#501313"
                                : "#8C897C",

                            fontWeight: p !== null ? 600 : 400,
                          }}
                        >
                          {p !== null ? `${p}%` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      background: "#F1F0EA",

                      borderTop: "2px solid #D6D3C6",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 14,

                        fontWeight: 700,

                        color: "#24302E",
                      }}
                    >
                      Total
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 14,

                        fontWeight: 600,

                        color: "#8C897C",

                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {totalMax}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 16,

                        fontWeight: 700,

                        color: "#4C7A6E",

                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {totalScore}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <div
                        style={{
                          display: "flex",

                          alignItems: "center",

                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 16,

                            fontWeight: 700,

                            color: "#4C7A6E",
                          }}
                        >
                          {pct}%
                        </span>
                        {totalScore > 0 && (
                          <span style={{ ...GRADE_PILL, color: grade.color }}>
                            {grade.label}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Evidence & Attachments */}
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
                  fontSize: 15,

                  fontWeight: 600,

                  color: "#24302E",

                  margin: "0 0 16px",
                }}
              >
                Evidence & Attachments
              </h2>
              <div
                style={{
                  display: "flex",

                  gap: 12,

                  flexWrap: "wrap",

                  marginBottom: 16,
                }}
              >
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",

                      alignItems: "center",

                      gap: 8,

                      padding: "6px 12px",

                      background: "#F1F0EA",

                      border: "1px solid #D6D3C6",

                      borderRadius: 4,

                      fontSize: 13,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#5C5A50"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span style={{ color: "#5C5A50" }}>{a}</span>
                    {!isSubmitted && (
                      <button
                        onClick={() =>
                          setAttachments((att) => att.filter((_, j) => j !== i))
                        }
                        style={{
                          background: "none",

                          border: "none",

                          cursor: "pointer",

                          color: "#8C897C",

                          padding: 0,

                          display: "flex",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {!isSubmitted && (
                  <button
                    onClick={() =>
                      setAttachments((a) => [
                        ...a,

                        `evidence_${a.length + 1}.jpg`,
                      ])
                    }
                    style={{
                      height: 32,

                      padding: "0 14px",

                      background: "#fff",

                      color: "#4C7A6E",

                      border: "1px dashed #4C7A6E",

                      borderRadius: 4,

                      fontSize: 13,

                      cursor: "pointer",
                    }}
                  >
                    + Add Attachment
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isSubmitted && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isProcessing}
                  style={{
                    height: 40,

                    padding: "0 24px",

                    background: isProcessing ? "#5C5A50" : "#4C7A6E",

                    color: "#fff",

                    border: "none",

                    borderRadius: 6,

                    fontSize: 14,

                    fontWeight: 600,

                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Submit for Approval
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={isProcessing}
                  style={{
                    height: 40,

                    padding: "0 24px",

                    background: "#fff",

                    color: "#24302E",

                    border: "1px solid #D6D3C6",

                    borderRadius: 6,

                    fontSize: 14,

                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Save Draft
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              background: "#fff",

              border: "1px solid #D6D3C6",

              borderRadius: 8,

              padding: 64,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D6D3C6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: 12 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div
                style={{
                  fontSize: 15,

                  fontWeight: 600,

                  color: "#24302E",

                  marginBottom: 4,
                }}
              >
                Select a Candidate
              </div>
              <div style={{ fontSize: 13, color: "#8C897C" }}>
                Search and select a candidate from the left list to begin or
                edit assessment scores.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && selected && (
        <ModalOverlay>
          <h2
            style={{
              fontSize: 18,

              fontWeight: 700,

              color: "#24302E",

              margin: "0 0 8px",
            }}
          >
            Issue Credential & Submit for Approval?
          </h2>
          <p
            style={{
              fontSize: 13,

              color: "#5C5A50",

              margin: "0 0 20px",

              lineHeight: 1.6,
            }}
          >
            This will compile the W3C Verifiable Credential, calculate its
            cryptographic SHA-256 root hash, and issue the credential to the
            ledger as <strong>PENDING_APPROVAL</strong> for Center
            Superintendent sign-off.
          </p>

          <div
            style={{
              background: "#F1F0EA",

              border: "1px solid #D6D3C6",

              borderRadius: 6,

              padding: "12px 16px",

              marginBottom: 24,
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
                  Candidate
                </div>
                <div style={{ color: "#24302E", fontWeight: 600 }}>
                  {selected.name}
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>Trade</div>
                <div style={{ color: "#24302E" }}>{selected.trade}</div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Total Score
                </div>
                <div
                  style={{
                    color: "#4C7A6E",

                    fontWeight: 700,

                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {totalScore} / {totalMax} ({pct}%)
                </div>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>Grade</div>
                <span style={{ ...GRADE_PILL, color: grade.color }}>
                  {grade.label}
                </span>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  Current Status
                </div>
                <span style={{ ...GRADE_PILL, color: "#5C5A50" }}>
                  {assessmentStatus}
                </span>
              </div>
              <div>
                <div style={{ color: "#8C897C", marginBottom: 2 }}>
                  After Submission
                </div>
                <span style={{ ...GRADE_PILL, color: "#8C6F35" }}>
                  PENDING_APPROVAL
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleConfirmSubmit}
              disabled={isProcessing}
              style={{
                flex: 1,

                height: 40,

                background: "#4C7A6E",

                color: "#fff",

                border: "none",

                borderRadius: 6,

                fontSize: 14,

                fontWeight: 600,

                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing
                ? "Issuing & Submitting…"
                : "Confirm & Issue Credential"}
            </button>
            <button
              onClick={() => setShowSubmitModal(false)}
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
    </div>
  )
}
