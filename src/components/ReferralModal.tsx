import React, { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { generateReferralCode } from '../lib/api'

type ReferralModalProps = {
  open: boolean
  onClose: () => void
}

const ReferralModal: React.FC<ReferralModalProps> = ({ open, onClose }) => {
  const dialogRef = React.useRef<HTMLDialogElement | null>(null)
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const walletAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!w.address)?.address

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!open) {
      setReferralCode(null)
      setError(null)
      setCopied(false)
    }
  }, [open])

  const handleGenerateReferral = async () => {
    if (!walletAddress) {
      setError('No wallet connected')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Optional: Add wallet signature here if needed
      // For now, we'll skip the signature as per user's request
      
      const response = await generateReferralCode(walletAddress)
      setReferralCode(response.referralCode)
    } catch (err: any) {
      setError(err?.message || 'Failed to generate referral code')
    } finally {
      setLoading(false)
    }
  }

  const referralLink = referralCode 
    ? `${window.location.origin}?ref=${referralCode}` 
    : ''

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="fixed inset-0 z-50 m-auto w-[92vw] max-w-[500px] max-h-[92dvh] overflow-visible rounded-2xl border border-white/10 bg-[rgba(10,16,34,0.85)] shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 text-[#EAF6FF]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-2 text-2xl leading-none text-slate-300 hover:text-white"
        >
          ×
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-400/10 to-transparent pt-6 pb-4 text-center mb-4">
          <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(900px_220px_at_50%_-20%,rgba(34,193,241,0.25),transparent)]" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(0,160,255,0.35)]">
              REFERRAL PROGRAM
            </h2>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {!referralCode ? (
          <div className="space-y-4">
            <p className="text-white/80 text-sm text-center">
              Generate your unique referral code and share it with friends to earn rewards!
            </p>
            <button
              onClick={handleGenerateReferral}
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-2xl border border-cyan-400/50 bg-gradient-to-tr from-cyan-500 to-blue-500 px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(0,178,255,0.35)] hover:shadow-[0_14px_34px_rgba(0,178,255,0.45)] active:scale-[.98] disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate Referral Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs text-white/60 mb-2">Your Referral Code</label>
              <div className="text-2xl font-mono font-bold text-cyan-300 text-center tracking-wider">
                {referralCode}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs text-white/60 mb-2">Referral Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:brightness-110 active:scale-95"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <p className="text-xs text-white/60 text-center">
              Share this link on social media to invite your friends!
            </p>
          </div>
        )}
      </div>
    </dialog>
  )
}

export default ReferralModal