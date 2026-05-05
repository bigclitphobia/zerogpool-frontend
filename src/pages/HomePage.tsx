import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useBlockchainToast } from '../context/BlockchainToastContext' // NEW
import { loginWithWallet } from '../lib/api' // NEW
import connectWalletImg from '../assets/connectWallet.png'
import gameMannual from '../assets/gameMannual.png'
import LoginModal from '../components/LoginModal'
import ReferralModal from '../components/ReferralModal'
import { getPlayerData, getToken, getWalletAddress, getDaSnapshot } from '../lib/api'
import { getJwtFromUrl } from '../lib/session'
import rulesIcon from '../assets/rulesIcon.png';
import leaderboardBtnIcon from '../assets/leaderboard.png';
import startSeesionBtnIcon from '../assets/startSession.png';
import centerLogo from '../assets/logo.png';

export default function HomePage() {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { showToast } = useBlockchainToast() // NEW
  const [showLogin, setShowLogin] = useState(false)
  const [showReferral, setShowReferral] = useState(false)
  const [hasShownLoginToast, setHasShownLoginToast] = useState(false) // NEW
  const navigate = useNavigate()
  const token = getToken()
  const sessionConnected = (() => {
    try {
      return localStorage.getItem('wallet_connected') === 'true'
    } catch {
      return false
    }
  })()
  const connectedAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!w.address)?.address ||
    getWalletAddress()
  const isAuthenticated = authenticated || Boolean(token) || sessionConnected

  useEffect(() => {
    if (!authenticated || !user) return
    console.groupCollapsed('[Privy] Authenticated user')
    console.log('User:', user)
    console.log('Wallets:', wallets)
    console.groupEnd()
  }, [authenticated, user, wallets])

  // Check for autologin parameters and redirect if needed
  useEffect(() => {
    const jwt = getJwtFromUrl();
    
    if (jwt) {
      console.log('[HomePage] Autologin parameters detected, redirecting to AutoLogin', { jwt: Boolean(jwt) });
      navigate({
        pathname: '/autologin',
        search: window.location.search,
        hash: window.location.hash,
      }, { replace: true });
      return;
    }
  }, [navigate]);

  // NEW: Handle Privy wallet login and show toast
  useEffect(() => {
    if (!authenticated || !connectedAddress || hasShownLoginToast) return
    
    const handlePrivyLogin = async () => {
      try {
        const loginResult = await loginWithWallet(connectedAddress)
        localStorage.setItem('wallet_connected', 'true')
        setHasShownLoginToast(true)

        if (loginResult?.blockchain?.txHash) {
          showToast({
            title: '🎮 Login Successful',
            description: 'Session recorded on 0G blockchain',
            txHash: loginResult.blockchain.txHash,
            type: 'blockchain',
            duration: 6000,
          })
        }

        // Show DA submitted toast, then poll for BLS finality (max 60s, every 5s)
        showToast({
          title: '📡 Saving to 0G DA',
          description: 'Session data submitted to 0G Data Availability layer',
          txHash: null,
          type: 'da',
          duration: 5000,
        })

        const wallet = connectedAddress
        let attempts = 0
        const maxAttempts = 12 // 12 × 5s = 60s max
        const poll = async () => {
          attempts += 1
          const snap = await getDaSnapshot(wallet)
          const status = snap?.snapshot?.daStatus
          if (status === 'confirmed' || status === 'finalized') {
            showToast({
              title: '✅ Saved on 0G DA',
              description: 'Session data confirmed on 0G Data Availability layer',
              txHash: null,
              type: 'da',
              duration: 7000,
            })
          } else if (attempts < maxAttempts) {
            setTimeout(poll, 5000)
          }
        }
        setTimeout(poll, 5000)
      } catch (error) {
        console.error('Failed to show login toast:', error)
      }
    }
    
    handlePrivyLogin()
  }, [authenticated, connectedAddress, hasShownLoginToast, showToast])

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
        .then(() => {
          if (!active) return
        })
        .catch(() => {})
    }
    fetchName()
    return () => { active = false }
  }, [isAuthenticated])

  // Keep Home resilient when wallet/provider state lags briefly.

  async function startSession() {
    let token = getToken()
    let attempts = 0
    while (!token && attempts < 6) {
      await new Promise((r) => setTimeout(r, 250))
      token = getToken()
      attempts += 1
    }
    if (!token) {
      navigate('/nft1')
      return
    }
    try {
      const data = await getPlayerData()
      const hasName = !!(data && (data as any).playerNames0 && String((data as any).playerNames0).trim())
      navigate(hasName ? '/game' : '/nft1')
    } catch {
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

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <div className="flex-1 w-full flex items-center justify-center py-8">
        <img src={centerLogo} alt="Zero G Pool" className="max-h-[46vh] w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
      </div>

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
