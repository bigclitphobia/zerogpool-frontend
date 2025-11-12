import React, { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import bg from '../assets/bg.png'
import bgBlur from '../assets/bgBlur.png'
import backImg from '../assets/back.png'
import ogImg from '../assets/OG.png'
import LoginModal from './LoginModal'
import profileIcon from '../assets/profileIcon.png'
import ball1 from '../assets/balls/ball-1.png'
import trophyIcon from '../assets/trophy.png'
import { getPlayerData, getPlayerStats, getToken } from '../lib/api'

const Layout: React.FC = () => {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const isHome = location.pathname === '/'
  // Home page uses the same background for connected/not connected
  // Other pages keep blurred bg when not authenticated
  const bgImage = isHome ? bg : (authenticated ? bg : bgBlur)

  const connectedAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!(w as any).address)?.address
  const needsWallet = !!(authenticated && !connectedAddress)
  const shortAddress = useMemo(() => {
    const a = connectedAddress || ''
    return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
  }, [connectedAddress])

  // Header dynamic values
  const [wins, setWins] = useState<number | null>(null)
  const [coins, setCoins] = useState<number | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)

  const displayName = useMemo(() => {
    if (playerName && playerName.length > 13) return playerName.slice(0, 13) + '...'
    return playerName || ''
  }, [playerName])

  // Fetch profile + stats once authenticated and JWT available
  useEffect(() => {
    if (!authenticated) {
      setWins(null)
      setCoins(null)
      setPlayerName(null)
      return
    }
    let active = true
    let attempts = 0
    const load = () => {
      if (!active) return
      const token = getToken()
      if (!token) {
        if (attempts < 6) {
          attempts += 1
          setTimeout(load, 400)
        }
        return
      }
      getPlayerData()
        .then((d) => {
          if (!active) return
          const n = (d && (d as any).playerNames0) || null
          setPlayerName(n)
        })
        .catch(() => {})
      getPlayerStats()
        .then((s) => {
          if (!active) return
          const totalWins = ((s?.totalGamesWonVsCPU || 0) + (s?.totalGamesWonVsHuman || 0)) as number
          const totalCoins = (s?.totalBallsPocketed ?? 0) as number
          setWins(totalWins)
          setCoins(totalCoins)
        })
        .catch(() => {})
    }
    load()
    return () => {
      active = false
    }
  }, [authenticated])

  function handleBack() {
    const idx = (window.history.state && (window.history.state as any).idx) ?? 0
    if (idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="relative flex flex-col min-h-dvh text-neutral-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-center bg-no-repeat bg-cover " style={{ backgroundImage: `url(${bgImage})` }} />

      {!isHome ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#000000B2]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,0,253,0.20)_0%,rgba(0,178,255,0.18)_35%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(140,78,136,0.28),transparent_72%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(80,39,94,0.22)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(155,155,155,0.06),transparent_60%)]" />
        </div>
      ) : (
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#000000B2]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,0,253,0.20)_0%,rgba(0,178,255,0.18)_35%,transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(140,78,136,0.28),transparent_72%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(80,39,94,0.22)_0%,transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(155,155,155,0.06),transparent_60%)]" />
            </div>
          )}

      <header className="relative pt-4">
        {authenticated ? (
          <div className="relative w-full px-0">
            <div className="w-full pt-1 flex items-center justify-between px-4 sm:px-6 md:px-8">
              <div className="flex items-center gap-3">
                {!isHome && (
                  <button onClick={handleBack} aria-label="Go back" className="mr-1 hidden sm:block">
                    <img src={backImg} alt="Back" className="h-6 sm:h-7 md:h-8 object-contain" />
                  </button>
                )}
                <div className="flex items-center gap-2 bg-indigo-600/80 rounded-xl px-4 py-2 sm:px-3 sm:py-1.5 ring-1 ring-white/20 shadow-md">
                  <img src={trophyIcon} alt="Wins" className="h-6 w-6 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span className="text-white text-base sm:text-sm md:text-base font-extrabold">{(wins ?? 0).toLocaleString()} WINS</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-600/80 rounded-xl px-4 py-2 sm:px-3 sm:py-1.5 ring-1 ring-white/20 shadow-md">
                  <img src={ball1} alt="Balls" className="h-6 w-6 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span className="text-white text-base sm:text-sm md:text-base font-extrabold">{(coins ?? 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 bg-gradient-to-r from-sky-500/70 to-blue-500/70 backdrop-blur rounded-2xl pl-1.5 pr-3.5 py-1.5 sm:pl-1 sm:pr-3 sm:py-1 ring-1 ring-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.25)] cursor-pointer">
                  <img src={profileIcon} alt="Profile" className="h-10 w-10 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full ring-2 ring-white/40" />
                  {/* Hide wallet text on mobile for all pages; show only the icon */}
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-white text-sm font-bold tracking-wide">{displayName || shortAddress || 'Connected'}</span>
                    {connectedAddress && playerName && (
                      <span className="text-white/80 text-[11px] font-mono">{shortAddress}</span>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full px-0 h-20 sm:h-24 md:h-28">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img
                src={ogImg}
                alt="OG"
                className="h-12 sm:h-16 md:h-18 lg:h-20 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              />
            </div>
            {!isHome && (
              <div className="absolute inset-y-0 left-4 sm:left-6 md:left-8 lg:left-10 flex items-center z-20">
                <button onClick={handleBack} aria-label="Go back">
                  <img src={backImg} alt="Back" className="h-5 sm:h-6 md:h-7 lg:h-8 object-contain" />
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col p-0 min-h-0"> 
        <Outlet />
      </main>

      <LoginModal open={showLogin || needsWallet} onClose={() => setShowLogin(false)} />
    </div>
  )
}

export default Layout
