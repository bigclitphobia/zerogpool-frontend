import frameLg from '../assets/leaderboardFrame.png'
// import frameSm from '../assets/leaderboardFramesm.png'
import ball1 from '../assets/balls/ball-1.png'
import ball2 from '../assets/balls/ball-2.png'
import ball3 from '../assets/balls/ball-3.png'
import ball4 from '../assets/balls/ball-4.png'
import ball5 from '../assets/balls/ball-5.png'
import { useEffect, useState } from 'react'
import {
  getLeaderboard,
  getLeaderboardAiComment,
  getWalletAddress,
  type LeaderboardAiComment,
  type LeaderboardRow,
} from '../lib/api'
import { useBlockchainToast } from '../context/BlockchainToastContext'

const sourceLabel = (source: string | null): string | null => {
  if (!source) return null
  const s = source.toLowerCase()
  if (s.includes('0g') || s.includes('zero')) return 'via 0G Compute'
  if (s.includes('cloudflare') || s.includes('cf') || s.includes('workers')) return 'via Cloudflare fallback'
  return `via ${source}`
}

const AiCommentCard = () => {
  const [data, setData] = useState<LeaderboardAiComment | null>(null)
  const { showToast } = useBlockchainToast()
  useEffect(() => {
    const wallet = getWalletAddress()
    if (!wallet) return
    let active = true
    getLeaderboardAiComment(wallet)
      .then((res) => {
        if (!active) return
        setData(res)
        if (res?.comment && res.source && /0g|zero/i.test(res.source)) {
          showToast({
            title: '🤖 AI Commentary Ready',
            description: 'Pool analysis generated via 0G Compute',
            txHash: null,
            type: 'compute',
            duration: 6000,
          })
        }
      })
      .catch(() => {
        if (!active) return
        setData(null)
      })
    return () => {
      active = false
    }
  }, [showToast])

  if (!data?.comment) return null
  const label = sourceLabel(data.source)
  return (
    <div className="w-full mb-4 rounded-2xl border border-cyan-300/50 bg-cyan-500/10 px-5 py-4 shadow-[0px_-1px_16.5px_-1px_#00E5FF]">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-cyan-200">
          AI Pool Commentary
        </span>
        {label ? (
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase text-cyan-100/80">
            {label}
          </span>
        ) : null}
      </div>
      <p className="text-sm sm:text-base font-medium text-cyan-50/95 leading-snug">
        {data.comment}
      </p>
    </div>
  )
}

const Table = () => {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    getLeaderboard()
      .then((data) => {
        if (!active) return
        setRows(data)
      })
      .catch((e) => {
        if (!active) return
        setError(e?.message || 'Failed to load leaderboard')
      })
    return () => {
      active = false
    }
  }, [])

  const ballScore = {"1": ball1, "2": ball2, "3": ball3, "4": ball4, "5": ball5};
  const list = rows || []
  return (
    <div className="flex pb-4 px-10 h-full min-h-0 flex-col w-full gap-4 overflow-auto">
      <AiCommentCard />
      <div className="w-full flex items-center justify-between px-4 sm:px-8 py-2 sm:py-3 rounded-[16px] border-2 border-cyan-400 shadow-[0px_-1px_16.5px_-1px_#00E5FF]">
        <span className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#00BBFF] drop-shadow-[0px_2px_4px_0px_#666180]">
          RANK
        </span>
        <span className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#00BFFF] drop-shadow-[0px_2px_4px_0px_#666180]">
          NAME
        </span>
        <span className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#00BFFF] drop-shadow-[0px_2px_4px_0px_#666180]">
          TROPHIES
        </span>
      </div>
      {!rows && !error && (
        <div className="w-full text-center py-8 text-cyan-100/80">Loading leaderboard…</div>
      )}
      {error && (
        <div className="w-full text-center py-8 text-red-300">{error}</div>
      )}
      {list && list.map((row) => (
        <div key={row.rank} className="w-full flex items-center justify-between px-12 py-3 rounded-[20px] border-2 border-cyan-400 shadow-[0px_-1px_16.5px_-1px_#00E5FF]">
          <span className="text-4xl font-extrabold" style={{ textShadow: '0px 4.64px 3.94px #000000CC' }}>
            {row.rank <= 5 ? (
              <img src={ballScore[String(row.rank) as keyof typeof ballScore]} alt={`Rank ${row.rank}`} className="inline-block h-10 w-10 mr-2 align-middle" />
            ) : (
              <span className="inline-block w-10 mr-2 text-center align-middle">{row.rank}</span>
            )}
          </span>
          <span className="text-3xl md:text-4xl font-extrabold drop-shadow-[0px_2px_4px_0px_#666180] truncate max-w-[50%]">
            {row.playerName || 'Anonymous'}
          </span>
          <span title={`${row.totalBallsPocketed} balls`} className="text-3xl md:text-4xl font-extrabold drop-shadow-[0px_2px_4px_0px_#666180]">
            {row.totalBallsPocketed}
          </span>
          {row.trust?.saveBackedBy0g ? (
            <span className="ml-3 rounded-full border border-cyan-300/60 bg-cyan-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-100">
              Secured on 0G
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}


const LeaderboardPage = () => {
  return (
    <div className="font-[Mohave] w-full h-full overflow-auto flex justify-center pt-0 pr-0 pb-0 align-center">
      <div className="w-full h-full select-none max-w-[460px] sm:max-w-[580px] md:max-w-5xl flex flex-col align-center min-h-0">
        <h2
          className="mt-4 md:mt-6 mb-2 pl-5 text-center sm:text-3xl md:text-8xl font-extrabold uppercase text-cyan-150 z-10"
          style={{ textShadow: '0px 0px 33px #00EEFF, 0 2px 12px rgba(0, 200, 255, 0.45)' }}
        >
          Leaderboard
        </h2>

        {/* Desktop/Tablet frame */}
        <div className="-mt-20 relative mx-auto hidden md:block overflow-hidden">
          <img src={frameLg} alt="Leaderboard frame" className="relative block w-full h-auto pointer-events-none mx-auto max-h-[calc(100vh-11rem)]" />
          <div className="absolute left-[10%] right-[6%] top-[12%] bottom-[14%] z-20 overflow-auto min-h-0">
            <Table />
          </div>
        </div>
        {/* Mobile list (no frame) */}
        <div className="md:hidden w-full mt-4 px-4 overflow-auto">
          <Table />
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage;
