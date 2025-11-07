import poolTableNFT from '../assets/tableNFT.png'
import claimBtn from '../assets/claim.png'
import { useNavigate } from 'react-router-dom'

const NFTPage = () => {
  const navigate = useNavigate()
  function handleClaim() {
    // After claim, go to game page
    navigate('/game')
  }

  return (
    <div className="w-full h-full overflow-hidden flex justify-center items-start px-3 pt-2">
      <div className="w-full max-w-[520px]">
        {/* Title */}
        <div className="text-center select-none mb-3">
          <h1
            className="text-white text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-[0.18em]"
            style={{ textShadow: '0 0 24px rgba(0,140,255,0.9), 0 2px 8px rgba(0,140,255,0.5)' }}
          >
            CLAIM YOUR FREE MINT
          </h1>
        </div>

        {/* Glowing card (kept compact to avoid scrolling) */}
        <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[460px]">
          <div className="rounded-[18px] p-[2px] bg-gradient-to-b from-[#008CFF]/90 via-[#008CFF]/30 to-transparent shadow-[0_0_30px_rgba(0,140,255,0.45)]">
            <div className="rounded-[16px] bg-[#08002D]/90 backdrop-blur-md border border-white/10 p-5 sm:p-6">
              {/* NFT preview */}
              <div className="flex justify-center">
                <div className="rounded-xl p-[2px] bg-gradient-to-b from-white/20 to-transparent">
                  <div className="rounded-[12px] bg-black/40 border border-white/10 px-3 py-3">
                    <img src={poolTableNFT} alt="Starter table NFT" className="w-[170px] sm:w-[200px] md:w-[220px] h-auto object-contain" />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="mt-4 text-center">
                <div className="text-white font-extrabold tracking-[0.3em] text-xs sm:text-sm">
                  STARTER TABLE
                </div>
              </div>

              {/* Claim button */}
              <div className="mt-3 flex justify-center">
                <button onClick={handleClaim} className="group active:scale-[0.99]">
                  <img
                    src={claimBtn}
                    alt="Claim Now"
                    className="w-[190px] sm:w-[212px] md:w-[224px] h-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition group-hover:brightness-110"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NFTPage
