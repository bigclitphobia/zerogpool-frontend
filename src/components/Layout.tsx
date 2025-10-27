import React from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useWallet } from './WalletContext'
import bg1 from '../assets/bg1.png'
import bg2 from '../assets/bg2.png'
import backImg from '../assets/back.png'
import ogImg from '../assets/0G.png'

const Layout: React.FC = () => {
  const { isConnected, toggle } = useWallet()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  // bg2 only on Home AND when wallet not connected; else bg1
  const bgImage = isHome && !isConnected ? bg2 : bg1

  function handleBack() {
    const idx = (window.history.state && (window.history.state as any).idx) ?? 0
    if (idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="relative min-h-screen text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Color overlays above the background image using provided palette */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Vertical blue sweep (#1100FD -> #00B2FF) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,0,253,0.20)_0%,rgba(0,178,255,0.18)_35%,transparent_70%)]" />
        {/* Center glow in purple tones (#8C4E88) */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(140,78,136,0.28),transparent_72%)]" />
        {/* Diagonal accent from top-left in deep plum (#50275E) */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(80,39,94,0.22)_0%,transparent_60%)]" />
        {/* Subtle cool vignette using neutral (#9B9B9B) tint */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(155,155,155,0.06),transparent_60%)]" />
      </div>
      
      {!isHome && (
        <header className="relative z-10 mt-4 sm:mt-6">
          {/* Reserve real header height so content flows below */}
          <div className="relative mx-auto w-full px-4 sm:px-6 md:px-8 h-20 sm:h-24 md:h-28">
            {/* Center OG image within reserved height */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img
                src={ogImg}
                alt="OG"
                className="h-10 sm:h-12 md:h-14 lg:h-16 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Back button anchored to viewport-left with spacing */}
            <div className="absolute inset-y-0 left-4 sm:left-6 md:left-8 lg:left-10 flex items-center z-20">
              <button onClick={handleBack} aria-label="Go back">
                <img src={backImg} alt="Back" className="h-5 sm:h-6 md:h-7 lg:h-8 object-contain" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto px-4 py-8 flex justify-center align-center" >
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
