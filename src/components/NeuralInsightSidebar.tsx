import { useEffect, useState } from 'react'
import { Brain, Cpu, Zap, Sparkles, ShieldCheck } from 'lucide-react'
import { getPlayerCoaching, getPlayerInsight, getPlayerDifficulty, getWalletAddress } from '../lib/api'

const NeuralInsightSidebar = () => {
  const [coaching, setCoaching] = useState<any | null>(null)
  const [insight, setInsight] = useState<any | null>(null)
  const [difficulty, setDifficulty] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAiData = async () => {
    const address = getWalletAddress()
    if (!address) return

    setLoading(true)
    setError(null)
    try {
      const [c, i, d] = await Promise.allSettled([
        getPlayerCoaching(address),
        getPlayerInsight(address, 1),
        getPlayerDifficulty(address),
      ])

      if (c.status === 'fulfilled') setCoaching(c.value)
      if (i.status === 'fulfilled') setInsight(i.value)
      if (d.status === 'fulfilled') setDifficulty(d.value)
    } catch (err) {
      console.error('Failed to fetch Neural Insights:', err)
      setError('AI unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAiData()
    // Refresh insights every 60 seconds
    const interval = setInterval(fetchAiData, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col rounded-xl border border-cyan-400/30 bg-black/40 backdrop-blur-sm overflow-hidden font-sans">
      <div className="bg-gradient-to-r from-cyan-600/30 via-purple-600/30 to-blue-600/30 border-b border-cyan-400/40 px-4 py-3 flex items-center justify-between">
        <h3 className="text-cyan-300 font-extrabold text-sm sm:text-base tracking-wider flex items-center gap-2">
          <Brain size={18} className="text-cyan-400 animate-pulse" />
          NEURAL INSIGHTS
        </h3>
        <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400/80 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
          <Cpu size={10} /> 0G COMPUTE
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 lb-scroll has-scroll">
        {loading && !coaching ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold">Syncing with TEE...</span>
          </div>
        ) : error && !coaching ? (
          <div className="text-center py-10 text-red-400/60 text-xs font-bold">{error}</div>
        ) : (
          <>
            {/* Difficulty Recommendation */}
            {difficulty?.recommendation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <Sparkles size={12} className="text-purple-400" />
                  Optimal Challenge
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
                  <div className="text-purple-300 font-bold text-xs mb-1 uppercase">
                    Level: {difficulty.recommendation.difficulty || 'Normal'}
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed italic">
                    "{difficulty.recommendation.reasoning}"
                  </p>
                </div>
              </div>
            )}

            {/* Performance Insight */}
            {insight?.insight && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <Zap size={12} className="text-yellow-400" />
                  Neural Analysis
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {insight.insight}
                  </p>
                </div>
              </div>
            )}

            {/* Coaching Tips */}
            {coaching?.tips && coaching.tips.length > 0 && (
              <div className="space-y-2 pb-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-green-400" />
                  Tactical Coaching
                </div>
                <div className="space-y-2">
                  {coaching.tips.map((tip: string, i: number) => (
                    <div key={i} className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2 flex gap-2">
                      <span className="text-cyan-400 font-black text-[10px]">{i + 1}</span>
                      <p className="text-[11px] text-white/60 leading-tight">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEE Verification Badge */}
            {(coaching?._meta?.teeVerified || insight?._meta?.teeVerified) && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 opacity-40">
                <ShieldCheck size={10} className="text-emerald-400" />
                <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-tighter">TEE Decentralized Verification Active</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default NeuralInsightSidebar
