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
          <div className="flex flex-col items-center gap-3">
            <img
              src={connectWalletImg}
              alt="Connect Wallet"
              className="cursor-pointer w-[320px] h-[70px] p-2"
              onClick={() => login()}
            />
            <Link to="/rules">
              <img
                src={gameMannual}
                alt="Game Manual"
                className="cursor-pointer w-[320px] h-[70px] p-2"
              />
            </Link>
          </div>
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

      {/* Using Privy hosted UI for auth/wallet; custom modal removed */}
    </div>
  )
}
