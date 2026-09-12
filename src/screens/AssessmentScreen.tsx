import { useState } from 'react'

interface Criterion {
  id: number
  label: string
  max: number
  score: string
}

const CRITERIA: Criterion[] = [
  { id: 1, label: 'Safety Practices & PPE Compliance', max: 20, score: '' },
  { id: 2, label: 'Tool & Equipment Handling', max: 20, score: '' },
  { id: 3, label: 'Technical Knowledge (Theory)', max: 25, score: '' },
  { id: 4, label: 'Practical Task Execution', max: 25, score: '' },
  { id: 5, label: 'Work Quality & Finishing', max: 10, score: '' },
]

const DEMO_CANDIDATES = [
  { name: 'Muhammad Aamir Khan', cnic: '35202-1234567-1', trade: 'Electrician', hub: 'Lahore-C01', photo: null },
  { name: 'Sara Bibi', cnic: '35201-9876543-2', trade: 'Plumbing', hub: 'Lahore-C01', photo: null },
  { name: 'Ali Nawaz', cnic: '35202-5551234-3', trade: 'Welding', hub: 'Lahore-C01', photo: null },
  { name: 'Rabia Qureshi', cnic: '35203-7778889-4', trade: 'Masonry', hub: 'Lahore-C01', photo: null },
]

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(36,48,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 32, maxWidth: 500, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        {children}
      </div>
    </div>
  )
}

function getGrade(pct: number) {
  if (pct >= 85) return { label: 'Distinction', color: '#4C7A6E' }
  if (pct >= 70) return { label: 'Pass', color: '#1A4DB8' }
  if (pct >= 50) return { label: 'Marginal Pass', color: '#8C6F35' }
  return { label: 'Fail', color: '#A6453D' }
}

const GRADE_PILL: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 12px', height: 32, background: '#E4E2D9', borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }

export default function AssessmentScreen() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof DEMO_CANDIDATES[0] | null>(null)
  const [criteria, setCriteria] = useState<Criterion[]>(CRITERIA.map(c => ({ ...c })))
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [offlineBanner, setOfflineBanner] = useState<'none' | 'offline' | 'syncing' | 'synced'>('none')
  const [attachments, setAttachments] = useState<string[]>([])

  const filtered = DEMO_CANDIDATES.filter(
    c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.cnic.includes(search)
  )

  const totalMax = criteria.reduce((s, c) => s + c.max, 0)
  const totalScore = criteria.reduce((s, c) => s + (parseInt(c.score) || 0), 0)
  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const grade = getGrade(pct)

  function updateScore(id: number, val: string) {
    setCriteria(cs => cs.map(c => {
      if (c.id !== id) return c
      const n = parseInt(val)
      if (val === '') return { ...c, score: '' }
      if (!isNaN(n) && n >= 0 && n <= c.max) return { ...c, score: val }
      return c
    }))
  }

  function handleConfirmSubmit() {
    setStatus('submitted')
    setShowSubmitModal(false)
  }

  return (
    <div>
      {/* Offline banner */}
      {offlineBanner !== 'none' && (
        <div style={{ background: offlineBanner === 'offline' ? '#FCE8D6' : offlineBanner === 'syncing' ? '#E4EEFC' : '#EAF3DE', border: `1px solid ${offlineBanner === 'offline' ? '#B08D46' : offlineBanner === 'syncing' ? '#2E6FE0' : '#4C7A6E'}`, borderRadius: 6, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: offlineBanner === 'offline' ? '#B08D46' : offlineBanner === 'syncing' ? '#2E6FE0' : '#4C7A6E' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#24302E' }}>
              {offlineBanner === 'offline' ? 'Offline Mode' : offlineBanner === 'syncing' ? 'Syncing…' : 'Synchronized'}
            </span>
            <span style={{ fontSize: 13, color: '#5C5A50' }}>
              {offlineBanner === 'offline' ? '· 2 assessment records queued · Last sync: Today 09:12' : offlineBanner === 'syncing' ? '· Uploading 2 records…' : '· All records synchronized'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {offlineBanner !== 'synced' && (
              <button onClick={() => setOfflineBanner('syncing')} style={{ height: 30, padding: '0 12px', background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Sync Now
              </button>
            )}
            <button onClick={() => setOfflineBanner('none')} style={{ height: 30, padding: '0 12px', background: '#fff', color: '#24302E', border: '1px solid #D6D3C6', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 400, color: '#24302E', margin: '0 0 4px', letterSpacing: -0.2 }}>Score Entry</h1>
          <p style={{ fontSize: 14, color: '#5C5A50', margin: 0 }}>Search for a candidate and enter their assessment scores.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setOfflineBanner('offline')} style={{ height: 34, padding: '0 14px', background: '#fff', color: '#5C5A50', border: '1px solid #D6D3C6', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
            Preview Offline
          </button>
          {status === 'submitted' && (
            <span style={{ height: 34, padding: '0 14px', background: '#EAF3DE', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#173404', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#4C7A6E" /><polyline points="3,6 5,8.5 9,3.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Submitted
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 24 }}>
        {/* Candidate Lookup */}
        <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #D6D3C6' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: '0 0 12px' }}>Candidate Lookup</h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or CNIC…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D6D3C6', borderRadius: 6, fontSize: 13, background: '#F1F0EA', color: '#24302E', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div>
            {filtered.map((c, i) => (
              <button
                key={i}
                onClick={() => { setSelected(c); setCriteria(CRITERIA.map(cr => ({ ...cr }))); setStatus('draft') }}
                style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: selected?.cnic === c.cnic ? '#F0F7FF' : 'transparent', border: 'none', borderBottom: '1px solid #F1EFE8', cursor: 'pointer', borderLeft: selected?.cnic === c.cnic ? '3px solid #4C7A6E' : '3px solid transparent' }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#24302E', marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#8C897C', fontFamily: 'IBM Plex Mono, monospace' }}>{c.cnic}</div>
                <div style={{ fontSize: 12, color: '#5C5A50', marginTop: 2 }}>{c.trade} · {c.hub}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#8C897C' }}>No candidates found.</div>
            )}
          </div>
        </div>

        {/* Assessment form */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Candidate summary */}
            <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 56, height: 56, background: '#F1EFE8', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8C897C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#24302E' }}>{selected.name}</div>
                <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#8C897C' }}>CNIC: <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#5C5A50' }}>{selected.cnic}</span></span>
                  <span style={{ fontSize: 12, color: '#8C897C' }}>Trade: <span style={{ color: '#5C5A50' }}>{selected.trade}</span></span>
                  <span style={{ fontSize: 12, color: '#8C897C' }}>Hub: <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#5C5A50' }}>{selected.hub}</span></span>
                </div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px', background: status === 'submitted' ? '#EAF3DE' : '#F1EFE8', borderRadius: 999, fontSize: 12, fontWeight: 600, color: status === 'submitted' ? '#173404' : '#5C5A50' }}>
                {status === 'submitted' ? 'Submitted' : 'Draft'}
              </span>
            </div>

            {/* Score entry */}
            <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8 }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #D6D3C6' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: 0 }}>Assessment Criteria</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F1F0EA' }}>
                    {['Criteria', 'Maximum Score', 'Score Achieved', 'Percentage'].map(h => (
                      <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#5C5A50', borderBottom: '1px solid #D6D3C6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteria.map(c => {
                    const s = parseInt(c.score) || 0
                    const p = c.score ? Math.round((s / c.max) * 100) : null
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F1EFE8' }}>
                        <td style={{ padding: '12px 24px', fontSize: 14, color: '#24302E' }}>{c.label}</td>
                        <td style={{ padding: '12px 24px', fontSize: 14, color: '#8C897C', fontFamily: 'IBM Plex Mono, monospace' }}>{c.max}</td>
                        <td style={{ padding: '12px 24px' }}>
                          <input
                            type="number"
                            min={0}
                            max={c.max}
                            value={c.score}
                            onChange={e => updateScore(c.id, e.target.value)}
                            disabled={status === 'submitted'}
                            placeholder="—"
                            style={{ width: 72, padding: '6px 10px', border: '1px solid #D6D3C6', borderRadius: 4, fontSize: 14, textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', background: status === 'submitted' ? '#F1F0EA' : '#fff', color: '#24302E' }}
                          />
                        </td>
                        <td style={{ padding: '12px 24px', fontSize: 13, color: p !== null ? (p >= 70 ? '#173404' : p >= 50 ? '#5C3300' : '#501313') : '#8C897C', fontWeight: p !== null ? 600 : 400 }}>
                          {p !== null ? `${p}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F1F0EA', borderTop: '2px solid #D6D3C6' }}>
                    <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 700, color: '#24302E' }}>Total</td>
                    <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: '#8C897C', fontFamily: 'IBM Plex Mono, monospace' }}>{totalMax}</td>
                    <td style={{ padding: '14px 24px', fontSize: 16, fontWeight: 700, color: '#4C7A6E', fontFamily: 'IBM Plex Mono, monospace' }}>{totalScore}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#4C7A6E' }}>{pct}%</span>
                        {totalScore > 0 && (
                          <span style={{ ...GRADE_PILL, color: grade.color }}>{grade.label}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Evidence */}
            <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#24302E', margin: '0 0 16px' }}>Evidence & Attachments</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                {attachments.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#F1F0EA', border: '1px solid #D6D3C6', borderRadius: 4, fontSize: 13 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C5A50" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span style={{ color: '#5C5A50' }}>{a}</span>
                    <button onClick={() => setAttachments(att => att.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C897C', padding: 0, display: 'flex' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
                <button onClick={() => setAttachments(a => [...a, `evidence_${a.length + 1}.jpg`])} disabled={status === 'submitted'} style={{ height: 32, padding: '0 14px', background: '#fff', color: '#4C7A6E', border: '1px dashed #4C7A6E', borderRadius: 4, fontSize: 13, cursor: status === 'submitted' ? 'not-allowed' : 'pointer' }}>
                  + Add Attachment
                </button>
              </div>
            </div>

            {/* Actions */}
            {status !== 'submitted' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowSubmitModal(true)} style={{ height: 40, padding: '0 24px', background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Submit for Approval
                </button>
                <button style={{ height: 40, padding: '0 24px', background: '#fff', color: '#24302E', border: '1px solid #D6D3C6', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
                  Save Draft
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 64 }}>
            <div style={{ textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D6D3C6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#24302E', marginBottom: 4 }}>Select a Candidate</div>
              <div style={{ fontSize: 13, color: '#8C897C' }}>Search and select a candidate to begin score entry.</div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && selected && (
        <ModalOverlay>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#24302E', margin: '0 0 8px' }}>Send for Approval?</h2>
          <p style={{ fontSize: 13, color: '#5C5A50', margin: '0 0 20px', lineHeight: 1.6 }}>
            This will change the assessment status from <strong>Draft</strong> to <strong>Submitted</strong> and send it to the Center Superintendent for review. This action cannot be undone.
          </p>

          <div style={{ background: '#F1F0EA', border: '1px solid #D6D3C6', borderRadius: 6, padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
              <div><div style={{ color: '#8C897C', marginBottom: 2 }}>Candidate</div><div style={{ color: '#24302E', fontWeight: 600 }}>{selected.name}</div></div>
              <div><div style={{ color: '#8C897C', marginBottom: 2 }}>Trade</div><div style={{ color: '#24302E' }}>{selected.trade}</div></div>
              <div><div style={{ color: '#8C897C', marginBottom: 2 }}>Total Score</div><div style={{ color: '#4C7A6E', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>{totalScore} / {totalMax} ({pct}%)</div></div>
              <div><div style={{ color: '#8C897C', marginBottom: 2 }}>Grade</div><span style={{ ...GRADE_PILL, color: grade.color }}>{grade.label}</span></div>
              <div><div style={{ color: '#8C897C', marginBottom: 2 }}>Current Status</div><span style={{ ...GRADE_PILL, color: '#5C5A50' }}>Draft</span></div>
              <div><div style={{ color: '#8C897C', marginBottom: 2 }}>After Submission</div><span style={{ ...GRADE_PILL, color: '#1A4DB8' }}>In Review</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleConfirmSubmit} style={{ flex: 1, height: 40, background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Confirm & Submit
            </button>
            <button onClick={() => setShowSubmitModal(false)} style={{ height: 40, padding: '0 20px', background: '#fff', color: '#24302E', border: '1px solid #D6D3C6', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
