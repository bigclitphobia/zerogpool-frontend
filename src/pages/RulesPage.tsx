import React from 'react'

export default function RulesPage() {
  return (
    <div className="w-full flex justify-center px-4 pt-4 sm:pt-6">
      <div className="w-full max-w-2xl md:max-w-3xl space-y-4 sm:space-y-6">
        <header className="text-center select-none">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-[0.12em] text-cyan-200"
            style={{ textShadow: '0 1px 10px rgba(0, 200, 255, 0.28)' }}
          >
            8‑Ball Pool Rules
          </h1>
        </header>

        {/* Objective */}
        <section className="relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(80%_40%_at_50%_0%,rgba(34,193,241,0.12),transparent_70%)]" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-5 shadow-[0_10px_28px_rgba(0,0,0,0.3)]">
            <h2 className="text-lg sm:text-xl font-bold text-white/95 mb-2">Objective</h2>
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#EAF6FF]">
              Pocket all of your group of balls
              <span className="mx-1 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-cyan-200">
                solids 1–7
              </span>
              or
              <span className="mx-1 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-fuchsia-200">
                stripes 9–15
              </span>
              and then legally pocket the
              <span className="ml-1 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-amber-200">
                8‑ball
              </span>
              to win.
            </p>
          </div>
        </section>

        {/* Game Setup */}
        <section className="relative">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-5 shadow-[0_10px_28px_rgba(0,0,0,0.3)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white/95">Game Setup</h2>
              <span className="text-[11px] sm:text-xs text-white/60">Quick start checklist</span>
            </div>

            <ol className="space-y-2.5 sm:space-y-3">
              {[ 
                'Balls are racked in a triangle with the 8‑ball in the center.',
                'The first ball (apex) sits on the foot spot.',
                'One solid and one stripe go in the bottom corners.',
                'Players decide who breaks (coin toss or lag shot).',
              ].map((text, i) => (
                <li key={i} className="group flex items-start gap-3 sm:gap-3.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-white text-xs sm:text-sm font-extrabold shadow-[0_3px_10px_rgba(56,189,248,0.28)]">
                    {i + 1}
                  </span>
                  <div className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm sm:text-[15px] text-[#EAF6FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    {text}
                  </div>
                </li>
              ))}
            </ol>

          </div>
        </section>
      </div>
    </div>
  )
}
