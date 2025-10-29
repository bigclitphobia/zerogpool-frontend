import React, { useEffect, useRef, useState } from 'react'
import { useConnectWallet, useLoginWithEmail, useLoginWithOAuth, usePrivy, useWallets } from '@privy-io/react-auth'

type LoginModalProps = {
  open: boolean
  onClose: () => void
  logoSrc?: string
}

const theme = {
  surface: '#101018',
  panel: '#141427',
  text: '#e7e7ef',
  subtext: '#a1a1b5',
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
}

const WalletIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.75 7.5h13.5a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.75a2.25 2.25 0 0 1 2.25-2.25Z" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M18.75 12.75h-2.25a1.5 1.5 0 1 0 0 3h2.25a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z" fill="currentColor"/>
    <path d="M17.25 5.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
)

export default function LoginModal({ open, onClose, logoSrc }: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [view, setView] = useState<'menu' | 'email'>('menu')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailStep, setEmailStep] = useState<'enter-email' | 'enter-code'>('enter-email')
  const [error, setError] = useState('')

  const { connectWallet } = useConnectWallet({
    onSuccess: () => onClose?.(),
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'Failed to connect wallet'),
  })
  const { connectOrCreateWallet } = usePrivy()
  const { wallets } = useWallets()

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: () => onClose?.(),
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'OAuth error'),
  })

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: () => onClose?.(),
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'Email login error'),
  })

  useEffect(() => {
    if (open) setView('menu')
    setError('')
    setEmail('')
    setCode('')
    setEmailStep('enter-email')
  }, [open])

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
    if (!open && dialogRef.current?.open) {
      dialogRef.current.close()
    }
    let styleTag: HTMLStyleElement | undefined
    if (typeof document !== 'undefined') {
      styleTag = document.createElement('style')
      styleTag.setAttribute('data-login-modal-backdrop', 'true')
      styleTag.innerHTML = `dialog::backdrop{background:rgba(10,10,18,.6);backdrop-filter:saturate(1.2) blur(4px);}`
      document.head.appendChild(styleTag)
    }
    return () => {
      if (styleTag && styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
    }
  }, [open])

  const handleConnectWallet = () => {
    try { if (dialogRef.current?.open) dialogRef.current.close() } catch {}
    onClose?.()
    setTimeout(() => { try { connectWallet() } catch {} }, 50)
  }

  const onEmailSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await sendCode({ email })
      setEmailStep('enter-code')
    } catch (err: any) {
      setError(err?.message || 'Failed to send code')
    }
  }

  const onCodeSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await loginWithCode({ code })
    } catch (err: any) {
      setError(err?.message || 'Invalid code')
    }
  }

  return (
    <dialog ref={dialogRef} style={styles.dialog as React.CSSProperties} onCancel={onClose}>
      <div style={styles.container as React.CSSProperties}>
        <button onClick={onClose} aria-label="Close" style={styles.close as React.CSSProperties}>×</button>

        <div style={styles.hero as React.CSSProperties}>
          <div style={styles.heroGlow as React.CSSProperties} />
          {logoSrc && <img src={logoSrc} alt="Logo" style={styles.logo as React.CSSProperties} />}
        </div>

        {error && <div style={styles.error as React.CSSProperties}>{error}</div>}

        {view === 'menu' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <button style={styles.primary as React.CSSProperties} onClick={handleConnectWallet}>
              <span style={styles.btnIcon as React.CSSProperties}><WalletIcon /></span>
              <span>Connect Wallet</span>
            </button>
            <button
              style={styles.primaryAlt as React.CSSProperties}
              onClick={() => connectOrCreateWallet()}
            >
              <span>Connect or create embedded wallet</span>
            </button>
            <button
              style={styles.primaryAlt as React.CSSProperties}
              disabled={!wallets?.length}
              onClick={() => wallets?.[0]?.loginOrLink?.()}
            >
              <span>Login with connected wallet</span>
            </button>
            <button style={styles.primaryAlt as React.CSSProperties} onClick={() => setView('email')}>
              <span>Email OTP</span>
            </button>

            <div style={styles.divider as React.CSSProperties}><span></span></div>

            <div style={styles.oauthRow as React.CSSProperties}>
              <button
                style={styles.oauth as React.CSSProperties}
                disabled={oauthLoading}
                onClick={() => initOAuth({ provider: 'google' })}
                aria-label="Continue with Google"
              >
                <span>Google</span>
              </button>
              <button
                style={styles.oauth as React.CSSProperties}
                disabled={oauthLoading}
                onClick={() => initOAuth({ provider: 'discord' })}
                aria-label="Continue with Discord"
              >
                <span>Discord</span>
              </button>
            </div>
          </div>
        )}

        {view === 'email' && (
          <form
            style={styles.form as React.CSSProperties}
            onSubmit={emailStep === 'enter-email' ? onEmailSubmit : onCodeSubmit}
          >
            {emailStep === 'enter-email' ? (
              <>
                <label style={styles.label as React.CSSProperties}>
                  <span style={styles.labelText as React.CSSProperties}>Email address</span>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input as React.CSSProperties}
                  />
                  <small style={styles.hint as React.CSSProperties}>We’ll email you a 6‑digit code.</small>
                </label>
                <div style={styles.actionsRow as React.CSSProperties}>
                  <button type="button" onClick={() => setView('menu')} style={styles.ghost as React.CSSProperties}>Back</button>
                  <button type="submit" style={styles.primary as React.CSSProperties} disabled={emailState.status === 'sending-code' || emailState.status === 'submitting-code'}>
                    {emailState.status === 'sending-code' ? 'Sending…' : 'Send code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label style={styles.label as React.CSSProperties}>
                  <span style={styles.labelText as React.CSSProperties}>Enter 6‑digit code</span>
                  <input
                    type="text"
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={styles.input as React.CSSProperties}
                  />
                  <small style={styles.hint as React.CSSProperties}>Didn’t get it? Check spam or resend after a moment.</small>
                </label>
                <div style={styles.actionsRow as React.CSSProperties}>
                  <button type="button" onClick={() => setEmailStep('enter-email')} style={styles.ghost as React.CSSProperties}>Edit email</button>
                  <button type="submit" style={styles.primary as React.CSSProperties} disabled={emailState.status === 'submitting-code' || emailState.status === 'sending-code'}>
                    {emailState.status === 'submitting-code' ? 'Verifying…' : 'Verify & continue'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </dialog>
  )
}

const styles = {
  dialog: {
    padding: 0,
    border: 'none',
    borderRadius: 16,
    maxWidth: 460,
    width: '92vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  container: {
    position: 'relative',
    padding: 20,
    background: theme.surface,
    color: theme.text,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    fontSize: 15,
    lineHeight: 1.45,
  },
  close: {
    position: 'absolute' as const,
    top: 10,
    right: 12,
    border: 'none',
    background: 'transparent',
    color: theme.subtext,
    fontSize: 24,
    lineHeight: '24px',
    cursor: 'pointer',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '26px 8px 18px',
    background: `linear-gradient(180deg, ${theme.panel}, transparent)` ,
    borderRadius: 12,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute' as const,
    inset: -60,
    background: `radial-gradient(800px 180px at 50% -20%, ${theme.primary}33, transparent)`,
  },
  logo: { width: 64, height: 64, objectFit: 'contain' as const, borderRadius: 12, border: '1px solid #222' },
  btnIcon: { display: 'inline-flex', alignItems: 'center', marginRight: 8 },
  primary: {
    padding: '14px 16px',
    borderRadius: 12,
    border: `1px solid ${theme.primaryDark}`,
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
    letterSpacing: 0.2,
    transition: 'transform .08s ease, box-shadow .2s ease',
  },
  primaryAlt: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #24243b',
    background: '#18182e',
    color: theme.text,
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform .08s ease, box-shadow .2s ease',
  },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: theme.subtext, margin: '8px 0' },
  oauthRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  oauth: {
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #24243b',
    background: '#0f0f1a',
    color: theme.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
  form: { display: 'grid', gap: 12, marginTop: 10 },
  label: { display: 'grid', gap: 8 },
  labelText: { fontSize: 13, color: theme.subtext },
  input: { padding: '12px 14px', borderRadius: 12, border: '1px solid #24243b', fontSize: 16, background: '#0f0f1a', color: theme.text, outline: `2px solid transparent`, boxShadow: 'inset 0 0 0 9999px rgba(255,255,255,0.01)' },
  actionsRow: { display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 },
  ghost: { padding: '10px 12px', borderRadius: 12, border: '1px solid transparent', background: 'transparent', color: theme.subtext, cursor: 'pointer' },
  error: { background: '#2a0e0e', color: '#ffd8d8', padding: '8px 10px', borderRadius: 10, margin: '8px 0', fontSize: 13 },
  hint: { marginTop: 6, color: theme.subtext, fontSize: 12 },
}
