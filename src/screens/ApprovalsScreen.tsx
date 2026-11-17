import { useState, useEffect, useRef } from "react"

import Select from "@/components/Select"
import StepUpModal from "@/components/StepUpModal"

import { api, ApiError, Assessment } from "../services/api"

import { authStore } from "../services/authStore"
import { assessmentStore } from "../services/assessmentStore"

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

  Hourglass: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
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
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  ),

  Radio: ({ size = 24, strokeWidth = 2, color = "currentColor" }) => (
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
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
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
}

type ApprovalStatus = "submitted" | "approved" | "rejected"

type MintingStatus = "queued" | "broadcasted" | "confirmed" | "failed"

type ModalType = "none" | "approve" | "reject" | "detail"

interface Submission {
  id: string

  candidate: string

  cnic: string

  trade: string

  hub: string

  submittedBy: string

  submittedAt: string

  score: number

  maxScore: number

  grade: string

  status: ApprovalStatus

  mintingStatus?: MintingStatus

  credentialId?: string

  txHash?: string

  blockNumber?: number

  failReason?: string

  retryStatus?: string
  candidateId?: string

  rejectionReason?: string
}

// Guide 5: Stable canonical URN generator for records without server-assigned credentialId yet
function getStableCredentialId(
  assessmentId?: string,
  candidateId?: string,
): string {
  const seed = ((assessmentId || "") + (candidateId || ""))
    .replace(/[^0-9a-f]/gi, "")
    .padEnd(12, "0")
    .slice(0, 12)
  return `urn:uuid:7c9e6679-7425-40de-944b-${seed}`
}

// A record belongs on the Approvals page if it is awaiting review, already actioned,
// or was rejected (the server returns rejected records to DRAFT with a reason attached).
function isApprovalRecord(a: Assessment): boolean {
  if (isKnownApprovalStatus(a.status)) return true
  return (a.status || "").toUpperCase() === "DRAFT" && !!a.rejectionReason
}

function isKnownApprovalStatus(status?: string): boolean {
  if (!status) return false
  const s = status.toUpperCase()
  return (
    s === "SUBMITTED" ||
    s === "PENDING_APPROVAL" ||
    s === "IN_REVIEW" ||
    s === "APPROVED" ||
    s === "MINTED" ||
    s === "REJECTED"
  )
}

// Guide 5: Includes canonical URN credentialId, ledger mint status, and transaction hash.
function toSubmission(a: Assessment): Submission {
  const credId =
    a.credentialId || getStableCredentialId(a.assessmentId, a.candidateId)
  let mStatus: MintingStatus | undefined = undefined
  if (a.mintingStatus) {
    const raw = a.mintingStatus.toLowerCase()
    if (raw === "minted" || raw === "confirmed") mStatus = "confirmed"
    else if (raw === "queued") mStatus = "queued"
    else if (raw === "broadcasted") mStatus = "broadcasted"
    else if (raw === "failed") mStatus = "failed"
  }

  const rawStatus = (a.status || "").toUpperCase()
  let approvalStatus: ApprovalStatus = "submitted"
  if (rawStatus === "APPROVED" || rawStatus === "MINTED") {
    approvalStatus = "approved"
  } else if (rawStatus === "REJECTED" || (rawStatus === "DRAFT" && !!a.rejectionReason)) {
    approvalStatus = "rejected"
  } else {
    approvalStatus = "submitted"
  }

  return {
    id: a.assessmentId,

    candidate:
      a.candidateName ||
      (a.candidateId ? `Candidate ${a.candidateId.slice(0, 8)}` : "Candidate"),

    cnic: (a as any).cnic || "—",

    trade: a.tradeCategory || "—",

    hub: a.testingHubId != null ? `Hub ${a.testingHubId}` : "—",

    submittedBy: a.testerUserId ? a.testerUserId.slice(0, 8) : "—",

    submittedAt: a.submittedAt
      ? a.submittedAt.slice(0, 16).replace("T", " ")
      : a.createdAt
        ? a.createdAt.slice(0, 16).replace("T", " ")
        : "—",

    score: Number(a.score) || 0,

    maxScore: 100, // criteria in AssessmentScreen sum to 100

    grade: a.grade || "—",

    status: approvalStatus,

    credentialId: credId,

    mintingStatus: mStatus,

    txHash: a.txHash || undefined,
    candidateId: a.candidateId,
    rejectionReason: a.rejectionReason || undefined,
  }
}

function StatusPill({ status }: { status: ApprovalStatus }) {
  const map = {
    submitted: {
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

    approved: {
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

    rejected: {
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

  const s = (map as Record<string, any>)[status] || (map as any).pending || Object.values(map)[0]

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

function MintingPill({ status }: { status: MintingStatus }) {
  const map = {
    queued: {
      bg: "#E8F0FE",
      text: "#1A4DB8",
      label: "Queued for Minting",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="7"
            stroke="#1A4DB8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>
      ),
    },

    broadcasted: {
      bg: "#F3E8FD",
      text: "#6B21A8",
      label: "Broadcasting (Polygon)",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#6B21A8" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#6B21A8" />
        </svg>
      ),
    },

    confirmed: {
      bg: "#DCE7E3",
      text: "#2F5C4E",
      label: "Anchored on Blockchain",
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

    failed: {
      bg: "#FCEBEB",
      text: "#A6453D",
      label: "Minting Failed",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#A6453D" />
          <path
            d="M10 6 L10 11 M10 14 L10 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  }

  const s = (map as Record<string, any>)[status] || (map as any).pending || Object.values(map)[0]

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

function GradePill({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    Distinction: "#4C7A6E",

    Pass: "#4C7A6E",

    "Marginal Pass": "#B06500",

    Fail: "#A6453D",
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        background: "#E4E2D9",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: colors[grade] ?? "#5C5A50",
      }}
    >
      {grade}
    </span>
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
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #D6D3C6",
          borderRadius: 8,
          padding: 32,
          maxWidth: 540,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function ApprovalsScreen() {
  // Hub scoping is enforced by the server; the UI only labels it.

  const hubId = authStore.getState().user?.hubLocationId

  const SUPERINTENDENT_HUB = hubId != null ? `Hub ${hubId}` : "your hub"

  const [submissions, setSubmissions] = useState<Submission[]>([])

  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState("")

  const [busy, setBusy] = useState(false)

  const [actionError, setActionError] = useState("")

  const [stepUpOpen, setStepUpOpen] = useState(false)
  const [stepUpLoading, setStepUpLoading] = useState(false)
  const [stepUpError, setStepUpError] = useState("")

  const [toast, setToast] = useState("")

  const [filter, setFilter] = useState<"all" | ApprovalStatus>("submitted")

  const [search, setSearch] = useState("")

  const [tradeFilter, setTradeFilter] = useState("all")

  const [testerFilter, setTesterFilter] = useState("all")

  const [dateFilter, setDateFilter] = useState("all")

  const [selected, setSelected] = useState<Submission | null>(null)

  const [modal, setModal] = useState<ModalType>("none")

  const [rejectionReason, setRejectionReason] = useState("")

  const pollTimers = useRef<Record<string, { timer: any; elapsed: number }>>({})

  useEffect(() => {
    return () => {
      Object.values(pollTimers.current).forEach(({ timer }) =>
        clearTimeout(timer),
      )
    }
  }, [])

  function startPollingCredential(credentialId: string) {
    if (!credentialId) return

    if (pollTimers.current[credentialId]) {
      clearTimeout(pollTimers.current[credentialId].timer)
    }

    let elapsed = 0

    const check = async () => {
      try {
        const res = await api.getLedgerStatus(credentialId)
        if (res.success && res.data) {
          const mStatus = res.data.minting_status
          if (mStatus === "MINTED") {
            delete pollTimers.current[credentialId]
            setToast("Credential anchored on Polygon blockchain!")
            setSubmissions((prev) =>
              prev.map((s) =>
                s.credentialId === credentialId
                  ? {
                      ...s,
                      mintingStatus: "confirmed",
                      txHash: res.data.tx_hash || s.txHash,
                    }
                  : s,
              ),
            )
            setSelected((sel) => {
              if (sel && sel.credentialId === credentialId) {
                return {
                  ...sel,
                  mintingStatus: "confirmed",
                  txHash: res.data.tx_hash || sel.txHash,
                }
              }
              return sel
            })
            return
          } else if (mStatus === "FAILED") {
            delete pollTimers.current[credentialId]
            setSubmissions((prev) =>
              prev.map((s) =>
                s.credentialId === credentialId
                  ? {
                      ...s,
                      mintingStatus: "failed",
                      failReason:
                        "Blockchain minting failed or transaction reverted.",
                      retryStatus:
                        "Retry available (calls POST /api/ledger/approve)",
                    }
                  : s,
              ),
            )
            setSelected((sel) => {
              if (sel && sel.credentialId === credentialId) {
                return {
                  ...sel,
                  mintingStatus: "failed",
                  failReason:
                    "Blockchain minting failed or transaction reverted.",
                  retryStatus:
                    "Retry available (calls POST /api/ledger/approve)",
                }
              }
              return sel
            })
            return
          } else if (mStatus === "BROADCASTED") {
            setSubmissions((prev) =>
              prev.map((s) =>
                s.credentialId === credentialId
                  ? { ...s, mintingStatus: "broadcasted" }
                  : s,
              ),
            )
            setSelected((sel) => {
              if (sel && sel.credentialId === credentialId) {
                return { ...sel, mintingStatus: "broadcasted" }
              }
              return sel
            })
          }
        }
      } catch (err) {
        console.warn("Ledger polling note:", err)
      }

      elapsed += elapsed < 90 ? 5 : 15
      const nextInterval = elapsed < 90 ? 5000 : 15000
      pollTimers.current[credentialId] = {
        timer: setTimeout(check, nextInterval),
        elapsed,
      }
    }

    pollTimers.current[credentialId] = {
      timer: setTimeout(check, 5000),
      elapsed: 0,
    }
  }

  async function handleRetryMint(sub: Submission) {
    if (!sub.credentialId) return
    setBusy(true)
    try {
      await api.approveCredential(sub.credentialId)
      setToast("Credential re-queued for minting. Polling relayer...")
      setSubmissions((ss) =>
        ss.map((s) =>
          s.id === sub.id
            ? { ...s, mintingStatus: "queued", failReason: undefined }
            : s,
        ),
      )
      startPollingCredential(sub.credentialId)
    } catch (err: any) {
      setActionError(explain(err))
    } finally {
      setBusy(false)
    }
  }

  // Superintendent only sees their own hub

  const hubSubmissions = submissions

  // Unique filter options

  const trades = Array.from(new Set(hubSubmissions.map((s) => s.trade)))

  const testers = Array.from(new Set(hubSubmissions.map((s) => s.submittedBy)))

  const displayed = hubSubmissions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false

    if (tradeFilter !== "all" && s.trade !== tradeFilter) return false

    if (testerFilter !== "all" && s.submittedBy !== testerFilter) return false

    if (dateFilter !== "all") {
      const today = new Date().toISOString().slice(0, 10)

      if (dateFilter === "today" && !s.submittedAt.startsWith(today))
        return false
    }

    if (search) {
      const q = search.toLowerCase()

      if (
        !s.candidate.toLowerCase().includes(q) &&
        !s.cnic.includes(q) &&
        !s.id.toLowerCase().includes(q)
      )
        return false
    }

    return true
  })

  const hasLoadedOnce = useRef(false)

  async function loadQueue() {
    if (!hasLoadedOnce.current) setLoading(true)

    setLoadError("")

    try {
      let queueAssessments: Assessment[] = []

      // 1. Fetch from server queue endpoint
      try {
        const res = await api.getQueue()
        if (res && Array.isArray(res.assessments)) {
          queueAssessments = res.assessments
        }
      } catch (queueErr) {
        console.warn("Queue fetch note:", queueErr)
      }

      // 2. Also check listAssessments for submitted/pending assessments
      try {
        const listRes = await api.listAssessments()
        if (listRes && Array.isArray(listRes.assessments)) {
          for (const a of listRes.assessments) {
            if (isApprovalRecord(a)) {
              if (
                !queueAssessments.some(
                  (q) => q.assessmentId === a.assessmentId,
                )
              ) {
                queueAssessments.push(a)
              }
            }
          }
        }
      } catch (listErr) {
        console.warn("List assessments fetch note:", listErr)
      }

      // 3. Include any locally saved submitted assessments from assessmentStore
      const localSubmitted = assessmentStore.getSubmittedAssessments()
      for (const item of localSubmitted) {
        const existingIdx = queueAssessments.findIndex(
          (q) =>
            (item.assessmentId && q.assessmentId === item.assessmentId) ||
            (item.candidateId && q.candidateId === item.candidateId),
        )
        if (existingIdx >= 0) {
          const serverRec = queueAssessments[existingIdx]
          const serverStatus = (serverRec.status || "").toUpperCase()
          if (
            serverStatus !== "APPROVED" &&
            serverStatus !== "MINTED" &&
            serverStatus !== "REJECTED" &&
            !serverRec.rejectionReason
          ) {
            queueAssessments[existingIdx] = {
              ...serverRec,
              candidateName: serverRec.candidateName || item.candidateName,
              tradeCategory: serverRec.tradeCategory || item.tradeCategory,
              testingHubId: serverRec.testingHubId ?? item.testingHubId,
              score: item.score ?? serverRec.score,
              grade: item.grade || serverRec.grade,
              status: (item.status as any) || "PENDING_APPROVAL",
              submittedAt: item.submittedAt ?? serverRec.submittedAt,
            }
          }
        } else if (item.assessmentId) {
          queueAssessments.push({
            assessmentId: item.assessmentId,
            candidateId: item.candidateId,
            candidateName: item.candidateName,
            tradeCategory: item.tradeCategory,
            testingHubId: item.testingHubId,
            score: item.score,
            grade: item.grade,
            status: (item.status as any) || "PENDING_APPROVAL",
            credentialId: item.credentialId,
            rootHash: item.rootHash,
            submittedAt: item.submittedAt,
            createdAt: item.updatedAt || new Date().toISOString(),
          })
        }
      }

      // 3b. Approved/rejected records saved on this device (in case the server does not list them)
      for (const item of assessmentStore.getAllSavedAssessments()) {
        const st = (item.status || "").toUpperCase()
        if (st !== "APPROVED" && st !== "MINTED" && st !== "REJECTED") continue
        if (!item.assessmentId) continue
        if (queueAssessments.some((q) => q.assessmentId === item.assessmentId)) continue
        queueAssessments.push({
          assessmentId: item.assessmentId,
          candidateId: item.candidateId,
          candidateName: item.candidateName,
          tradeCategory: item.tradeCategory,
          testingHubId: item.testingHubId,
          score: item.score,
          grade: item.grade,
          status: st as any,
          credentialId: item.credentialId,
          rootHash: item.rootHash,
          submittedAt: item.submittedAt,
          createdAt: item.updatedAt || new Date().toISOString(),
        })
      }

      // 4. Enrich with candidate details (CNIC, trade, full name)
      try {
        const candidates = await api.listCandidates()
        if (Array.isArray(candidates) && candidates.length > 0) {
          const cMap = new Map(candidates.map((c) => [c.id, c]))
          queueAssessments = queueAssessments.map((a) => {
            const cand = cMap.get(a.candidateId)
            return {
              ...a,
              candidateName: a.candidateName || cand?.fullName,
              tradeCategory:
                a.tradeCategory || cand?.tradeCategory || (cand as any)?.trade,
              cnic: (a as any).cnic || cand?.cnic,
              testingHubId:
                a.testingHubId ?? (cand as any)?.testingHubId ?? cand?.hubLocationId,
            }
          })
        }
      } catch {}

      queueAssessments = queueAssessments.filter((a) => isApprovalRecord(a))
      const mapped = queueAssessments.map(toSubmission)

      // Keep items actioned in this session so the Approved/Rejected tabs still show them
      setSubmissions((prev) => {
        const newIds = new Set(mapped.map((item) => item.id))
        // A failed or empty load must never wipe what is already on screen.
        if (mapped.length === 0 && prev.length > 0) return prev
        const preserved = prev.filter(
          (p) => !newIds.has(p.id) && p.status !== "submitted",
        )
        return [...mapped, ...preserved]
      })
    } catch (err: any) {
      setLoadError(
        err instanceof ApiError && err.status === 403
          ? "Only Center Superintendents can view the approval queue."
          : err?.message || "Could not load the approval queue.",
      )
    } finally {
      hasLoadedOnce.current = true
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()

    const onFocus = () => {
      loadQueue()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadQueue()
      }
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  function explain(err: any) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        loadQueue()
        return "This record is no longer awaiting approval (already actioned). The queue was refreshed."
      }

      if (err.status === 403) return "This record belongs to another hub."

      if (err.status === 404) return "Record not found."

      if (err.status === 0) return "Cannot reach the server. Please try again."

      return err.message
    }

    return err?.message || "Something went wrong."
  }

  async function handleApprove() {
    if (!selected) return
    setStepUpError("")
    setStepUpOpen(true)
  }

  async function handleStepUpSubmit(code: string, isBackupCode: boolean) {
    if (!selected) return
    setStepUpLoading(true)
    setStepUpError("")

    try {
      // Feature B1: Step-Up MFA Authorization
      const stepUpRes = await api.requestStepUp(
        "APPROVE_ASSESSMENT",
        isBackupCode ? undefined : code,
        isBackupCode ? code : undefined,
      )
      const stepUpToken = stepUpRes.stepUpToken

      setStepUpOpen(false)
      setStepUpLoading(false)
      setBusy(true)
      setActionError("")

      try {
        // 1. Submit assessment approval with step-up token header (B1)
        await api.approveAssessment(selected.id, stepUpToken)

        // 2. Queue for blockchain minting via Guide #5 §3 POST /api/ledger/approve
        const credId =
          selected.credentialId || `urn:uuid:${crypto.randomUUID()}`
        let queueRes = null

        try {
          queueRes = await api.approveCredential(credId)
        } catch (err: any) {
          if (err instanceof ApiError && err.status === 409) {
            setActionError("Revoked credentials cannot be approved.")
            setBusy(false)
            return
          }
          console.warn("Ledger approve note:", err?.message)
        }

        const assignedCredId = queueRes?.data?.credential_id || credId
        assessmentStore.saveAssessmentLocal({
          candidateId: selected.candidateId || "",
          candidateName: selected.candidate,
          tradeCategory: selected.trade,
          assessmentId: selected.id,
          score: selected.score,
          grade: selected.grade,
          status: "APPROVED",
          credentialId: assignedCredId,
          updatedAt: new Date().toISOString(),
        })

        setSubmissions((ss) =>
          ss.map((s) =>
            s.id === selected.id
              ? {
                  ...s,
                  status: "approved",
                  mintingStatus: "queued",
                  credentialId: assignedCredId,
                }
              : s,
          ),
        )

        setModal("none")
        setToast(
          "Credential approved with Step-Up MFA and enqueued for blockchain anchoring (Relayer polling every 30s).",
        )

        // Start polling per Guide #5 §6
        startPollingCredential(assignedCredId)
      } catch (err) {
        setActionError(explain(err))
      } finally {
        setBusy(false)
      }
    } catch (err: any) {
      setStepUpLoading(false)
      if (err?.status === 423) {
        setStepUpError(
          "Account temporarily locked due to too many failed MFA attempts. Try again in 15 minutes.",
        )
      } else if (err?.status === 401) {
        setStepUpError("Invalid MFA code. Please try again.")
      } else {
        setStepUpError(err?.message || "Step-up verification failed.")
      }
    }
  }

  async function handleReject() {
    if (!selected || !rejectionReason.trim()) return

    setBusy(true)

    setActionError("")

    try {
      await api.rejectAssessment(selected.id, rejectionReason.trim())
      assessmentStore.saveAssessmentLocal({
        candidateId: selected.candidateId || "",
        candidateName: selected.candidate,
        tradeCategory: selected.trade,
        assessmentId: selected.id,
        score: selected.score,
        grade: selected.grade,
        status: "REJECTED",
        updatedAt: new Date().toISOString(),
      })

      // Server auto-returns the record to DRAFT; REJECTED is never a resting state.

      setSubmissions((ss) =>
        ss.map((s) =>
          s.id === selected.id
            ? {
                ...s,
                status: "rejected",
                rejectionReason: rejectionReason.trim(),
              }
            : s,
        ),
      )

      setModal("none")

      setRejectionReason("")

      setToast(
        "Rejected. Returned to the tester as a draft with your reason attached.",
      )
    } catch (err) {
      setActionError(explain(err))
    } finally {
      setBusy(false)
    }
  }

  const scoreColor = (pct: number) =>
    pct >= 85
      ? "#4C7A6E"
      : pct >= 70
        ? "#4C7A6E"
        : pct >= 50
          ? "#B08D46"
          : "#A6453D"

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          className="display"
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "#4C7A6E",
            margin: "0 0 8px",
            letterSpacing: -0.2,
          }}
        >
          Approval Queue
        </h1>
        <p style={{ fontSize: 16, color: "#5C5A50", margin: 0 }}>
          Review and action submitted assessment records for{" "}
          {SUPERINTENDENT_HUB}.
        </p>
      </div>

      {toast && (
        <div
          style={{
            background: "#EAF3DE",
            border: "1px solid #4C7A6E",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "#173404",
          }}
        >
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
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
      {loadError && (
        <div
          style={{
            background: "#FCEBEB",
            border: "1px solid #A6453D",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: "#501313",
          }}
        >
          <span>{loadError}</span>
          <button
            onClick={loadQueue}
            style={{
              height: 30,
              padding: "0 14px",
              background: "#fff",
              color: "#501313",
              border: "1px solid #A6453D",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #D6D3C6",
          borderRadius: 8,
        }}
      >
        {/* Filters */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #D6D3C6",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, CNIC, or assessment ID…"
              style={{
                flex: 1,
                minWidth: 260,
                padding: "10px 14px",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                background: "#F1F0EA",
                color: "#24302E",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 8,
                background: "#F1F0EA",
                padding: 4,
                borderRadius: 8,
                border: "1px solid #D6D3C6",
              }}
            >
              {(["all", "submitted", "approved", "rejected"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      height: 32,
                      padding: "0 16px",
                      borderRadius: 6,
                      border:
                        filter === f
                          ? "1px solid #4C7A6E"
                          : "1px solid transparent",
                      background: filter === f ? "#4C7A6E" : "transparent",
                      color: filter === f ? "#fff" : "#5C5A50",
                      fontSize: 13,
                      fontWeight: filter === f ? 600 : 500,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {f === "all" ? "All Records" : f}
                  </button>
                ),
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Select
              value={tradeFilter}
              onChange={setTradeFilter}
              options={[
                { value: "all", label: "All Trades" },
                ...trades.map((t) => ({ value: t, label: t })),
              ]}
              style={{ height: 36 }}
            />
            <Select
              value={testerFilter}
              onChange={setTesterFilter}
              options={[
                { value: "all", label: "All Testers" },
                ...testers.map((t) => ({ value: t, label: t })),
              ]}
              style={{ height: 36 }}
            />
            <Select
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: "all", label: "Any Date" },
                { value: "today", label: "Today" },
              ]}
              style={{ height: 36 }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}
          >
            <thead>
              <tr style={{ background: "#F1F0EA" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Assessment ID
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                  }}
                >
                  Candidate
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Trade Category
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Tester
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Score / Grade
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Submitted At
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#5C5A50",
                    borderBottom: "2px solid #E8E5D8",
                  }}
                >
                  Credential ID
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5C5A50",
                    borderBottom: "1px solid #D6D3C6",
                    whiteSpace: "nowrap",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((s) => {
                const pct = Math.round((s.score / s.maxScore) * 100)

                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #F1EFE8" }}>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: 13,
                        color: "#5C5A50",
                        fontFamily: "IBM Plex Mono, monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.id}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#4C7A6E",
                        }}
                      >
                        {s.candidate}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#5C5A50",
                          fontFamily: "IBM Plex Mono, monospace",
                          marginTop: 2,
                        }}
                      >
                        {s.cnic}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: 14,
                        color: "#24302E",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.trade}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: 14,
                        color: "#24302E",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.submittedBy}
                    </td>
                    <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: scoreColor(pct),
                            fontFamily: "IBM Plex Mono, monospace",
                          }}
                        >
                          {s.score}
                        </div>
                        <GradePill grade={s.grade} />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: 13,
                        color: "#5C5A50",
                        fontFamily: "IBM Plex Mono, monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.submittedAt}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {s.credentialId ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <code style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: "#24302E",
                            background: "#F1F0EA",
                            padding: "2px 6px",
                            borderRadius: 4,
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block"
                          }}>
                            {s.credentialId}
                          </code>
                          <button
                            title="Copy Credential ID"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(s.credentialId!);
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #D6D3C6",
                              borderRadius: 4,
                              cursor: "pointer",
                              padding: "2px 8px",
                              fontSize: 11,
                              color: "#4C7A6E",
                              flexShrink: 0
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#8C897C" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <StatusPill status={s.status} />
                    </td>
                    <td style={{ padding: "16px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setSelected(s)
                          setModal("detail")
                        }}
                        style={{
                          height: 32,
                          padding: "0 16px",
                          background: "#fff",
                          color: "#4C7A6E",
                          border: "1px solid #D6D3C6",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                )
              })}
              {displayed.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "64px 24px",
                      textAlign: "center",
                      fontSize: 14,
                      color: "#5C5A50",
                    }}
                  >
                    {loading ? "Loading queue…" : "No pending approvals."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {modal === "detail" && selected && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                className="display"
                style={{ fontSize: 24, color: "#4C7A6E", margin: "0 0 4px" }}
              >
                Candidate & Record Detail
              </h2>
              <code
                style={{
                  fontSize: 13,
                  color: "#5C5A50",
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                {selected.id}
              </code>
            </div>
            <StatusPill status={selected.status} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            <div>
              <div
                style={{
                  color: "#5C5A50",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Candidate
              </div>
              <div style={{ color: "#4C7A6E", fontWeight: 600 }}>
                {selected.candidate}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#5C5A50",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                CNIC
              </div>
              <div
                style={{
                  color: "#24302E",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 13,
                }}
              >
                {selected.cnic}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#5C5A50",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Trade Category
              </div>
              <div style={{ color: "#24302E" }}>{selected.trade}</div>
            </div>
            <div>
              <div
                style={{
                  color: "#5C5A50",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Hub
              </div>
              <div
                style={{
                  color: "#24302E",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 13,
                }}
              >
                {selected.hub}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#5C5A50",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Trade Tester
              </div>
              <div style={{ color: "#24302E" }}>{selected.submittedBy}</div>
            </div>
            <div>
              <div
                style={{
                  color: "#5C5A50",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Submitted Date/Time
              </div>
              <div
                style={{
                  color: "#24302E",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 13,
                }}
              >
                {selected.submittedAt}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 20,
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
              <span style={{ fontSize: 14, fontWeight: 600, color: "#4C7A6E" }}>
                Assessment Score
              </span>
              <GradePill grade={selected.grade} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: scoreColor(
                    Math.round((selected.score / selected.maxScore) * 100),
                  ),
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                {selected.score}
              </span>
              <span style={{ fontSize: 16, color: "#5C5A50" }}>
                / {selected.maxScore}
              </span>
            </div>
            <div style={{ height: 8, background: "#E4E2D9", borderRadius: 4 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round((selected.score / selected.maxScore) * 100)}%`,
                  background: "#B08D46",
                  borderRadius: 4,
                }}
              />
            </div>
          </div>

          {selected.status === "approved" && (selected.credentialId || selected.mintingStatus) && (
            <div
              style={{
                background: "#F1F0EA",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#4C7A6E",
                  margin: "0 0 12px",
                }}
              >
                Minting Progress
              </h3>
              {selected.mintingStatus && (
                <div style={{ marginBottom: 16 }}>
                  <MintingPill status={selected.mintingStatus} />
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  fontSize: 13,
                }}
              >
                {selected.credentialId && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ color: "#5C5A50", fontSize: 12, marginBottom: 4 }}>
                      Credential ID (Worker Passport ID)
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{
                        fontFamily: "monospace",
                        color: "#24302E",
                        fontSize: 12,
                        background: "#F1F0EA",
                        padding: "4px 8px",
                        borderRadius: 4,
                        wordBreak: "break-all"
                      }}>
                        {selected.credentialId || selected.mintingStatus}
                      </code>
                      {selected.credentialId && (
                        <button
                          onClick={() => navigator.clipboard.writeText(selected.credentialId!)}
                          style={{
                            background: "#4C7A6E",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            flexShrink: 0
                          }}
                        >
                          📋 Copy
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#8C897C", marginTop: 4 }}>
                      Give this ID to the worker to load their passport in the NSP Mobile Wallet
                    </div>
                  </div>
                )}
                {selected.blockNumber && (
                  <div>
                    <div style={{ color: "#5C5A50", marginBottom: 2 }}>
                      Block Number
                    </div>
                    <div
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#24302E",
                      }}
                    >
                      {selected.blockNumber}
                    </div>
                  </div>
                )}
                {selected.txHash && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ color: "#5C5A50", marginBottom: 2 }}>
                      Transaction Hash (Polygon Amoy Testnet)
                    </div>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${selected.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#4C7A6E",
                        fontSize: 12,
                        textDecoration: "underline",
                        wordBreak: "break-all",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {selected.txHash}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {selected.mintingStatus === "failed" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: "#FCEBEB",
                    border: "1px solid #FCCACA",
                    borderRadius: 6,
                    color: "#501313",
                    fontSize: 13,
                  }}
                >
                  <strong style={{ display: "block", marginBottom: 4 }}>
                    Failure Reason:
                  </strong>
                  {selected.failReason}
                  {selected.retryStatus && (
                    <div style={{ marginTop: 4, fontWeight: 600 }}>
                      {selected.retryStatus}
                    </div>
                  )}
                  <button
                    onClick={() => handleRetryMint(selected)}
                    style={{
                      marginTop: 10,
                      height: 32,
                      padding: "0 14px",
                      background: "#A6453D",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Retry Minting (POST /api/ledger/approve)
                  </button>
                </div>
              )}
            </div>
          )}

          {selected.status === "rejected" && selected.rejectionReason && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #FCCACA",
                borderRadius: 8,
                padding: 20,
                marginBottom: 24,
                fontSize: 14,
                color: "#501313",
              }}
            >
              <strong style={{ display: "block", marginBottom: 4 }}>
                Rejection Reason:
              </strong>
              {selected.rejectionReason}
            </div>
          )}

          {actionError && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #A6453D",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#501313",
              }}
            >
              {actionError}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            {selected.status === "submitted" && (
              <>
                <button
                  onClick={() => {
                    setActionError("")
                    handleApprove()
                  }}
                  style={{
                    flex: 1,
                    height: 44,
                    background: "#4C7A6E",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setModal("reject")
                    setRejectionReason("")
                    setActionError("")
                  }}
                  style={{
                    flex: 1,
                    height: 44,
                    background: "#fff",
                    color: "#A6453D",
                    border: "1px solid #A6453D",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </>
            )}
            <button
              onClick={() => setModal("none")}
              style={{
                height: 44,
                padding: "0 24px",
                background: "#fff",
                color: "#24302E",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                flex: selected.status === "submitted" ? "none" : 1,
              }}
            >
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Approve & Sign Popup */}
      {modal === "reject" && selected && (
        <ModalOverlay>
          <div style={{ marginBottom: 24 }}>
            <h2
              className="display"
              style={{ fontSize: 24, color: "#A6453D", margin: "0 0 8px" }}
            >
              Reject Assessment
            </h2>
            <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
              The record will be returned to the Trade Tester as a draft for
              correction.
            </p>
          </div>

          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ color: "#5C5A50" }}>Candidate</div>
              <div style={{ fontWeight: 600, color: "#4C7A6E" }}>
                {selected.candidate}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ color: "#5C5A50" }}>Assessment ID</div>
              <div
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  color: "#24302E",
                }}
              >
                {selected.id}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ color: "#5C5A50" }}>Score & Grade</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "IBM Plex Mono, monospace",
                    fontWeight: 600,
                  }}
                >
                  {selected.score}/{selected.maxScore}
                </span>
                <GradePill grade={selected.grade} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#4C7A6E",
                marginBottom: 8,
              }}
            >
              Rejection Reason <span style={{ color: "#A6453D" }}>*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Explain why this assessment is being rejected..."
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                resize: "vertical",
                fontFamily: "Inter, sans-serif",
                color: "#24302E",
                background: "#fff",
              }}
            />
            {!rejectionReason.trim() && (
              <p style={{ fontSize: 12, color: "#A6453D", margin: "6px 0 0" }}>
                A mandatory rejection reason is required.
              </p>
            )}
          </div>

          {actionError && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #A6453D",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#501313",
              }}
            >
              {actionError}
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || busy}
              style={{
                flex: 1,
                height: 44,
                background:
                  rejectionReason.trim() && !busy ? "#A6453D" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: rejectionReason.trim() ? "pointer" : "not-allowed",
              }}
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => {
                setModal("detail")
                setRejectionReason("")
              }}
              style={{
                height: 44,
                padding: "0 24px",
                background: "#fff",
                color: "#24302E",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Step-Up MFA Challenge Modal (Capstone B1) */}
      <StepUpModal
        open={stepUpOpen}
        scopeLabel="Approve Assessment (Scope: APPROVE_ASSESSMENT)"
        actionDescription={`Approving assessment for ${selected?.candidate || "the candidate"}. This will issue a verifiable credential and queue it for Polygon Amoy blockchain anchoring.`}
        loading={stepUpLoading}
        error={stepUpError}
        onSubmit={handleStepUpSubmit}
        onCancel={() => {
          setStepUpOpen(false)
          setStepUpError("")
        }}
      />
    </div>
  )
}
