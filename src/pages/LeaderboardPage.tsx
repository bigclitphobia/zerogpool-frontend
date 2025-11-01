import frameLg from '../assets/leaderboardFrame.png'
import frameSm from '../assets/leaderboardFramesm.png'
import ball1 from '../assets/balls/ball-1.png'
import ball2 from '../assets/balls/ball-2.png'
import ball3 from '../assets/balls/ball-3.png'
import ball4 from '../assets/balls/ball-4.png'
import ball5 from '../assets/balls/ball-5.png'
import { useEffect, useRef } from 'react'

// type Row = { rank: number; name: string; trophies: number }

// const names = ['Annie','Emma','Thomas','Harry','Marie','Noah','Olivia','Liam','Sophia','Mason']

// const data: Row[] = Array.from({ length: 20 }, (_, i) => ({
//   rank: i + 1,
//   name: `${names[i % names.length]}${i >= names.length ? ' ' + (i + 1) : ''}`,
//   trophies: Math.max(100, Math.floor(8800 - i * 180 + Math.random() * 80)),
// }))

// function Ball({ rank }: { rank: number }) {
//   const base =
//     rank === 1
//       ? 'rgba(254,207,47,1), rgba(255,245,150,1)'
//       : rank === 2
//       ? 'rgba(47,109,254,1), rgba(155,188,255,1)'
//       : rank === 3
//       ? 'rgba(254,47,47,1), rgba(255,160,160,1)'
//       : 'rgba(10,10,10,1), rgba(80,80,80,0.6)'
//   const ring = rank <= 3 ? 'ring-white/40' : 'ring-white/20'
//   return (
//     <span
//       className={`inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full text-[10px] sm:text-xs font-bold text-white ring ${ring} shadow-[0_2px_8px_rgba(0,0,0,0.45)]`}
//       style={{ background: `radial-gradient(circle at 30% 30%, ${base})` }}
//     >
//       {String(rank).padStart(2, '0')}
//     </span>
//   )
// }

// const Table = () => {
//   const scrollRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     const el = scrollRef.current
//     if (!el) return

//     const update = () => {
//       const isDesktop = window.matchMedia('(min-width: 768px)').matches
//       const shouldForce = isDesktop && data.length > 4
//       const hasOverflow = el.scrollHeight > el.clientHeight + 1
//       const has = shouldForce || hasOverflow
//       el.classList.toggle('has-scroll', has)
//     }

//     update()
//     const ro = new ResizeObserver(() => update())
//     ro.observe(el)
//     window.addEventListener('resize', update)
//     return () => {
//       ro.disconnect()
//       window.removeEventListener('resize', update)
//     }
//   }, [])

//   return (
//   <>
//     {/* Header row same height as cards */}
//     <div style={{padding:'10px'}} className="w-[98%] mx-auto border border-white/10 grid grid-cols-[90px_1fr_150px] sm:grid-cols-[100px_1fr_170px] items-center px-4 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4 min-h-[52px] sm:min-h-[60px] md:min-h-[68px] text-base sm:text-lg md:text-xl text-neutral-100 bg-black/35 rounded-lg">
//       <div>Rank</div>
//       <div className="text-center">Name</div>
//       <div className="text-right">Trophies</div>
//     </div>
//     <div ref={scrollRef} className="mt-20 flex-1 overflow-y-auto md:overflow-y-scroll px-[2%] md:pl-[2%] md:pr-0 md:pt-3 md:pb-4 lb-scroll" style={{ scrollbarGutter: 'stable both-edges' }}>
//       <div className="flex flex-col gap-1 sm:gap-2 items-stretch">
//         {data.map((row) => (
//           <div
//             key={row.rank}
//             className="w-[98%] mx-auto rounded-xl bg-black/30/90 backdrop-blur-[1px] border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:bg-white/10 transition-colors"
//           >
//             <div style={{padding:'10px'}} className="grid grid-cols-[90px_1fr_150px] sm:grid-cols-[100px_1fr_170px] items-center px-4 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4 min-h-[52px] sm:min-h-[60px] md:min-h-[68px] text-base sm:text-lg md:text-xl text-neutral-100">
//               <div className="flex items-center gap-3">
//                 <Ball rank={row.rank} />
//               </div>
//               <div className="text-center font-semibold tracking-wide">{row.name}</div>
//               <div className="flex items-center justify-end gap-2 tabular-nums font-semibold">
//                 <span>{row.trophies.toLocaleString()}</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </>
//   )
// }

// const LeaderboardPage = () => {
//   return (
//     <div className="w-full flex justify-center px-4 pt-4 sm:pt-6 align-center">
//       <div className="w-full select-none max-w-[460px] sm:max-w-[580px] md:max-w-5xl flex align-center" style={{flexDirection:'column'}}>
//         <h2
//           className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-[0.2em] text-cyan-200"
//           style={{ textShadow: '0 2px 12px rgba(0, 200, 255, 0.45)',paddingBottom:'10px' }}
//         >
//           Leaderboard
//         </h2>

//         {/* Mobile frame */}
//         <div className="relative mx-auto md:hidden overflow-hidden" >
//           <img src={frameSm} alt="Leaderboard frame" className="relative z-10 block w-full h-auto pointer-events-none mx-auto max-h-[calc(100vh-10rem)]" />
//           <div className="absolute left-[6%] right-[6%] top-[17%] bottom-[12%] z-50">
//             <div className="flex h-full flex-col" >
//               <Table />
//             </div>
//           </div>
//         </div>

//         {/* Desktop/Tablet frame */}
//         <div className="relative mx-auto hidden md:block">
//           <img src={frameLg} alt="Leaderboard frame" className="relative z-50 block w-full h-auto pointer-events-none mx-auto max-h-[calc(100vh-12rem)]" />
//           <div className="absolute left-[10%] right-[6%] top-[14%] bottom-[14%] z-20">
//             <div className="flex h-full flex-col w-full">
//               <Table />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

const Table = () => {
//   type BallScore = {
//   "1": string;
//   "2": string;
//   "3": string;
//   "4": string;
//   "5": string;
// };
  const topLeaders = [{ "rank": 1, "name": "Ankit", "trophies": 600 }, { "rank": 2, "name": "Bhavya", "trophies": 550 }, { "rank": 3, "name": "Chirag", "trophies": 490 }, { "rank": 4, "name": "Divya", "trophies": 420 }, { "rank": 5, "name": "Esha", "trophies": 380 }]
  const ballScore = {"1": ball1, "2": ball2, "3": ball3, "4": ball4, "5": ball5};
//   const ballScore: BallScore = { 
//   "1": ball1, 
//   "2": ball2, 
//   "3": ball3, 
//   "4": ball4, 
//   "5": ball5 
// };
  return (
    <div className="flex pb-4 px-10 h-full flex-col w-full justify-between">
      <div className="w-full flex items-center justify-between px-8 py-3 rounded-[16px] border-2 border-cyan-400 shadow-[0px_-1px_16.5px_-1px_#00E5FF]">
        <span className="text-4xl font-extrabold text-[#00BBFF] drop-shadow-[0px_2px_4px_0px_#666180]">
          RANK
        </span>
        <span className="text-4xl font-extrabold text-[#00BFFF] drop-shadow-[0px_2px_4px_0px_#666180]">
          NAME
        </span>
        <span className="text-4xl font-extrabold text-[#00BFFF] drop-shadow-[0px_2px_4px_0px_#666180]">
          TROPHIES
        </span>
      </div>
      {topLeaders.map((row) => (
        <div className="w-full flex items-center justify-between px-12 py-3 rounded-[20px] border-2 border-cyan-400 shadow-[0px_-1px_16.5px_-1px_#00E5FF]">
          <span className="text-4xl font-extrabold text-shadow-[0px_4.64px_3.94px_0px_#000000CC]" style={{ textShadow: '0px 4.64px 3.94px #000000CC' }}>
            <img src={ballScore[row.rank.toString()]} alt={`Rank ${row.rank}`} className="inline-block h-10 w-10 mr-2 align-middle" />
          </span>
          <span className="text-4xl font-extrabold drop-shadow-[0px_2px_4px_0px_#666180]">
            {row.name}
          </span>
          <span className="text-4xl font-extrabold drop-shadow-[0px_2px_4px_0px_#666180]">
            {row.trophies}
          </span>
        </div>
      ))}
    </div>
  )
}

const LeaderboardPage = () => {
  return (
    <div className="font-[Mohave] w-full flex justify-center pb-12 pr-8 sm:pt-6 align-center">
      <div className="w-full select-none max-w-[460px] sm:max-w-[580px] md:max-w-5xl flex flex-col align-center">
        <h2
          className="sm:mb-4 pl-5 text-center sm:text-3xl md:text-8xl font-extrabold uppercase text-cyan-150 z-10"
          style={{ textShadow: '0px 0px 33px #00EEFF, 0 2px 12px rgba(0, 200, 255, 0.45)', paddingBottom: '10px' }}
        >
          Leaderboard
        </h2>

        {/* Desktop/Tablet frame */}
        <div className="-mt-20 relative mx-auto hidden md:block">
          <img src={frameLg} alt="Leaderboard frame" className="relative block w-full h-auto pointer-events-none mx-auto max-h-[calc(100vh-12rem)]" />
          <div className="absolute left-[10%] right-[6%] top-[12%] bottom-[14%] z-20">
            <Table />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage;
