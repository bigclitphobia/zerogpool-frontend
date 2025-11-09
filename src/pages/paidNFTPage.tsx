import React, { useMemo, useState } from 'react'
import poolTableNFT from '../assets/tableNFT.png'
import btnFrame from '../assets/btnFrame.png'
// import ButtonFrame from '../assets/btnFrame.png';


type Category = 'color' | 'pattern' | 'diamonds' | 'name' | 'avatar' | 'cues'

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-white text-xl sm:text-2xl font-extrabold tracking-[0.18em] mb-3" style={{ textShadow: '0 0 18px rgba(0,140,255,0.6)' }}>{children}</h2>
)

function FrameButton({ label, onClick, active, width = 140 }: { label: string; onClick?: () => void; active?: boolean; width?: number }) {
  return (
    <button onClick={onClick} className={`relative inline-block active:scale-[0.98] ${active ? 'brightness-110' : ''}`} style={{ width }}>
      <img src={btnFrame} alt={label} className="w-full h-auto select-none pointer-events-none drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]" />
      <span className={`absolute inset-0 flex items-center justify-center text-white font-extrabold tracking-[0.18em] text-xs sm:text-sm ${active ? 'text-cyan-100' : 'text-white'}`}>{label}</span>
    </button>
  )
}

function Tabs({ active, onSelect }: { active: Category; onSelect: (c: Category) => void }) {
  const items: { key: Category; label: string }[] = [
    { key: 'color', label: 'COLOR' },
    { key: 'pattern', label: 'PATTERN' },
    { key: 'diamonds', label: 'DIAMONDS' },
    { key: 'name', label: 'NAME' },
    { key: 'avatar', label: 'AVATAR' },
    { key: 'cues', label: 'CUES' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {items.map((it) => (
        <FrameButton key={it.key} label={it.label} active={active === it.key} onClick={() => onSelect(it.key)} />
      ))}
    </div>
  )
}

function Capsule({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-2 text-white/90 ${
        selected ? 'border-cyan-400 bg-white/10' : 'border-white/25 bg-black/30 hover:bg-black/40'
      }`}
    >
      {children}
    </button>
  )
}

function ColorOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const colors = [
    { name: 'Red', swatch: '#e11d48' },
    { name: 'Green', swatch: '#16a34a' },
    { name: 'Yellow', swatch: '#eab308' },
    { name: 'Blue', swatch: '#2563eb' },
  ]
  return (
    <div>
      <SectionTitle>Choose Color</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {colors.map((c) => (
          <Capsule key={c.name} selected={value === c.name} onClick={() => onChange(c.name)}>
            <span className="inline-block h-5 w-5 rounded-full" style={{ background: c.swatch }} />
            <span className="font-semibold">{c.name}</span>
            <span className="ml-auto text-xs opacity-70">(Free)</span>
          </Capsule>
        ))}
      </div>
    </div>
  )
}

function PatternOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = ['None', '$1', '$3', '$5', '$7', '$8', '$10']
  return (
    <div>
      <SectionTitle>Choose Pattern</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((p) => (
          <Capsule key={p} selected={value === p} onClick={() => onChange(p)}>
            <span className="font-semibold">{p === 'None' ? 'None' : p}</span>
          </Capsule>
        ))}
      </div>
    </div>
  )
}

function DiamondsOptions({ value, onChange }: { value: 'Yes' | 'No'; onChange: (v: 'Yes' | 'No') => void }) {
  return (
    <div>
      <SectionTitle>Diamonds</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Capsule selected={value === 'Yes'} onClick={() => onChange('Yes')}>
          <span className="font-semibold">Yes</span>
          <span className="ml-1 text-xs opacity-70">($1)</span>
        </Capsule>
        <Capsule selected={value === 'No'} onClick={() => onChange('No')}>
          <span className="font-semibold">No</span>
          <span className="ml-1 text-xs opacity-70">(Free)</span>
        </Capsule>
      </div>
    </div>
  )
}

function NameOption({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <SectionTitle>Enter Your Table Name</SectionTitle>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="eg: Galaxy Hustler"
        className="w-full rounded-xl bg-black/30 border border-white/20 px-4 py-2.5 text-white/90 outline-none focus:border-cyan-400"
      />
    </div>
  )
}

function AvatarOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const prices = ['Free', '$2', '$4', '$6', '$8', '$10']
  return (
    <div>
      <SectionTitle>Avatar</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {prices.map((p) => (
          <Capsule key={p} selected={value === p} onClick={() => onChange(p)}>
            <span className="font-semibold">{p}</span>
          </Capsule>
        ))}
      </div>
    </div>
  )
}

function CuesOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const prices = ['Free', '$4', '$8', '$12', '$16', '$20']
  return (
    <div>
      <SectionTitle>Cues</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {prices.map((p) => (
          <Capsule key={p} selected={value === p} onClick={() => onChange(p)}>
            <span className="font-semibold">{p}</span>
          </Capsule>
        ))}
      </div>
    </div>
  )
}

export default function PaidNFTPage() {
  const [active, setActive] = useState<Category>('color')
  const [color, setColor] = useState('Red')
  const [pattern, setPattern] = useState('None')
  const [diamonds, setDiamonds] = useState<'Yes' | 'No'>('No')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('Free')
  const [cues, setCues] = useState('Free')

  const Summary = useMemo(
    () => (
      <div className="mt-4 sm:mt-5 rounded-xl border border-white/15 bg-black/30 p-3 text-white/90 text-sm sm:text-base">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-4 rounded-full ring-1 ring-white/30" style={{ background: color.toLowerCase() }} />
            <span className="opacity-80">Color:</span>
            <span className="font-extrabold text-cyan-200">{color}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Pattern:</span>
            <span className="font-extrabold text-cyan-200">{pattern}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Diamonds:</span>
            <span className={`font-extrabold ${diamonds === 'Yes' ? 'text-cyan-300' : 'text-white/90'}`}>{diamonds}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Name:</span>
            <span className="font-extrabold text-white/95">{name || 'Enter your table name'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Avatar:</span>
            <span className="font-extrabold text-cyan-200">{avatar}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Cues:</span>
            <span className="font-extrabold text-cyan-200">{cues}</span>
          </div>
        </div>
      </div>
    ),
    [color, pattern, diamonds, name, avatar, cues]
  )

  return (
    <div className="w-full h-full md:overflow-hidden overflow-auto flex items-start justify-center px-3 sm:px-4 md:px-6">
      <div className="w-full max-w-6xl mt-2 sm:mt-3">
        {/* Outer neon card */}
        <div className="rounded-[22px] p-[2px] bg-gradient-to-b from-[#008CFF]/90 via-[#008CFF]/30 to-transparent shadow-[0_0_36px_rgba(0,140,255,0.45)] md:max-h-[calc(100vh-6rem)] md:overflow-hidden">
          <div className="rounded-[20px] bg-[#08002D]/90 border border-white/10 p-4 sm:p-5 md:p-6 h-full">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-5 h-full md:min-h-0">
              {/* Left: controls */}
              <div className="md:min-h-0 md:overflow-auto pr-1">
                <h1 className="text-center md:text-left text-white text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.18em] mb-4" style={{ textShadow: '0 0 22px rgba(0,140,255,0.6)' }}>
                  Customize Your Table
                </h1>
                <Tabs active={active} onSelect={setActive} />

                <div className="mt-5 min-h-[260px] sm:min-h-[300px] md:min-h-[240px] md:max-h-[260px] overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                  {active === 'color' && <ColorOptions value={color} onChange={setColor} />}
                  {active === 'pattern' && <PatternOptions value={pattern} onChange={setPattern} />}
                  {active === 'diamonds' && <DiamondsOptions value={diamonds} onChange={setDiamonds} />}
                  {active === 'name' && <NameOption value={name} onChange={setName} />}
                  {active === 'avatar' && <AvatarOptions value={avatar} onChange={setAvatar} />}
                  {active === 'cues' && <CuesOptions value={cues} onChange={setCues} />}
                </div>

                {Summary}
              </div>

              {/* Right: preview */}
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-[16px] p-[3px] bg-gradient-to-b from-[#008CFF]/80 to-transparent">
                  <div className="rounded-[14px] border border-white/10 bg-black/40 px-4 py-4">
                    <img src={poolTableNFT} alt="Table preview" className="w-48 sm:w-56 md:w-64 h-auto object-contain" />
                  </div>
                </div>
                <div className="mt-3">
                  <FrameButton label="MINT TABLE" width={180} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
