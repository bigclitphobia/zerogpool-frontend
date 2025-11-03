import React, { useEffect, useRef, useState } from 'react'
import {
  useConnectWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
} from '@privy-io/react-auth'
import zeroGLogo from '../assets/OG.png'
import kultGameLogo from '../assets/kultLogo.png'
import MyLogo from '../assets/logo.png'

type LoginModalProps = {
  open: boolean
  onClose: () => void
  // Backward compat: if provided, used as center logo
  logoSrc?: string
  leftLogoSrc?: string
  centerLogoSrc?: string
  rightLogoSrc?: string
}

const WalletIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.75 7.5h13.5a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.75a2.25 2.25 0 0 1 2.25-2.25Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M18.75 12.75h-2.25a1.5 1.5 0 1 0 0 3h2.25a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z"
      fill="currentColor"
    />
    <path d="M17.25 5.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M23.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.6-1.3 3-2.7 3.9v3.2h4.4c2.6-2.3 4.1-5.6 4.1-9.2z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.6 0 6.6-1.2 8.8-3.2l-4.4-3.2c-1.2.8-2.7 1.3-4.4 1.3-3.4 0-6.2-2.3-7.2-5.3H.2v3.3C2.3 21.3 6.8 24 12 24z"
    />
    <path fill="#FBBC05" d="M4.8 13.6c-.3-1-.3-2 0-3V7.3H.2C-1 9.6-1 12.4.2 14.7l4.6-1.1z" />
    <path
      fill="#EA4335"
      d="M12 4.7c1.9 0 3.6.7 4.9 1.9l3.7-3.7C18.6 1 15.6 0 12 0 6.8 0 2.3 2.7.2 7.3l4.6 3.3C5.8 7.1 8.6 4.7 12 4.7z"
    />
  </svg>
)

export default function LoginModal({
  open,
  onClose,
  logoSrc,
  leftLogoSrc = kultGameLogo,
  centerLogoSrc = MyLogo,
  rightLogoSrc = zeroGLogo,
}: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailStep, setEmailStep] = useState<'enter-email' | 'enter-code'>('enter-email')
  const [error, setError] = useState('')

  // Ensure a canonical embedded wallet exists for the user
  const { connectOrCreateWallet } = usePrivy()

  const { connectWallet } = useConnectWallet({
    onSuccess: async () => {
      try {
        await connectOrCreateWallet()
      } catch (err) {
        console.warn('connectOrCreateWallet (external) failed:', err)
      }
      onClose?.()
    },
    onError: (err: any) =>
      setError((err?.message ?? err?.code ?? String(err)) || 'Failed to connect wallet'),
  })

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: async () => {
      try {
        await connectOrCreateWallet()
      } catch (err: any) {
        console.warn('connectOrCreateWallet (oauth) failed:', err)
      }
      onClose?.()
    },
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'OAuth error'),
  })

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: async () => {
      try {
        await connectOrCreateWallet()
      } catch (err: any) {
        console.warn('connectOrCreateWallet (email) failed:', err)
      }
      onClose?.()
    },
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'Email login error'),
  })

  useEffect(() => {
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
    return () => {
      try {
        if (dialogRef.current?.open) dialogRef.current.close()
      } catch {}
    }
  }, [open])

  const handleConnectWallet = () => {
    try {
      if (dialogRef.current?.open) dialogRef.current.close()
    } catch {}
    onClose?.()
    setTimeout(() => {
      try {
        connectWallet({
          walletList: [
            'detected_ethereum_wallets',
            'metamask',
            'coinbase_wallet',
            'rainbow',
            'zerion',
            'okx_wallet',
            'wallet_connect',
            'wallet_connect_qr',
          ],
          walletChainType: 'ethereum-only',
        })
      } catch (err: any) {
        console.error('connectWallet error', err)
        setError(err?.message || 'Failed to connect wallet')
      }
    }, 50)
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
      // connectOrCreateWallet handled in the hook's onComplete
    } catch (err: any) {
      setError(err?.message || 'Invalid code')
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="fixed inset-0 z-50 m-auto w-[92vw] max-w-[500px] max-h-[92dvh] overflow-visible rounded-2xl border border-white/10 bg-[rgba(10,16,34,0.70)] shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-0"
    >
      {open && leftLogoSrc && (
        <img
          src={leftLogoSrc}
          alt="Left logo"
          className="fixed left-3 top-3 z-[60] w-30 m-3 rounded-md border border-[#222] object-contain pointer-events-none"
        />
      )}
      {open && rightLogoSrc && (
        <img
          src={rightLogoSrc}
          alt="Right logo"
          className="fixed right-3 top-3 z-[60] w-24 m-3 rounded-md border border-[#222] object-contain pointer-events-none"
        />
      )}
      <div className="relative p-6 pt-10 md:pt-10 text-[#EAF6FF] bg-gradient-to-b from-[rgba(10,16,34,0.75)] to-[rgba(8,16,34,0.45)]">
        {(centerLogoSrc ?? logoSrc) && (
          <img
            src={centerLogoSrc ?? logoSrc!}
            alt="Center logo"
            className="absolute left-1/2 -top-8 md:-top-10 -translate-x-1/2 z-20 w-26 md:w-34 rounded-xl border border-[#222] object-contain"
          />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-2 text-2xl leading-none text-slate-300 hover:text-white bg-transparent p-0 appearance-none focus:outline-none focus:ring-0 active:outline-none select-none"
        >
          ×
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-400/10 to-transparent pt-8 pb-5 text-center mb-3">
          <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(900px_220px_at_50%_-20%,rgba(34,193,241,0.25),transparent)]" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(0,160,255,0.35)]">
              WELCOME
            </h2>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>

        {error && (
          <div className="my-2 rounded-lg bg-[#2a0e0e] px-3 py-2 text-sm text-[#ffd8d8]">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <form
            className="grid gap-3"
            onSubmit={emailStep === 'enter-email' ? onEmailSubmit : onCodeSubmit}
          >
            {emailStep === 'enter-email' ? (
              <>
                <label className="grid gap-2">
                  <span className="text-sm text-white/70">Email address</span>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white/95 placeholder-white/40 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-white/30 transition"
                  />
                </label>
                <div className="mt-1">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-fuchsia-400/50 bg-gradient-to-tr from-fuchsia-500 to-violet-500 px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(217,70,239,0.35)] hover:shadow-[0_14px_34px_rgba(217,70,239,0.45)] active:scale-[.98] disabled:opacity-60"
                    disabled={
                      emailState.status === 'sending-code' ||
                      emailState.status === 'submitting-code'
                    }
                  >
                    {emailState.status === 'sending-code' ? 'Sending…' : 'Send code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="grid gap-2">
                  <span className="text-sm text-[#9CB9D0]">Enter 6-digit code</span>
                  <input
                    type="text"
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-base text-[#EAF6FF] outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <small className="mt-1 text-xs text-[#9CB9D0]">
                    Didn’t get it? Check spam or resend after a moment.
                  </small>
                </label>
                <div className="mt-1 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setEmailStep('enter-email')
                    }}
                    className="rounded-xl border border-transparent px-3 py-2.5 text-[#9CB9D0] hover:text-white"
                  >
                    Edit email
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl border border-fuchsia-400/50 bg-gradient-to-tr from-fuchsia-500 to-violet-500 px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(217,70,239,0.35)] hover:shadow-[0_14px_34px_rgba(217,70,239,0.45)] active:scale-[.98] disabled:opacity-60"
                    disabled={
                      emailState.status === 'submitting-code' ||
                      emailState.status === 'sending-code'
                    }
                  >
                    {emailState.status === 'submitting-code' ? 'Verifying…' : 'Verify & continue'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="my-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[#9CB9D0]">
            <span className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="text-xs">or</span>
            <span className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>

          <div className="grid gap-2">
            <button
              className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/50 bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 px-4 py-3 font-bold text-white shadow-[0_10px_28px_rgba(16,185,129,0.35)] hover:shadow-[0_14px_34px_rgba(16,185,129,0.45)] active:scale-[.98] transition"
              onClick={handleConnectWallet}
            >
              <span className="mr-2 inline-flex items-center">
                <WalletIcon />
              </span>
              <span>Connect Wallet</span>
            </button>
            <button
              className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white/95 hover:bg-white/10 disabled:opacity-50"
              disabled={oauthLoading}
              onClick={() => initOAuth({ provider: 'google' })}
              aria-label="Continue with Google"
            >
              <GoogleIcon />
              <span className="ml-2">Google</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

