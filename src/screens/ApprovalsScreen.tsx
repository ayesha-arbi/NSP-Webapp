import { useState, useEffect } from "react"

import Select from "@/components/Select"

import { api, ApiError, Assessment } from "../services/api"

import { authStore } from "../services/authStore"

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

  rejectionReason?: string
}

// Guide 3 §1.1: the queue only carries ids, score, grade and trade/hub id. Names/CNIC are not in the payload yet.

function toSubmission(a: Assessment): Submission {
  return {
    id: a.assessmentId,

    candidate: a.candidateName || `Candidate ${a.candidateId.slice(0, 8)}`,

    cnic: "—",

    trade: a.tradeCategory || "—",

    hub: a.testingHubId != null ? `Hub ${a.testingHubId}` : "—",

    submittedBy: a.testerUserId ? a.testerUserId.slice(0, 8) : "—",

    submittedAt: a.submittedAt
      ? a.submittedAt.slice(0, 16).replace("T", " ")
      : "—",

    score: a.score,

    maxScore: 100, // criteria in AssessmentScreen sum to 100

    grade: a.grade,

    status: "submitted",
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

  const s = map[status]

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
      bg: "#F1E7D2",
      text: "#8C6F35",
      label: "In Progress",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
        </svg>
      ),
    },

    broadcasted: {
      bg: "#F1E7D2",
      text: "#8C6F35",
      label: "In Progress",
      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
        </svg>
      ),
    },

    confirmed: {
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

    failed: {
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

  const s = map[status]

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

  const [toast, setToast] = useState("")

  const [filter, setFilter] = useState<"all" | ApprovalStatus>("submitted")

  const [search, setSearch] = useState("")

  const [tradeFilter, setTradeFilter] = useState("all")

  const [testerFilter, setTesterFilter] = useState("all")

  const [dateFilter, setDateFilter] = useState("all")

  const [selected, setSelected] = useState<Submission | null>(null)

  const [modal, setModal] = useState<ModalType>("none")

  const [passphrase, setPassphrase] = useState("")

  const [rejectionReason, setRejectionReason] = useState("")

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

  async function loadQueue() {
    setLoading(true)

    setLoadError("")

    try {
      const res = await api.getQueue()

      // Keep items actioned in this session so the Approved/Rejected tabs still show them

      setSubmissions((prev) => [
        ...res.assessments.map(toSubmission),
        ...prev.filter((p) => p.status !== "submitted"),
      ])
    } catch (err: any) {
      setLoadError(
        err instanceof ApiError && err.status === 403
          ? "Only Center Superintendents can view the approval queue."
          : err?.message || "Could not load the approval queue.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
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

    setBusy(true)

    setActionError("")

    try {
      await api.approveAssessment(selected.id)

      setSubmissions((ss) =>
        ss.map((s) =>
          s.id === selected.id ? { ...s, status: "approved" } : s,
        ),
      )

      setModal("none")

      setPassphrase("")

      setToast("Assessment approved. Minting is not active yet.")
    } catch (err) {
      setActionError(explain(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    if (!selected || !rejectionReason.trim()) return

    setBusy(true)

    setActionError("")

    try {
      await api.rejectAssessment(selected.id, rejectionReason.trim())

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
                    colSpan={8}
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

          {selected.status === "approved" && selected.mintingStatus && (
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
              <div style={{ marginBottom: 16 }}>
                <MintingPill status={selected.mintingStatus} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  fontSize: 13,
                }}
              >
                {selected.credentialId && (
                  <div>
                    <div style={{ color: "#5C5A50", marginBottom: 2 }}>
                      Credential ID
                    </div>
                    <div
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#24302E",
                      }}
                    >
                      {selected.credentialId}
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
                      Transaction Hash
                    </div>
                    <div
                      style={{
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "#24302E",
                      }}
                    >
                      {selected.txHash}
                    </div>
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

          <div style={{ display: "flex", gap: 12 }}>
            {selected.status === "submitted" && (
              <>
                <button
                  onClick={() => {
                    setModal("approve")
                    setPassphrase("")
                    setActionError("")
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
      {modal === "approve" && selected && (
        <ModalOverlay>
          <div style={{ marginBottom: 24 }}>
            <h2
              className="display"
              style={{ fontSize: 24, color: "#4C7A6E", margin: "0 0 8px" }}
            >
              Approve & Sign Record
            </h2>
            <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
              You are approving the following assessment record. Minting is not
              active yet, so the record will move to Approved.
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
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
              Superintendent Passphrase{" "}
              <span style={{ color: "#8C897C", fontWeight: 400 }}>
                (not used yet. Signing arrives with minting)
              </span>
            </label>
            <p style={{ fontSize: 13, color: "#5C5A50", marginBottom: 12 }}>
              Enter your passphrase to unlock the hub's private signing key and
              digitally sign this approval.
            </p>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                color: "#24302E",
                background: "#fff",
              }}
            />
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
              onClick={handleApprove}
              disabled={busy}
              style={{
                flex: 1,
                height: 44,
                background: busy ? "#4C7A6E" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: passphrase ? "pointer" : "not-allowed",
              }}
            >
              Sign & Approve
            </button>
            <button
              onClick={() => {
                setModal("detail")
                setPassphrase("")
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

      {/* Reject Reason Popup */}
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
    </div>
  )
}
