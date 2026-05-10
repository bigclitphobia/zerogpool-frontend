import { useEffect, useState, useRef } from 'react'
import { Terminal, Cpu } from 'lucide-react'

const LOG_MESSAGES = [
  "[0G-COMPUTE] Initializing TEE environment...",
  "[0G-DA] Fetching latest match proofs (block #16661)...",
  "[0G-COMPUTE] Analyzing player's pocketing precision...",
  "[0G-AI] Generating tactical coaching insights...",
  "[0G-COMPUTE] Skill level weights updated: Beginner -> Pro",
  "[0G-TEE] Encrypting session data for 0G EVM...",
  "[0G-COMPUTE] Detecting playstyle: Aggressive/Strategic",
  "[0G-AI] Predicting next match difficulty: CHALLENGING",
  "[0G-DA] Validating root hashes for game assets...",
  "[0G-COMPUTE] Neural network synchronization complete.",
  "[0G-TEE] Privacy-preserving compute session established.",
  "[0G-AI] Calculating win rate probability: 74.2%",
]

const NeuralActivityConsole = () => {
  const [logs, setLogs] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      setLogs((prev) => [...prev.slice(-15), LOG_MESSAGES[index]])
      index = (index + 1) % LOG_MESSAGES.length
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="rounded-2xl bg-black/60 border border-cyan-500/20 backdrop-blur-md overflow-hidden flex flex-col h-[280px]">
      <div className="bg-slate-900/80 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Neural Compute Log</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500/80 uppercase">Active</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-1 lb-scroll has-scroll"
      >
        {logs.length === 0 && (
          <div className="text-cyan-400/30 italic">Establishing connection to 0G Compute nodes...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-cyan-500/40 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span className={log.includes('error') ? 'text-red-400' : 'text-cyan-300/80'}>{log}</span>
          </div>
        ))}
        <div className="w-1 h-3 bg-cyan-400 animate-pulse inline-block ml-1" />
      </div>

      <div className="px-4 py-1.5 bg-cyan-500/5 border-t border-cyan-500/10 flex items-center justify-between">
        <div className="text-[8px] text-cyan-400/40 font-mono tracking-tighter">NODE_ID: 0G-S-16661</div>
        <div className="flex items-center gap-1">
          <Cpu size={10} className="text-cyan-400/30" />
          <span className="text-[8px] text-cyan-400/30 font-mono">POWER: 1.2 TFLOPS</span>
        </div>
      </div>
    </div>
  )
}

export default NeuralActivityConsole
