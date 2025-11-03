// src/pages/ConnectPage.tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import connectWalletImg from '../assets/connectWallet.png'
import gameMannual from '../assets/gameMannual.png'

export default function HomePage() {
  const { authenticated, logout, user, login } = usePrivy()
  const { wallets } = useWallets()

  useEffect(() => {
    if (!authenticated || !user) return
    console.groupCollapsed('[Privy] Authenticated user')
    console.log('User:', user)
    console.log('Wallets:', wallets)
    console.groupEnd()
  }, [authenticated, user, wallets])

  return (
    <div className="w-full flex justify-center px-4 pt-8">
      <div className="max-w-xl w-full text-center">
        {!authenticated ? (
          <div className="flex flex-col items-center gap-3" />
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-white font-medium">You are connected</span>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => logout()}
                className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
              >
                Disconnect
              </button>
              <Link
                to="/"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
              >
                Go Home
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Floating bottom-centered actions for Home (all breakpoints) */}
      <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {!authenticated && (
            <button onClick={() => login()} aria-label="Connect Wallet" className="group">
              <img
                src={connectWalletImg}
                alt="Connect Wallet"
                className="w-[300px] h-[64px] sm:w-[340px] sm:h-[72px] md:w-[360px] md:h-[78px] object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-[1.02]"
              />
            </button>
          )}
          <Link to="/rules" aria-label="Game Manual" className="group">
            <img
              src={gameMannual}
              alt="Game Manual"
              className="w-[300px] h-[64px] sm:w-[340px] sm:h-[72px] md:w-[360px] md:h-[78px] object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-[1.02]"
            />
          </Link>
        </div>
      </div>
    </div>
  )
}
