import { useState } from 'react'

type NotifCategory = 'all' | 'approval' | 'enrollment' | 'system' | 'security'

interface Notification {
  id: string
  category: NotifCategory
  title: string
  body: string
  timestamp: string
  read: boolean
  actionLabel?: string
  actionScreen?: string
}

const INITIAL_NOTIFS: Notification[] = [
  { id: '1', category: 'approval', title: 'Assessment Approved', body: 'Muhammad Aamir Khan\'s assessment (Electrician) was approved by Fatima Malik.', timestamp: 'Today, 09:41', read: false, actionLabel: 'View Record' },
  { id: '2', category: 'security', title: 'New Device Sign-In', body: 'A new sign-in was detected from Chrome on Windows 11 (203.128.22.15). If this wasn\'t you, revoke the session immediately.', timestamp: 'Today, 08:12', read: false, actionLabel: 'Review Sessions' },
  { id: '3', category: 'approval', title: 'Assessment Rejected', body: 'Zainab Noor\'s assessment (Welding) was rejected by Fatima Malik. Reason: Score below passing threshold. Reassessment required.', timestamp: 'Today, 07:55', read: false, actionLabel: 'View Record' },
  { id: '4', category: 'enrollment', title: 'NADRA Verification Failed', body: 'CNIC 35202-0000000-0 could not be verified against NADRA records during enrollment.', timestamp: 'Yesterday, 16:30', read: true },
  { id: '5', category: 'approval', title: 'Assessment Submitted for Review', body: 'Sara Bibi\'s assessment (Plumbing) has been submitted and is awaiting your review.', timestamp: 'Yesterday, 15:32', read: true, actionLabel: 'Open Queue' },
  { id: '6', category: 'system', title: 'Offline Records Synchronized', body: '3 enrollment records that were queued locally have been successfully uploaded to the server.', timestamp: 'Yesterday, 09:00', read: true },
  { id: '7', category: 'enrollment', title: 'Candidate Enrolled', body: 'New candidate Rabia Qureshi (Masonry) has been enrolled and is pending NADRA verification.', timestamp: '2 days ago', read: true },
  { id: '8', category: 'system', title: 'Hub Progress Update', body: 'Lahore-C01 has reached 78% of the 60-candidate target. 13 more enrollments are required this cycle.', timestamp: '2 days ago', read: true },
  { id: '9', category: 'security', title: 'Password Changed', body: 'Your account password was successfully updated. If you did not make this change, contact your administrator immediately.', timestamp: '3 days ago', read: true },
  { id: '10', category: 'approval', title: 'Assessment Approved', body: 'Tariq Mehmood\'s assessment (Plumbing) was approved. Score: 91/100 — Distinction.', timestamp: '3 days ago', read: true },
]

const categoryIcons: Record<NotifCategory | 'all', React.ReactNode> = {
  all: null,
  approval: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  enrollment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  security: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
}

const categoryColors: Record<NotifCategory, { icon: string; bg: string }> = {
  all: { icon: '#8C897C', bg: '#F1EFE8' },
  approval: { icon: '#2E6FE0', bg: '#E4EEFC' },
  enrollment: { icon: '#4C7A6E', bg: '#EAF3DE' },
  system: { icon: '#8C897C', bg: '#F1EFE8' },
  security: { icon: '#B08D46', bg: '#FCE8D6' },
}

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS)
  const [filter, setFilter] = useState<NotifCategory | 'all'>('all')

  const unread = notifs.filter(n => !n.read).length

  function markRead(id: string) {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  }

  function dismiss(id: string) {
    setNotifs(ns => ns.filter(n => n.id !== id))
  }

  const displayed = notifs.filter(n => filter === 'all' || n.category === filter)

  const categories: { key: NotifCategory | 'all'; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifs.length },
    { key: 'approval', label: 'Approvals', count: notifs.filter(n => n.category === 'approval').length },
    { key: 'enrollment', label: 'Enrollment', count: notifs.filter(n => n.category === 'enrollment').length },
    { key: 'system', label: 'System', count: notifs.filter(n => n.category === 'system').length },
    { key: 'security', label: 'Security', count: notifs.filter(n => n.category === 'security').length },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 400, color: '#24302E', margin: '0 0 4px', letterSpacing: -0.2 }}>Notifications</h1>
          <p style={{ fontSize: 14, color: '#5C5A50', margin: 0 }}>
            {unread > 0 ? <><strong style={{ color: '#24302E' }}>{unread} unread</strong> — stay on top of approvals, enrollments, and security alerts.</> : 'All caught up. No unread notifications.'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            style={{ height: 36, padding: '0 16px', background: '#fff', color: '#4C7A6E', border: '1px solid #D6D3C6', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* category filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            style={{
              height: 34, padding: '0 14px', borderRadius: 6,
              border: `1px solid ${filter === c.key ? '#4C7A6E' : '#D6D3C6'}`,
              background: filter === c.key ? '#4C7A6E' : '#fff',
              color: filter === c.key ? '#fff' : '#5C5A50',
              fontSize: 13, fontWeight: filter === c.key ? 600 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {c.label}
            {c.count !== undefined && c.count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: filter === c.key ? 'rgba(255,255,255,0.25)' : '#F1EFE8',
                color: filter === c.key ? '#fff' : '#5C5A50',
                padding: '1px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center',
              }}>
                {c.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* notification list */}
      {displayed.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 64, textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D6D3C6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#24302E', marginBottom: 4 }}>No notifications</div>
          <div style={{ fontSize: 13, color: '#8C897C' }}>Nothing in this category yet.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, overflow: 'hidden' }}>
          {displayed.map((n, idx) => {
            const colors = categoryColors[n.category]
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex', gap: 16, padding: '18px 24px',
                  borderBottom: idx < displayed.length - 1 ? '1px solid #F1EFE8' : 'none',
                  background: n.read ? '#fff' : '#FAFCFF',
                  cursor: 'pointer', transition: 'background 0.1s',
                  position: 'relative',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F1F0EA' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? '#fff' : '#FAFCFF' }}
              >
                {/* unread dot */}
                {!n.read && (
                  <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, background: '#4C7A6E', borderRadius: '50%' }} />
                )}

                {/* icon */}
                <div style={{
                  width: 38, height: 38, background: colors.bg, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: colors.icon,
                }}>
                  {categoryIcons[n.category]}
                </div>

                {/* content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: '#24302E' }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: '#8C897C', flexShrink: 0, fontFamily: 'IBM Plex Mono, monospace' }}>{n.timestamp}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#5C5A50', margin: '0 0 8px', lineHeight: 1.5 }}>{n.body}</p>
                  {n.actionLabel && (
                    <button
                      onClick={e => { e.stopPropagation(); markRead(n.id) }}
                      style={{ fontSize: 12, color: '#4C7A6E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      {n.actionLabel} →
                    </button>
                  )}
                </div>

                {/* dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D6D3C6', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                  title="Dismiss"
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8C897C' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D6D3C6' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
