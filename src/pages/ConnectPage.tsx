import { Link } from 'react-router-dom'
import { useWallet } from '../components/WalletContext'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useState } from 'react'
import LoginModal from '../components/LoginModal'
import { useEffect } from 'react'

const ConnectPage = () => {
  const { isConnected } = useWallet()
  const { authenticated, logout, user, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const [open, setOpen] = useState(false)

  // Log useful auth details after a successful connection
  useEffect(() => {
    if (!authenticated || !user) return
    try {
      console.groupCollapsed('[Privy] Authenticated user')
      console.log('User:', user)
      // Embedded wallet (if configured to auto-create)
      const embedded = (user as any)?.wallet
      if (embedded) {
        console.log('Embedded wallet:', {
          address: embedded.address,
          chainType: embedded.chainType,
          walletClientType: embedded.walletClientType,
        })
      }
      // Linked external wallets from the user object
      const linked = ((user as any)?.linkedAccounts || []).filter((a: any) => a.type === 'wallet')
      if (linked.length) {
        console.log('Linked wallets (from user):', linked.map((w: any) => ({
          address: w.address,
          chainType: w.chainType,
          walletClientType: w.walletClientType,
        })))
      }
      if (wallets && wallets.length) {
        console.log('Connected wallets:', wallets.map(w => ({
          type: w.walletClientType,
          address: (w as any).address,
          chainType: (w as any).chainType,
        })))
      } else {
        console.log('No external wallets connected (may be embedded only)')
      }
      console.groupEnd()
    } catch {}

    // If you also want to inspect the JWT, uncomment:
    // getAccessToken().then(token => console.log('[Privy] Access token (JWT):', token))
  }, [authenticated, user, wallets, getAccessToken])

  // Also log external wallets when they are connected (even before full auth)
  useEffect(() => {
    if (!wallets?.length) return
    try {
      console.groupCollapsed('[Privy] External wallet(s) connected')
      console.log(wallets.map(w => ({
        type: w.walletClientType,
        address: (w as any).address,
        chainType: (w as any).chainType,
      })))
      // Tip: to complete login with external wallet: wallets[0]?.loginOrLink?.()
      console.groupEnd()
    } catch {}
  }, [wallets])

  return (
    <div className="w-full flex justify-center px-4 pt-4 sm:pt-6 align-center">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl bg-black/40 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-cyan-200 mb-4">
            {isConnected ? 'Connected' : 'Connect'}
          </h1>

          {!authenticated ? (
            <>
              <p className="text-neutral-200/90 mb-6">Connect to start playing and track your progress.</p>
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_6px_20px_rgba(0,178,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,178,255,0.7)] transition"
              >
                Connect
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span className="text-neutral-100 font-medium">You are connected</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition border border-white/15"
                >
                  Disconnect
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_6px_20px_rgba(0,178,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,178,255,0.7)] transition"
                >
                  Go Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default ConnectPage
