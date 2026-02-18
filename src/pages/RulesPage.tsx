export default function RulesPage() {
  return (
    <div className="w-full flex justify-center px-4 pt-2 sm:pt-4">
      <div className="w-full max-w-5xl">
        {/* Title */}
        <div className="text-center select-none mb-3 sm:mb-4">
          <h1
            className="pl-5 text-center sm:text-3xl md:text-8xl font-extrabold uppercase text-white z-10 tracking-[0.2em]"
            style={{
              textShadow:
                '0 0 36px rgba(255,255,255,0.9), 0 0 18px rgba(255,255,255,0.7), 0 2px 10px rgba(255,255,255,0.6)',
            }}
          >
            RULES
          </h1>
          <div className="mx-auto mt-2 h-1.5 w-48 md:w-64 rounded-full bg-white/80 blur-[2px]" />
        </div>

        {/* Glowing card */}
        <div className="relative mx-auto w-full max-w-3xl">
          <div className="rounded-[24px] p-[2px] bg-gradient-to-b from-[#008CFF]/80 via-[#008CFF]/30 to-transparent shadow-[0_0_40px_rgba(0,140,255,0.45)]">
            <div className="rounded-[22px] bg-[#08002D]/80 backdrop-blur-md border border-white/10 p-5 sm:p-7 md:p-8">

              {/* Objective */}
              <div>
                <h2 className="text-[#008CFF] font-extrabold text-xl sm:text-2xl mb-2">Objective</h2>
                <p className="text-[#EAF6FF] text-base sm:text-lg leading-relaxed">
                  Clear all your balls (solids or stripes) and then legally pocket the 8-ball to win the match.
                </p>
              </div>

              <div className="my-5 h-[2px] bg-[#008CFF]/60" />

              {/* Controls */}
              <div>
                <h2 className="text-[#008CFF] font-extrabold text-xl sm:text-2xl mb-2">Controls</h2>
                <p className="text-[#EAF6FF] text-base sm:text-lg leading-relaxed">
                  Pull the cue stick back on the screen to set power, aim your shot, and release to strike.
                  The further you pull, the stronger the shot.
                </p>
              </div>

              <div className="my-5 h-[2px] bg-[#008CFF]/60" />

              {/* VS AI */}
              <div>
                <h2 className="text-[#008CFF] font-extrabold text-xl sm:text-2xl mb-2">Playing vs AI</h2>
                <p className="text-[#EAF6FF] text-base sm:text-lg leading-relaxed">
                  Compete against an AI opponent that follows the same rules, makes strategic shots, and
                  reacts to your gameplay.
                </p>
              </div>

              <div className="my-5 h-[2px] bg-[#008CFF]/60" />

              {/* Basic Rules */}
              <div>
                <h2 className="text-[#008CFF] font-extrabold text-xl sm:text-2xl mb-2">Basic Rules</h2>
                <ul className="space-y-2 sm:space-y-2.5 text-[#EAF6FF] text-base sm:text-lg leading-relaxed">
                  <li>- First legally pocketed ball decides your group (solids or stripes).</li>
                  <li>- On every shot, hit your group ball first.</li>
                  <li>- You must pocket a ball or hit a rail to keep your turn.</li>
                  <li>- Fouls give the opponent Ball in Hand.</li>
                </ul>
              </div>

              <div className="my-5 h-[2px] bg-[#008CFF]/60" />

              {/* 8-Ball Rules */}
              <div>
                <h2 className="text-[#008CFF] font-extrabold text-xl sm:text-2xl mb-2">8-Ball</h2>
                <p className="text-[#EAF6FF] text-base sm:text-lg leading-relaxed">
                  Shoot the 8-ball only after clearing your group. You must call the pocket. Pocketing the
                  8-ball early, in the wrong pocket, or scratching on it results in a loss.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
