import { useState, useRef, useEffect } from 'react'

interface MFAScreenProps {
  onSuccess: () => void
  onBack: () => void
}

type MFAState = 'default' | 'loading' | 'invalid' | 'expired' | 'too-many' | 'success'

export default function MFAScreen({ onSuccess, onBack }: MFAScreenProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [state, setState] = useState<MFAState>('default')
  const [countdown, setCountdown] = useState(120)
  const [showBackup, setShowBackup] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [backupError, setBackupError] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  function handleDigit(i: number, val: string) {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    setState('default')
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      refs.current[5]?.focus()
    }
  }

  async function handleVerify() {
    const code = digits.join('')
    if (code.length < 6) return
    setState('loading')
    await new Promise(r => setTimeout(r, 1000))
    if (code === '123456') {
      setState('success')
      setTimeout(onSuccess, 800)
    } else if (code === '000000') {
      setState('expired')
    } else {
      setState('invalid')
    }
  }

  function handleResend() {
    if (countdown > 0) return
    setCountdown(120)
    setDigits(['', '', '', '', '', ''])
    setState('default')
    refs.current[0]?.focus()
  }

  async function handleBackupVerify() {
    if (!backupCode.trim()) { setBackupError('Please enter your backup code.'); return }
    setBackupError('')
    await new Promise(r => setTimeout(r, 800))
    if (backupCode.trim() === 'BACKUP-1234-5678') {
      onSuccess()
    } else {
      setBackupError('Invalid or already-used backup code. Please check and try again.')
    }
  }

  const code = digits.join('')
  const minutes = Math.floor(countdown / 60).toString().padStart(2, '0')
  const secs = (countdown % 60).toString().padStart(2, '0')

  const stateMessages: Record<string, { bg: string; border: string; text: string; color: string }> = {
    invalid: { bg: '#FCEBEB', border: '#A6453D', text: 'Incorrect verification code. Please try again.', color: '#501313' },
    expired: { bg: '#FCE8D6', border: '#B08D46', text: 'This code has expired. Please request a new one.', color: '#5C3300' },
    'too-many': { bg: '#FCEBEB', border: '#A6453D', text: 'Too many failed attempts. Please wait before trying again.', color: '#501313' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F0EA', display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: 56, background: '#24302E', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#B08D46', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>National Skills Passport</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}> — </span>
            <span style={{ color: '#B08D46', fontSize: 13, fontWeight: 500 }}>Issuer Portal</span>
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>NAVTTC · Pakistan</span>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 40 }}>
            {/* Icon */}
            <div style={{ width: 52, height: 52, background: '#E4EEFC', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E6FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
              </svg>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#24302E', margin: '0 0 6px' }}>Verify your identity</h1>
            <p style={{ fontSize: 14, color: '#5C5A50', margin: '0 0 28px', lineHeight: 1.6 }}>
              Enter the 6-digit code from your authenticator app. This code expires in {minutes}:{secs}.
            </p>

            {state in stateMessages && (
              <div style={{ background: stateMessages[state].bg, border: `1px solid ${stateMessages[state].border}`, borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: stateMessages[state].color }}>
                {stateMessages[state].text}
              </div>
            )}

            {state === 'success' && (
              <div style={{ background: '#EAF3DE', border: '1px solid #4C7A6E', borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#173404', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4C7A6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Identity verified. Redirecting to dashboard…
              </div>
            )}

            {/* OTP inputs */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={state === 'loading' || state === 'success' || state === 'too-many'}
                  style={{
                    borderColor: state === 'invalid' ? '#A6453D' : state === 'success' ? '#4C7A6E' : '#D6D3C6',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={code.length < 6 || state === 'loading' || state === 'success' || state === 'too-many'}
              style={{
                width: '100%', height: 40, background: code.length < 6 || state === 'loading' ? '#5C5A50' : '#4C7A6E',
                color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: code.length < 6 || state === 'loading' ? 'not-allowed' : 'pointer', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {state === 'loading' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Verifying…
                </>
              ) : 'Verify'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 16 }}>
              <button
                onClick={handleResend}
                disabled={countdown > 0}
                style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer', color: countdown > 0 ? '#8C897C' : '#4C7A6E', fontWeight: 500, padding: 0, fontSize: 13 }}
              >
                {countdown > 0 ? `Resend code in ${minutes}:${secs}` : 'Resend code'}
              </button>
              <button onClick={() => setShowBackup(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4C7A6E', fontWeight: 500, padding: 0, fontSize: 13 }}>
                Use backup code
              </button>
            </div>

            <div style={{ borderTop: '1px solid #D6D3C6', paddingTop: 16 }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C5A50', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Back to login
              </button>
            </div>

            <p style={{ marginTop: 16, fontSize: 11, color: '#8C897C', textAlign: 'center' }}>
              Demo: enter <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>123456</code> to proceed
            </p>
          </div>
        </div>
      </div>

      {/* Backup Code Modal */}
      {showBackup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(36,48,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #D6D3C6', borderRadius: 8, padding: 32, maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#24302E', margin: '0 0 8px' }}>Use Backup Code</h2>
            <p style={{ fontSize: 13, color: '#5C5A50', margin: '0 0 20px', lineHeight: 1.6 }}>
              Enter one of your backup codes. Each code can only be used once and will be invalidated after use.
            </p>

            <div style={{ background: '#FCE8D6', border: '1px solid #F5C89A', borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#5C3300', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B08D46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Backup codes are single-use. Using this code will permanently invalidate it.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#24302E', marginBottom: 6 }}>Backup Code</label>
              <input
                type="text"
                value={backupCode}
                onChange={e => { setBackupCode(e.target.value); setBackupError('') }}
                placeholder="XXXXX-XXXX-XXXX"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${backupError ? '#A6453D' : '#D6D3C6'}`, borderRadius: 6, fontSize: 14, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 1, color: '#24302E', background: '#fff' }}
              />
              {backupError && <p style={{ fontSize: 12, color: '#A6453D', margin: '4px 0 0' }}>{backupError}</p>}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleBackupVerify} style={{ flex: 1, height: 40, background: '#4C7A6E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Verify Backup Code
              </button>
              <button onClick={() => { setShowBackup(false); setBackupCode(''); setBackupError('') }} style={{ height: 40, padding: '0 20px', background: '#fff', color: '#24302E', border: '1px solid #D6D3C6', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>

            <p style={{ marginTop: 12, fontSize: 11, color: '#8C897C', textAlign: 'center' }}>
              Demo backup code: <code style={{ fontFamily: 'IBM Plex Mono, monospace' }}>BACKUP-1234-5678</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
