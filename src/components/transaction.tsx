// BuyTokenButton.tsx
import React, { useState } from 'react'
import {
  usePrivy,
  useWallets,
  useSendTransaction,
} from '@privy-io/react-auth'

/* =========================================
 *  CHAIN + TOKEN CONSTANTS (edit here)
 *  You can wire these to .env so changing chains is easy
 * =======================================*/

export const CHAIN_CONFIG = {
  // CAIP-2 format for EVM chains
  caip2: (import.meta.env.VITE_CHAIN_CAIP2 as string) || 'eip155:16661', // 0G mainnet by default
  // Normal numeric chain ID
  decimalChainId: Number(import.meta.env.VITE_CHAIN_ID || '16661'),
  // Hex chain ID (used by window.ethereum)
  hexChainId: (import.meta.env.VITE_CHAIN_ID_HEX as string) || '0x4115',
  // Symbol shown to users
  nativeSymbol: (import.meta.env.VITE_CHAIN_SYMBOL as string) || 'OG',
  // Optional: used to build tx link in the success state
  blockExplorerTxBaseUrl:
    (import.meta.env.VITE_CHAIN_EXPLORER_TX_BASE as string) ||
    'https://chainscan.0g.ai/tx/',
}

// How many decimals your native token uses (18 for ETH / most EVM chains)
export const TOKEN_DECIMALS = Number(
  import.meta.env.VITE_CHAIN_TOKEN_DECIMALS || '18',
)

/* =========================================
 *  HELPERS
 * =======================================*/

/**
 * Convert a human-readable amount (e.g. "10.5") into a hex wei string.
 * No external libraries so this is easy to move around.
 */
export function toWeiHex(
  amount: string,
  decimals: number = TOKEN_DECIMALS,
): `0x${string}` {
  const trimmed = amount.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Invalid amount format')
  }

  const [whole, fracRaw = ''] = trimmed.split('.')
  const frac = fracRaw.slice(0, decimals).padEnd(decimals, '0')

  const wei = BigInt(whole + frac)
  if (wei <= 0n) {
    throw new Error('Amount must be greater than zero')
  }

  return `0x${wei.toString(16)}` as const
}

/* =========================================
 *  TYPES
 * =======================================*/

export type BuyTokenButtonProps = {
  /** Where the funds go (treasury / contract address) */
  recipientAddress: string
  /** Symbol to show in UI. Defaults to CHAIN_CONFIG.nativeSymbol */
  symbol?: string
  /** Default amount shown + used when user opens the modal */
  defaultAmountEth?: string
  /** Optional extra label for the main button */
  buttonLabel?: string
  /** Optional extra className for the main button so you control design */
  className?: string
  /** Called after tx is broadcast successfully */
  onSuccess?: (hash: string) => void
  /** Called if tx fails or user rejects */
  onError?: (error: Error) => void
}

/* =========================================
 *  MAIN COMPONENT
 * =======================================*/

export const BuyTokenButton: React.FC<BuyTokenButtonProps> = ({
  recipientAddress,
  symbol = CHAIN_CONFIG.nativeSymbol,
  defaultAmountEth = '10',
  buttonLabel,
  className = '',
  onSuccess,
  onError,
}) => {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const { sendTransaction } = useSendTransaction()

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(defaultAmountEth)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canTransact = ready && authenticated && wallets && wallets.length > 0

  const mainLabel =
    buttonLabel || `Buy ${defaultAmountEth} ${symbol || CHAIN_CONFIG.nativeSymbol}`

  const handleOpenClick = () => {
    setError(null)
    setTxHash(null)
    setAmount(defaultAmountEth)

    if (!ready) {
      setError('Wallet is still loading, please wait.')
      setOpen(true)
      return
    }

    if (!authenticated || !wallets?.length) {
      setError('Please log in and create / connect a wallet first.')
      setOpen(true)
      return
    }

    setOpen(true)
  }

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
  }

  const handleConfirm = async () => {
    if (!canTransact) {
      setError('You must be logged in with an active wallet to send a transaction.')
      return
    }

    const activeWallet = wallets[0] // customize this selection logic if you like

    try {
      setSubmitting(true)
      setError(null)
      setTxHash(null)

      const value = toWeiHex(amount)

      const { hash } = await sendTransaction(
        {
          to: recipientAddress,
          value,
          // This makes it explicit we are sending on the 0G (or configured) chain
          chainId: CHAIN_CONFIG.decimalChainId,
        },
        {
          address: activeWallet.address,
          uiOptions: {
            // Hide Privy’s default UIs so only YOUR modal design is visible
            showWalletUIs: false,
          },
        },
      ) // :contentReference[oaicite:0]{index=0}

      setTxHash(hash)
      onSuccess?.(hash)
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(e?.message || 'Transaction failed')
      setError(err.message)
      onError?.(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* You can completely control this button's styling via className */}
      <button
        type="button"
        onClick={handleOpenClick}
        disabled={!ready || submitting}
        className={
          className ||
          'inline-flex items-center justify-center rounded-2xl border border-emerald-400/60 bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 px-5 py-3 font-bold text-white shadow-[0_10px_28px_rgba(16,185,129,0.35)] hover:shadow-[0_14px_34px_rgba(16,185,129,0.45)] active:scale-[.98] disabled:opacity-60'
        }
      >
        {mainLabel}
      </button>

      {/* Custom tx modal – your design, no Privy modal here */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-400/60 bg-[rgba(24,16,8,0.96)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-100">
                Confirm {symbol} Purchase
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-2xl leading-none text-amber-100/70 hover:text-amber-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm text-amber-50/90">
              {!canTransact && (
                <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-50">
                  You’re not logged in or don’t have a wallet yet. Use your login flow
                  first.
                </div>
              )}

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                Network:&nbsp;
                <span className="font-semibold">
                  {CHAIN_CONFIG.nativeSymbol} ({CHAIN_CONFIG.caip2})
                </span>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs text-amber-100/80">
                  Amount ({symbol})
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-amber-50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
                  disabled={submitting}
                />
              </label>

              <div className="text-xs text-amber-100/80">
                Recipient:
                <div className="mt-0.5 break-all font-mono text-[11px] text-amber-50">
                  {recipientAddress}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/50 bg-red-900/60 px-3 py-2 text-xs text-red-50">
                  {error}
                </div>
              )}

              {txHash && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-50">
                  Transaction sent!
                  <br />
                  Hash:
                  <span className="ml-1 break-all font-mono text-[11px]">
                    {txHash}
                  </span>
                  {CHAIN_CONFIG.blockExplorerTxBaseUrl && (
                    <div className="mt-1">
                      <a
                        href={`${CHAIN_CONFIG.blockExplorerTxBaseUrl}${txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300 underline underline-offset-2"
                      >
                        View on explorer
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-xl border border-transparent px-3 py-2 text-xs font-medium text-amber-100/80 hover:text-amber-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canTransact || submitting}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/60 bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(16,185,129,0.35)] active:scale-[.98] disabled:opacity-60"
              >
                {submitting ? 'Sending…' : `Confirm ${symbol} purchase`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BuyTokenButton
