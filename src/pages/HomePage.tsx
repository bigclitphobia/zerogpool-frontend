// src/pages/HomePage.tsx
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import connectWalletImg from '../assets/connectWallet.png'
import gameMannual from '../assets/gameMannual.png'
import LoginModal from '../components/LoginModal'
import ReferralModal from '../components/ReferralModal'
import { getPlayerData, getToken, getWalletAddress, loginWithIframeLogin } from '../lib/api'
// header assets are handled in Layout; not needed here
import rulesIcon from '../assets/rulesIcon.png';
import leaderboardBtnIcon from '../assets/leaderboard.png';
import startSeesionBtnIcon from '../assets/startSession.png';
// import logoutImage from '../assets/LogoutIcon.png';
import centerLogo from '../assets/logo.png';

export default function HomePage() {
  const { authenticated, user } = usePrivy() // removed logout
  const { wallets } = useWallets()
  const token = getToken()
  const iframeParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const iframeSource = iframeParams?.get('source')
  const iframeJwt = iframeParams?.get('jwt')
  const normalizedIframeSource = iframeSource?.toLowerCase()
  const shouldAttemptIframeLogin =
    !token && !!iframeJwt && normalizedIframeSource === 'browser'
  const [showLogin, setShowLogin] = useState(false)
  const [showReferral, setShowReferral] = useState(false)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [iframeLoginDone, setIframeLoginDone] = useState(!shouldAttemptIframeLogin)
  const [iframeLoginChecking, setIframeLoginChecking] = useState(shouldAttemptIframeLogin)
  const iframeLoginAttempted = useRef(false)
  const navigate = useNavigate()
  let isAuthenticated = authenticated || Boolean(token)
  const connectedAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!w.address)?.address ||
    getWalletAddress()

  useEffect(() => {
    if (!authenticated || !user) return
    console.groupCollapsed('[Privy] Authenticated user')
    console.log('User:', user)
    console.log('Wallets:', wallets)
    console.groupEnd()
  }, [authenticated, user, wallets])

  useEffect(() => {
    if (!shouldAttemptIframeLogin || !iframeJwt || !iframeSource) {
      setIframeLoginDone(true)
      setIframeLoginChecking(false)
      return
    }
    if (iframeLoginAttempted.current) return
    iframeLoginAttempted.current = true
    let active = true
    setIframeLoginChecking(true)
    loginWithIframeLogin(iframeJwt, iframeSource)
      .catch((err) => {
        console.warn('Iframe login failed:', err)
      })
      .finally(() => {
        if (!active) return
        setIframeLoginChecking(false)
        setIframeLoginDone(true)
      })
    return () => {
      active = false
    }
  }, [shouldAttemptIframeLogin, iframeJwt, iframeSource])

  // Fetch player name once we have JWT from backend login
  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    let attempts = 0
    const fetchName = () => {
      if (!active) return
      const token = getToken()
      if (!token) {
        if (attempts < 5) {
          attempts += 1
          setTimeout(fetchName, 400)
        }
        return
      }
      getPlayerData()
        .then((data) => {
          if (!active) return
          const name = (data && (data as any).playerNames0) || null
          setPlayerName(name)
        })
        .catch(() => {})
    }
    fetchName()
    return () => { active = false }
  }, [isAuthenticated])

  console.log("connected Address is ",connectedAddress," player Name is ",playerName)
  // When authenticated, show post-login UI

  if (!isAuthenticated && !iframeLoginDone) {
    return (
      <div className="relative w-full h-full flex flex-col items-center">
        <div className="flex-1 w-full flex items-center justify-center py-8">
          <img src={centerLogo} alt="Zero G Pool" className="max-h-[46vh] w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
        </div>
        <div className="pb-6 text-white/80 text-sm">{iframeLoginChecking ? 'Checking access...' : ''}</div>
      </div>
    )
  }

  async function startSession() {
    // Wait briefly for JWT from backend login via WalletContext
    let token = getToken()
    let attempts = 0
    while (!token && attempts < 6) {
      await new Promise((r) => setTimeout(r, 250))
      token = getToken()
      attempts += 1
    }
    if (!token) {
      // Fallback to NFT page; it will handle redirect if name already exists
      navigate('/nft1')
      return
    }
    try {
      const data = await getPlayerData()
      const hasName = !!(data && (data as any).playerNames0 && String((data as any).playerNames0).trim())
      navigate(hasName ? '/game' : '/nft1')
    } catch {
      // On error, send to NFT gate where it can proceed once name is saved
      navigate('/nft1')
    }
  }

  if (isAuthenticated) {
    return (
      <div className="relative w-full h-full flex-1">
        <div className="relative w-full h-full flex flex-col items-center">
          
          <div className="flex-1 w-full flex items-center justify-center py-8">
            <img src={centerLogo} alt="Zero G Pool" className="max-h-[46vh] w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-5">
            <button onClick={startSession} className="group active:scale-[0.99]">
              <img src={startSeesionBtnIcon} alt="Start Session" className="h-18 sm:h-20 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition" />
            </button>
            <Link to="/leaderboard" className="group active:scale-[0.99]">
              <img src={leaderboardBtnIcon} alt="Leaderboard" className="h-18 sm:h-20 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition" />
            </Link>
          </div>

        </div>
        <div>

        <button 
            onClick={() => setShowReferral(true)}
            style={{borderRadius:'100px'}}
            className="absolute left-[12px] bottom-[12px] rounded-2xl ring-1 ring-white/30 bg-black/30 px-4 py-1 hover:bg-black/40 text-white/95 text-sm font-semibold tracking-wide flex items-center gap-2"
          >
            <span className="text-lg">🎁</span>
            REFERRAL
          </button>
          

          <Link to="/rules" className="absolute right-[12px] bottom-[12px] rounded-2xl ring-1 ring-white/30 bg-black/30 px-4 py-2 hover:bg-black/40 text-white/95 text-sm font-semibold tracking-wide flex items-center gap-2">
            <img src={rulesIcon} alt="Rules" className="h-4 w-4" />
            RULES
          </Link>
        </div>
        
        <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} />
      </div>
    )
  }

  // Before login UI: show center logo and CTAs
  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <div className="flex-1 w-full flex items-center justify-center py-8">
        <img src={centerLogo} alt="Zero G Pool" className="max-h-[46vh] w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
      </div>

      {/* Connect + Game Manual below the logo (same size as main CTAs) */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8">
        <button onClick={() => setShowLogin(true)} aria-label="Connect Wallet" className="group">
          <img
            src={connectWalletImg}
            alt="Connect Wallet"
            className="h-20 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition"
          />
        </button>
        <Link to="/rules" aria-label="Game Manual" className="group">
          <img
            src={gameMannual}
            alt="Game Manual"
            className="h-20 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition"
          />
        </Link>
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  )
}
