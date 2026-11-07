import SuperAdminDashboard from "./SuperAdminDashboard"

import { authStore } from "../services/authStore"
import { api } from "../services/api"
import { useState, useEffect } from "react"

type Role = "trade-tester" | "center-superintendent" | "super-admin"

interface DashboardProps {
  role: Role

  onNavigate: (
    screen: "enrollment" | "assessment" | "approvals" | "record-detail",
  ) => void
}

function StatCard({
  label,

  value,

  sub,

  accent,
}: {
  label: string

  value: string | number

  sub?: string

  accent?: boolean
}) {
  return (
    <div
      style={{
        background: "#fff",

        border: "1px solid #D6D3C6",

        borderRadius: 8,

        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 13,

          color: "#5C5A50",

          fontWeight: 500,

          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,

          fontWeight: 700,

          color: accent ? "#4C7A6E" : "#24302E",

          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#8C897C", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function StatusPill({
  status,
}: {
  status: "draft" | "in-progress" | "in-review" | "completed" | "failed"
}) {
  const map = {
    draft: {
      bg: "#E4E2D9",

      text: "#5C5A50",

      label: "Draft",

      svg: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="7"
            stroke="#8C897C"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>
      ),
    },

    "in-progress": {
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

    "in-review": {
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

    completed: {
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

function TradeTesterDashboard({
  onNavigate,
}: {
  onNavigate: DashboardProps["onNavigate"]
}) {
  const user = authStore.getState().user
  const [recentCandidates, setRecentCandidates] = useState<any[]>([])
  const [stats, setStats] = useState({
    enrolled: 0,
    draft: 0,
    submitted: 0,
    target: 0,
    targetProgress: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const assessments = await api.listAssessments()
        if (mounted && assessments) {
          setRecentCandidates(assessments.slice(0, 5))
          setStats({
            enrolled: assessments.length,
            draft: assessments.filter((a: any) => a.status === "draft").length,
            submitted: assessments.filter((a: any) => a.status === "submitted").length,
            target: 60,
            targetProgress: Math.round((assessments.length / 60) * 100),
          })
        }
      } catch (err) {
        console.warn("Failed to load assessments:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : "User")

  const hubId = user?.hubLocationId ?? 1

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
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
          Good morning, {displayName}
        </h1>
        <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
          Hub Location #{hubId} · Authenticated as{" "}
          {user?.email || ""}
        </p>
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(4, 1fr)",

          gap: 16,

          marginBottom: 32,
        }}
      >
        <StatCard
          label="Candidates Enrolled"
          value={loading ? "..." : stats.enrolled}
          sub="This cycle"
          accent
        />
        <StatCard
          label="Draft Assessments"
          value={loading ? "..." : stats.draft}
          sub="Awaiting submission"
        />
        <StatCard
          label="Submitted Assessments"
          value={loading ? "..." : stats.submitted}
          sub="Sent for approval"
        />
        <StatCard
          label="Target Progress"
          value={loading ? "..." : `${stats.enrolled} / ${stats.target}`}
          sub={`${stats.targetProgress}% toward hub goal`}
        />
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "#fff",

          border: "1px solid #D6D3C6",

          borderRadius: 8,

          padding: 24,

          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#24302E" }}>
              Hub Progress — Hub #{hubId}
            </div>
            <div style={{ fontSize: 13, color: "#5C5A50" }}>
              {stats.enrolled} enrolled out of {stats.target} required candidates
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#4C7A6E" }}>
              {loading ? "..." : `${stats.targetProgress}%`}
            </div>
            <div style={{ fontSize: 12, color: "#8C897C" }}>{stats.target - stats.enrolled} remaining</div>
          </div>
        </div>
        <div
          style={{
            height: 8,

            background: "#F1EFE8",

            borderRadius: 4,

            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",

              width: loading ? "0%" : `${stats.targetProgress}%`,

              background: "#B08D46",

              borderRadius: 4,

              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => onNavigate("enrollment")}
          style={{
            height: 40,

            padding: "0 20px",

            background: "#4C7A6E",

            color: "#fff",

            border: "none",

            borderRadius: 6,

            fontSize: 14,

            fontWeight: 600,

            cursor: "pointer",
          }}
        >
          + Enroll Candidate
        </button>
        <button
          onClick={() => onNavigate("assessment")}
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
          Enter Assessment
        </button>
      </div>

      {/* Recent candidates table */}
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

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",
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
            Recent Candidates
          </h2>
          <button
            onClick={() => onNavigate("enrollment")}
            style={{
              fontSize: 13,

              color: "#4C7A6E",

              background: "none",

              border: "none",

              cursor: "pointer",

              fontWeight: 500,
            }}
          >
            View all →
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F0EA" }}>
              {["Full Name", "CNIC", "Trade", "Hub", "Status", "Action"].map(
                (h) => (
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
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#8C897C" }}>
                  Loading candidates...
                </td>
              </tr>
            ) : recentCandidates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#8C897C" }}>
                  No candidates enrolled yet
                </td>
              </tr>
            ) : (
              recentCandidates.map((c, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #F1EFE8",
                    cursor: "pointer",
                  }}
                  onClick={() => onNavigate("record-detail")}
                  title="Click to view candidate record details"
                >
                  <td
                    style={{
                      padding: "12px 24px",
                      fontSize: 14,
                      color: "#24302E",
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        color: "#4C7A6E",
                        textDecoration: "underline",
                      }}
                    >
                      {c.name || c.candidateName || "Unknown"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      fontSize: 13,
                      color: "#5C5A50",
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    {c.cnic || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      fontSize: 13,
                      color: "#5C5A50",
                    }}
                  >
                    {c.trade || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      fontSize: 13,
                      color: "#5C5A50",
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    {c.hub || `Hub #${hubId}`}
                  </td>
                  <td style={{ padding: "12px 24px" }}>
                    <StatusPill status={c.status || "draft"} />
                  </td>
                  <td style={{ padding: "12px 24px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigate("record-detail")
                      }}
                      style={{
                        background: "none",
                        border: "1px solid #D6D3C6",
                        borderRadius: 4,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#4C7A6E",
                        cursor: "pointer",
                      }}
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CenterSuperDashboard({
  onNavigate,
}: {
  onNavigate: DashboardProps["onNavigate"]
}) {
  const user = authStore.getState().user
  const [approvals, setApprovals] = useState<any[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    enrolled: 0,
    target: 60,
    targetProgress: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const assessments = await api.listAssessments()
        if (mounted && assessments) {
          const pending = assessments.filter((a: any) => a.status === "submitted")
          setApprovals(pending.slice(0, 5))
          setStats({
            pending: pending.length,
            approved: assessments.filter((a: any) => a.status === "approved").length,
            rejected: assessments.filter((a: any) => a.status === "rejected").length,
            enrolled: assessments.length,
            target: 60,
            targetProgress: Math.round((assessments.length / 60) * 100),
          })
        }
      } catch (err) {
        console.warn("Failed to load assessments:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : "User")

  const hubId = user?.hubLocationId ?? 1

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
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
          Good morning, {displayName}
        </h1>
        <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
          Center Superintendent · Hub #{hubId}
        </p>
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(4, 1fr)",

          gap: 16,

          marginBottom: 32,
        }}
      >
        <StatCard
          label="Pending Approvals"
          value={loading ? "..." : stats.pending}
          sub="Awaiting review"
          accent
        />
        <StatCard label="Approved Records" value={loading ? "..." : stats.approved} sub="This cycle" />
        <StatCard
          label="Rejected Records"
          value={loading ? "..." : stats.rejected}
          sub="Returned for correction"
        />
        <StatCard
          label="Hub Progress"
          value={loading ? "..." : `${stats.enrolled} / ${stats.target}`}
          sub={`${stats.targetProgress}% toward target`}
        />
      </div>

      <div
        style={{
          background: "#fff",

          border: "1px solid #D6D3C6",

          borderRadius: 8,

          padding: 24,

          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#24302E" }}>
              Hub Progress — Hub #{hubId}
            </div>
            <div style={{ fontSize: 13, color: "#5C5A50" }}>
              {stats.enrolled} enrolled out of {stats.target} required candidates
            </div>
          </div>
          <span
            style={{
              display: "inline-flex",

              alignItems: "center",

              padding: "3px 10px",

              background: "#E4E2D9",

              borderRadius: 999,

              fontSize: 12,

              fontWeight: 600,

              color: "#4C7A6E",
            }}
          >
            On Track
          </span>
        </div>
        <div
          style={{
            height: 8,

            background: "#F1EFE8",

            borderRadius: 4,

            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",

              width: loading ? "0%" : `${stats.targetProgress}%`,

              background: "#B08D46",

              borderRadius: 4,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => onNavigate("approvals")}
          style={{
            height: 40,

            padding: "0 20px",

            background: "#4C7A6E",

            color: "#fff",

            border: "none",

            borderRadius: 6,

            fontSize: 14,

            fontWeight: 600,

            cursor: "pointer",
          }}
        >
          Open Approval Queue
        </button>
      </div>

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

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",
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
            Pending Approval Queue
          </h2>
          <span
            style={{
              fontSize: 12,

              background: "#E4E2D9",

              color: "#8C6F35",

              padding: "3px 10px",

              borderRadius: 999,

              fontWeight: 600,
            }}
          >
            12 pending
          </span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F0EA" }}>
              {[
                "Candidate",

                "Trade",

                "Submitted By",

                "Submitted At",

                "Status",

                "Actions",
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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#8C897C" }}>
                  Loading approvals...
                </td>
              </tr>
            ) : approvals.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#8C897C" }}>
                  No pending approvals
                </td>
              </tr>
            ) : (
              approvals.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F1EFE8" }}>
                  <td
                    style={{
                      padding: "12px 24px",

                      fontSize: 14,

                      color: "#24302E",

                      fontWeight: 500,
                    }}
                  >
                    {a.candidate || a.name || "Unknown"}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",

                      fontSize: 13,

                      color: "#5C5A50",
                    }}
                  >
                    {a.trade || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",

                      fontSize: 13,

                      color: "#5C5A50",
                    }}
                  >
                    {a.submittedBy || a.assessor || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",

                      fontSize: 12,

                      color: "#8C897C",

                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  >
                    {a.submittedAt || a.createdAt || "—"}
                  </td>
                  <td style={{ padding: "12px 24px" }}>
                    <StatusPill status={a.status || "in-review"} />
                  </td>
                  <td style={{ padding: "12px 24px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
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
                        Approve
                      </button>
                      <button
                        style={{
                          height: 30,
                          padding: "0 12px",
                          background: "#fff",
                          color: "#8C3B34",
                          border: "1px solid #A6453D",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                    <button
                      onClick={() => onNavigate("record-detail")}
                      style={{
                        height: 30,
                        padding: "0 10px",
                        background: "none",
                        color: "#4C7A6E",
                        border: "1px solid #D6D3C6",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                      title="View candidate record details"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function _SuperAdminDashboard_unused({
  onNavigate,
}: {
  onNavigate: DashboardProps["onNavigate"]
}) {
  const [hubs, setHubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const dashboardStats = await api.getDashboardStats()
        if (mounted && dashboardStats) {
          setHubs(dashboardStats.hubs || [])
        }
      } catch (err) {
        console.warn("Failed to load dashboard stats:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
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
          System Overview
        </h1>
        <p style={{ fontSize: 14, color: "#5C5A50", margin: 0 }}>
          Super Administrator · National Skills Passport — Issuer Portal
        </p>
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(6, 1fr)",

          gap: 16,

          marginBottom: 32,
        }}
      >
        <StatCard label="Total Candidates" value={loading ? "..." : hubs.reduce((s, h) => s + (h.enrolled || 0), 0)} sub="All hubs" accent />
        <StatCard label="Active Hubs" value={loading ? "..." : hubs.length} sub="Total hubs" />
        <StatCard label="Pending Approvals" value={loading ? "..." : hubs.reduce((s, h) => s + (h.pendingApproval || 0), 0)} sub="Across all hubs" />
        <StatCard label="Minting Queue" value={loading ? "..." : "—"} sub="Ready to mint" />
        <StatCard label="Confirmed Credentials" value={loading ? "..." : hubs.reduce((s, h) => s + (h.minted || 0), 0)} sub="On-chain" />
        <StatCard
          label="Failed Transactions"
          value={loading ? "..." : "—"}
          sub="Require attention"
        />
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "1fr 1fr",

          gap: 24,

          marginBottom: 32,
        }}
      >
        {/* System status */}
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
            System Status
          </h2>
          {loading ? (
            <div style={{ color: "#8C897C" }}>Loading system status...</div>
          ) : (
            <div style={{ color: "#8C897C" }}>System status data available via API</div>
          )}
        </div>

        {/* Recent activity */}
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
            Recent System Activity
          </h2>
          {loading ? (
            <div style={{ color: "#8C897C" }}>Loading activity...</div>
          ) : (
            <div style={{ color: "#8C897C" }}>Activity data available via API</div>
          )}
        </div>
      </div>

      {/* Hub progress table */}
      <div
        style={{
          background: "#fff",

          border: "1px solid #D6D3C6",

          borderRadius: 8,
        }}
      >
        <div
          style={{ padding: "16px 24px", borderBottom: "1px solid #D6D3C6" }}
        >
          <h2
            style={{
              fontSize: 15,

              fontWeight: 600,

              color: "#24302E",

              margin: 0,
            }}
          >
            Hub Progress Overview
          </h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F0EA" }}>
              {[
                "Hub",

                "Enrolled",

                "Target",

                "Approved",

                "Minting Queue",

                "Progress",
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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#8C897C" }}>
                  Loading hub data...
                </td>
              </tr>
            ) : hubs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#8C897C" }}>
                  No hub data available
                </td>
              </tr>
            ) : (
              hubs.map((hub, i) => {
                const pct = hub.target ? Math.round((hub.enrolled / hub.target) * 100) : 0

                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1EFE8" }}>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 13,

                        color: "#24302E",

                        fontFamily: "IBM Plex Mono, monospace",

                        fontWeight: 600,
                      }}
                    >
                      {hub.hub || hub.name || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 14,

                        color: "#24302E",

                        fontWeight: 600,
                      }}
                    >
                      {hub.enrolled || 0}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 14,

                        color: "#8C897C",
                      }}
                    >
                      {hub.target || 0}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 14,

                        color: "#24302E",
                      }}
                    >
                      {hub.approved || hub.pendingApproval || 0}
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",

                        fontSize: 14,

                        color: (hub.minting || 0) > 0 ? "#B08D46" : "#8C897C",
                      }}
                    >
                      {hub.minting || 0}
                    </td>
                    <td style={{ padding: "14px 24px", minWidth: 160 }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <div
                          style={{
                            flex: 1,

                            height: 6,

                            background: "#F1EFE8",

                            borderRadius: 3,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",

                              width: `${pct}%`,

                              background:
                                pct === 100
                                  ? "#B08D46"
                                  : pct >= 75
                                    ? "#4C7A6E"
                                    : "#D6D3C6",

                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,

                            color: "#5C5A50",

                            fontWeight: 600,

                            width: 36,

                            textAlign: "right",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DashboardScreen({ role, onNavigate }: DashboardProps) {
  if (role === "trade-tester")
    return <TradeTesterDashboard onNavigate={onNavigate} />

  if (role === "center-superintendent")
    return <CenterSuperDashboard onNavigate={onNavigate} />

  return <SuperAdminDashboard />
}
