import SuperAdminDashboard from './SuperAdminDashboard'

type Role = 'trade-tester' | 'center-superintendent' | 'super-admin'

interface DashboardProps {
  role: Role
  onNavigate: (screen: 'enrollment' | 'assessment' | 'approvals') => void
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 24 }}>
      <div style={{ fontSize: 13, color: '#5C5A50', fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? '#4C7A6E' : '#24302E', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#8C897C', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function StatusPill({ status }: { status: 'draft' | 'in-progress' | 'in-review' | 'completed' | 'failed' }) {
  const map = {
    draft: { bg: '#E4E2D9', text: '#5C5A50', label: 'Draft', svg: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#8C897C" strokeWidth="1.5" strokeDasharray="3 3"/></svg> },
    'in-progress': { bg: '#F1E7D2', text: '#8C6F35', label: 'In Progress', svg: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5"/><path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46"/></svg> },
    'in-review': { bg: '#F1E7D2', text: '#8C6F35', label: 'In Review', svg: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5"/><path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46"/><path d="M17 10 A7 7 0 0 1 10 17 L10 10 Z" fill="#B08D46"/><path d="M10 17 A7 7 0 0 1 3 10 L10 10 Z" fill="#B08D46"/></svg> },
    completed: { bg: '#DCE7E3', text: '#2F5C4E', label: 'Completed', svg: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#4C7A6E"/><path d="M6 10 L9 13 L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    failed: { bg: '#EFE3C9', text: '#9C6B1F', label: 'Needs Attention', svg: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#B08D46"/><path d="M10 5 L10 11 M10 14 L10 15" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg> },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 32, padding: '0 12px 0 6px', borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: s.bg, color: s.text }}>
      {s.svg}
      {s.label}
    </span>
  )
}

const recentCandidates = [
  { name: 'Muhammad Aamir Khan', cnic: '35202-1234567-1', trade: 'Electrician', hub: 'Lahore-C01', status: 'in-review' as const },
  { name: 'Sara Bibi', cnic: '35201-9876543-2', trade: 'Plumbing', hub: 'Lahore-C01', status: 'draft' as const },
  { name: 'Ali Nawaz', cnic: '35202-5551234-3', trade: 'Welding', hub: 'Lahore-C01', status: 'completed' as const },
  { name: 'Rabia Qureshi', cnic: '35203-7778889-4', trade: 'Masonry', hub: 'Lahore-C01', status: 'in-progress' as const },
  { name: 'Tariq Mehmood', cnic: '35204-3334455-5', trade: 'Plumbing', hub: 'Lahore-C01', status: 'failed' as const },
]

function TradeTesterDashboard({ onNavigate }: { onNavigate: DashboardProps['onNavigate'] }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 400, color: '#24302E', margin: '0 0 4px', letterSpacing: -0.2 }}>Good morning, Ahmad</h1>
        <p style={{ fontSize: 14, color: '#5C5A50', margin: 0 }}>Hub: Lahore-C01 · Today is {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Candidates Enrolled" value={47} sub="This cycle" accent />
        <StatCard label="Draft Assessments" value={8} sub="Awaiting submission" />
        <StatCard label="Submitted Assessments" value={31} sub="Sent for approval" />
        <StatCard label="Target Progress" value="47 / 60" sub="78% toward hub goal" />
      </div>

      {/* Progress bar */}
      <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#24302E' }}>Hub Progress — Lahore-C01</div>
            <div style={{ fontSize: 13, color: '#5C5A50' }}>47 enrolled out of 60 required candidates</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4C7A6E' }}>78%</div>
            <div style={{ fontSize: 12, color: '#8C897C' }}>13 remaining</div>
          </div>
        </div>
        <div style={{ height: 8, background: '#F1EFE8', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '78%', background: '#B08D46', borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button onClick={() => onNavigate('enrollment')} style={{ height: 40, padding: '0 20px', background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Enroll Candidate
        </button>
        <button onClick={() => onNavigate('assessment')} style={{ height: 40, padding: '0 20px', background: '#fff', color: '#24302E', border: '1px solid #D6D3C6', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
          Enter Assessment
        </button>
      </div>

      {/* Recent candidates table */}
      <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #D6D3C6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: 0 }}>Recent Candidates</h2>
          <button onClick={() => onNavigate('enrollment')} style={{ fontSize: 13, color: '#4C7A6E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View all →</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F1F0EA' }}>
              {['Full Name', 'CNIC', 'Trade', 'Hub', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#5C5A50', borderBottom: '1px solid #D6D3C6' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentCandidates.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1EFE8' }}>
                <td style={{ padding: '12px 24px', fontSize: 14, color: '#24302E', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '12px 24px', fontSize: 13, color: '#5C5A50', fontFamily: 'IBM Plex Mono, monospace' }}>{c.cnic}</td>
                <td style={{ padding: '12px 24px', fontSize: 13, color: '#5C5A50' }}>{c.trade}</td>
                <td style={{ padding: '12px 24px', fontSize: 13, color: '#5C5A50', fontFamily: 'IBM Plex Mono, monospace' }}>{c.hub}</td>
                <td style={{ padding: '12px 24px' }}><StatusPill status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CenterSuperDashboard({ onNavigate }: { onNavigate: DashboardProps['onNavigate'] }) {
  const approvals = [
    { candidate: 'Muhammad Aamir Khan', trade: 'Electrician', submittedBy: 'Ahmad Raza', submittedAt: '2026-08-26 09:14', status: 'in-review' as const },
    { candidate: 'Sara Bibi', trade: 'Plumbing', submittedBy: 'Ahmad Raza', submittedAt: '2026-08-25 15:32', status: 'in-review' as const },
    { candidate: 'Rabia Qureshi', trade: 'Masonry', submittedBy: 'Ahmad Raza', submittedAt: '2026-08-25 11:08', status: 'in-review' as const },
  ]

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 400, color: '#24302E', margin: '0 0 4px', letterSpacing: -0.2 }}>Good morning, Fatima</h1>
        <p style={{ fontSize: 14, color: '#5C5A50', margin: 0 }}>Center Superintendent · Hub: Lahore-C01</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Pending Approvals" value={12} sub="Awaiting review" accent />
        <StatCard label="Approved Records" value={28} sub="This cycle" />
        <StatCard label="Rejected Records" value={3} sub="Returned for correction" />
        <StatCard label="Hub Progress" value="47 / 60" sub="78% toward target" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#24302E' }}>Hub Progress — Lahore-C01</div>
            <div style={{ fontSize: 13, color: '#5C5A50' }}>47 enrolled out of 60 required candidates</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', background: '#E4E2D9', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#4C7A6E' }}>On Track</span>
        </div>
        <div style={{ height: 8, background: '#F1EFE8', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '78%', background: '#B08D46', borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button onClick={() => onNavigate('approvals')} style={{ height: 40, padding: '0 20px', background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Open Approval Queue
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #D6D3C6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: 0 }}>Pending Approval Queue</h2>
          <span style={{ fontSize: 12, background: '#E4E2D9', color: '#8C6F35', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>12 pending</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F1F0EA' }}>
              {['Candidate', 'Trade', 'Submitted By', 'Submitted At', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#5C5A50', borderBottom: '1px solid #D6D3C6' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {approvals.map((a, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1EFE8' }}>
                <td style={{ padding: '12px 24px', fontSize: 14, color: '#24302E', fontWeight: 500 }}>{a.candidate}</td>
                <td style={{ padding: '12px 24px', fontSize: 13, color: '#5C5A50' }}>{a.trade}</td>
                <td style={{ padding: '12px 24px', fontSize: 13, color: '#5C5A50' }}>{a.submittedBy}</td>
                <td style={{ padding: '12px 24px', fontSize: 12, color: '#8C897C', fontFamily: 'IBM Plex Mono, monospace' }}>{a.submittedAt}</td>
                <td style={{ padding: '12px 24px' }}><StatusPill status={a.status} /></td>
                <td style={{ padding: '12px 24px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ height: 30, padding: '0 12px', background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                    <button style={{ height: 30, padding: '0 12px', background: '#fff', color: '#8C3B34', border: '1px solid #A6453D', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function _SuperAdminDashboard_unused({ onNavigate }: { onNavigate: DashboardProps['onNavigate'] }) {
  const hubs = [
    { hub: 'Lahore-C01', enrolled: 47, target: 60, approved: 31, minting: 8 },
  ]
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 400, color: '#24302E', margin: '0 0 4px', letterSpacing: -0.2 }}>System Overview</h1>
        <p style={{ fontSize: 14, color: '#5C5A50', margin: 0 }}>Super Administrator · National Skills Passport — Issuer Portal</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Candidates" value={226} sub="All hubs" accent />
        <StatCard label="Active Hubs" value={5} sub="5 of 5 online" />
        <StatCard label="Pending Approvals" value={43} sub="Across all hubs" />
        <StatCard label="Minting Queue" value={28} sub="Ready to mint" />
        <StatCard label="Confirmed Credentials" value={148} sub="On-chain" />
        <StatCard label="Failed Transactions" value={4} sub="Require attention" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* System status */}
        <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: '0 0 16px' }}>System Status</h2>
          {[
            { label: 'Blockchain Node', status: 'online', val: '99.98% uptime' },
            { label: 'NADRA Verification API', status: 'online', val: 'Response 142ms' },
            { label: 'S3 Media Storage', status: 'online', val: '1.2 TB used' },
            { label: 'Notification Service', status: 'degraded', val: 'Minor delays' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1EFE8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'online' ? '#4C7A6E' : '#B08D46', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#24302E' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 12, color: '#8C897C', fontFamily: 'IBM Plex Mono, monospace' }}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: '0 0 16px' }}>Recent System Activity</h2>
          {[
            { msg: 'Credential minted for Muhammad Aamir Khan', time: '09:41', type: 'success' },
            { msg: 'Approval submitted: Sara Bibi (Lahore-C01)', time: '09:32', type: 'info' },
            { msg: 'Mint transaction failed — TXN-8F2A1C', time: '09:18', type: 'error' },
            { msg: 'New enrollment: Rabia Qureshi (Faisalabad-C04)', time: '09:05', type: 'info' },
            { msg: 'Hub Karachi-C02 reached 60 candidates', time: '08:57', type: 'success' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #F1EFE8' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'success' ? '#4C7A6E' : a.type === 'error' ? '#A6453D' : '#2E6FE0', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#24302E' }}>{a.msg}</div>
              </div>
              <span style={{ fontSize: 11, color: '#8C897C', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hub progress table */}
      <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #D6D3C6' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: 0 }}>Hub Progress Overview</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F1F0EA' }}>
              {['Hub', 'Enrolled', 'Target', 'Approved', 'Minting Queue', 'Progress'].map(h => (
                <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#5C5A50', borderBottom: '1px solid #D6D3C6' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hubs.map((hub, i) => {
              const pct = Math.round((hub.enrolled / hub.target) * 100)
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1EFE8' }}>
                  <td style={{ padding: '14px 24px', fontSize: 13, color: '#24302E', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{hub.hub}</td>
                  <td style={{ padding: '14px 24px', fontSize: 14, color: '#24302E', fontWeight: 600 }}>{hub.enrolled}</td>
                  <td style={{ padding: '14px 24px', fontSize: 14, color: '#8C897C' }}>{hub.target}</td>
                  <td style={{ padding: '14px 24px', fontSize: 14, color: '#24302E' }}>{hub.approved}</td>
                  <td style={{ padding: '14px 24px', fontSize: 14, color: hub.minting > 0 ? '#B08D46' : '#8C897C' }}>{hub.minting}</td>
                  <td style={{ padding: '14px 24px', minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: '#F1EFE8', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#B08D46' : pct >= 75 ? '#4C7A6E' : '#D6D3C6', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#5C5A50', fontWeight: 600, width: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DashboardScreen({ role, onNavigate }: DashboardProps) {
  if (role === 'trade-tester') return <TradeTesterDashboard onNavigate={onNavigate} />
  if (role === 'center-superintendent') return <CenterSuperDashboard onNavigate={onNavigate} />
  return <SuperAdminDashboard />
}
