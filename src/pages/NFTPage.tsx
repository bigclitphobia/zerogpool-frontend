import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import poolTableNFT from '../assets/tableNFT.png'
import claimBtn from '../assets/claim.png'
import { getPlayerData, updatePlayerName, getToken } from '../lib/api'

const NFTPage = () => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    let attempts = 0
    const bootstrap = () => {
      if (!active) return
      const token = getToken()
      if (!token) {
        if (attempts < 6) {
          attempts += 1
          setTimeout(bootstrap, 400)
        } else {
          setChecking(false)
        }
        return
      }
      getPlayerData()
        .then((data) => {
          if (!active) return
          const existing = (data && (data as any).playerNames0) || ''
          if (existing && String(existing).trim().length > 0) {
            navigate('/game', { replace: true })
            return
          }
          setName('')
          setSaved(false)
        })
        .catch(() => {
          // Ignore errors and allow user to set name
        })
        .finally(() => {
          if (active) setChecking(false)
        })
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [navigate])

  async function saveName() {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await updatePlayerName(name.trim())
      setSaved(true)
    } catch (e) {
      // stay on page; allow user to retry
      setSaved(false)
    } finally {
      setSaving(false)
    }
  }

  function handleClaim() {
    if (!saved) return
    navigate('/game')
  }

  return (
    <div className={`w-full flex-1 min-h-0 overflow-auto flex justify-center ${!saved ? 'items-center' : 'items-start'} px-3 ${!saved ? '' : 'pt-4'}`}>
      <div className="w-full max-w-[520px]">
        {/* Simple title */}
        {!saved && (
          <div className="text-center select-none mb-4">
            <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-[0.16em]">Claim Your Free Mint</h1>
          </div>
        )}

        {/* 1) Username first (only until saved) */}
        {!saved && (
          <div className="rounded-[18px] p-[2px] bg-gradient-to-b from-[#008CFF]/90 via-[#008CFF]/30 to-transparent shadow-[0_0_30px_rgba(0,140,255,0.45)] mb-4">
            <div className="rounded-[16px] bg-[#08002D]/90 backdrop-blur border border-white/10 p-5 sm:p-6">
              {checking ? (
                <div className="flex items-center justify-center gap-3 text-white/80">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
                  <span className="text-sm">Checking your profile…</span>
                </div>
              ) : (
                <div >
                  <label className="block text-xs text-white/80 mb-2 tracking-wide text-center">Enter your username</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setSaved(false)
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName() }}
                      disabled={saving}
                      placeholder="e.g. SpaceHustler"
                      className="flex-1 rounded-xl bg-black/30 border border-white/15 px-3 py-2.5 text-white/90 outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={saveName}
                      disabled={!name.trim() || saving}
                      className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2) After save: show NFT + claim */}
        {saved && !checking && (
          <div className="rounded-[18px] p-[2px] bg-gradient-to-b from-[#008CFF]/90 via-[#008CFF]/30 to-transparent shadow-[0_0_30px_rgba(0,140,255,0.45)]">
            <div className="rounded-[16px] bg-[#08002D]/90 backdrop-blur border border-white/10 p-5 sm:p-6">
              <div className="flex justify-center">
                <div className="rounded-xl p-[2px] bg-gradient-to-b from-white/20 to-transparent">
                  <div className="rounded-[12px] bg-black/40 border border-white/10 px-4 py-4">
                    <img src={poolTableNFT} alt="Starter table NFT" className="w-[180px] sm:w-[220px] md:w-[240px] h-auto object-contain" />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center text-white/90 text-xs">STARTER TABLE</div>
              <div className="mt-4 flex justify-center">
                <button onClick={handleClaim} className="group active:scale-[0.99]">
                  <img
                    src={claimBtn}
                    alt="Claim Now"
                    className="w-[200px] sm:w-[228px] md:w-[238px] h-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition group-hover:brightness-110"
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NFTPage
