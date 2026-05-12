import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Wallet, BookOpen, ChevronRight, Gamepad2, Crosshair } from "lucide-react";
import { useBlockchainToast } from "../context/BlockchainToastContext";
import {
  loginWithWallet,
  getPlayerData,
  getToken,
  getWalletAddress,
  getDaSnapshot,
  getTokenWalletAddress,
  setToken,
  getPlayerStats,
  getLeaderboard
} from "../lib/api";
import { getJwtFromUrl } from "../lib/session";

import bg from "../assets/bg.png";
import logo from "../assets/logo.png";
import ogLogo from "../assets/ogLogo.png";
import kultOgLogo from "../assets/kultOgLogo.png";
import kultLogo from "../assets/kultLogo.png";
import leaderboardFrame from "../assets/leaderboardFrame.png";
import profileIcon from "../assets/profileIcon.png";
import tableNFT from "../assets/tableNFT.png";
import trophyIcon from "../assets/trophy.png";
import ball1 from "../assets/balls/ball-1.png";

import LoginModal from "../components/LoginModal";
import ReferralModal from "../components/ReferralModal";

const SceneBackground = lazy(() =>
  import("../components/SceneBackground").then((m) => ({ default: m.SceneBackground }))
);

function Bg({ variant, className }: { variant: "hero" | "features" | "how" | "leaderboard" | "nft" | "cta"; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <SceneBackground variant={variant} className={className} />
    </Suspense>
  );
}

function ConnectBtn({
  size = "md",
  label,
  onClick,
  authenticated
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  onClick?: () => void;
  authenticated?: boolean;
}) {
  const sz = size === "sm" ? "neon-btn-sm" : size === "lg" ? "neon-btn-lg" : "";
  const displayLabel = label || (authenticated ? "Play Now" : "Connect Wallet");

  return (
    <button onClick={onClick} className={`neon-btn neon-btn-primary ${sz}`}>
      <span className="neon-btn-shine" />
      <Wallet size={size === "lg" ? 20 : 16} />
      <span>{displayLabel}</span>
      <ChevronRight size={size === "lg" ? 18 : 14} className="opacity-80" />
    </button>
  );
}

const HARDCODED_LEADERBOARD: any[] = [
  { rank: 1, playerName: "NeonShark", totalBallsPocketed: 2840, totalGamesWon: 412 },
  { rank: 2, playerName: "VoidBreaker", totalBallsPocketed: 2755, totalGamesWon: 388 },
  { rank: 3, playerName: "CueGhost", totalBallsPocketed: 2698, totalGamesWon: 366 },
  { rank: 4, playerName: "0xSnooker", totalBallsPocketed: 2611, totalGamesWon: 341 },
  { rank: 5, playerName: "FeltKing", totalBallsPocketed: 2589, totalGamesWon: 328 },
];

function ManualBtn({ size = "md", onClick }: { size?: "sm" | "md" | "lg"; onClick?: () => void }) {
  const sz = size === "sm" ? "neon-btn-sm" : size === "lg" ? "neon-btn-lg" : "";
  return (
    <button onClick={onClick} className={`neon-btn neon-btn-ghost ${sz}`}>
      <span className="neon-btn-shine" />
      <BookOpen size={size === "lg" ? 20 : 16} />
      <span>Game Manual</span>
    </button>
  );
}

function LeaderboardBtn({ size = "md", onClick }: { size?: "sm" | "md" | "lg"; onClick?: () => void }) {
  const sz = size === "sm" ? "neon-btn-sm" : size === "lg" ? "neon-btn-lg" : "";
  return (
    <button onClick={onClick} className={`neon-btn neon-btn-primary ${sz}`}>
      <span className="neon-btn-shine" />
      <div className="flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <span>Leaderboard</span>
      </div>
    </button>
  );
}

export default function HomePage() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { showToast } = useBlockchainToast();
  const [showLogin, setShowLogin] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [hasShownLoginToast, setHasShownLoginToast] = useState(false);

  // Profile state
  const [wins, setWins] = useState<number | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>(HARDCODED_LEADERBOARD);

  const navigate = useNavigate();
  const token = getToken();

  const sessionConnected = (() => {
    try {
      return localStorage.getItem('wallet_connected') === 'true';
    } catch {
      return false;
    }
  })();

  const connectedAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!w.address)?.address ||
    getWalletAddress();

  const shortAddress = (() => {
    const a = connectedAddress || '';
    return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
  })();

  const displayName = (() => {
    if (playerName && playerName.length > 13) return playerName.slice(0, 13) + '...';
    return playerName || '';
  })();

  const isAuthenticated = authenticated || Boolean(token) || sessionConnected;

  useEffect(() => {
    const jwt = getJwtFromUrl();
    if (jwt) {
      navigate({
        pathname: '/autologin',
        search: window.location.search,
        hash: window.location.hash,
      }, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!authenticated || !connectedAddress || hasShownLoginToast) return;

    const tokenWallet = getTokenWalletAddress();
    if (tokenWallet && tokenWallet !== connectedAddress.toLowerCase()) {
      setToken(null);
    } else if (getToken()) {
      setHasShownLoginToast(true);
      return;
    }

    const handlePrivyLogin = async () => {
      try {
        const loginResult = await loginWithWallet(connectedAddress);
        localStorage.setItem('wallet_connected', 'true');
        setHasShownLoginToast(true);

        if (loginResult?.blockchain?.txHash) {
          showToast({
            title: '🎮 Login Successful',
            description: 'Session recorded on 0G blockchain',
            txHash: loginResult.blockchain.txHash,
            type: 'blockchain',
            duration: 6000,
          });
        }

        showToast({
          title: '📡 Saving to 0G DA',
          description: 'Session data submitted to 0G Data Availability layer',
          txHash: null,
          type: 'da',
          duration: 5000,
        });

        const wallet = connectedAddress;
        let attempts = 0;
        const maxAttempts = 12;
        const poll = async () => {
          attempts += 1;
          const snap = await getDaSnapshot(wallet);
          const status = snap?.snapshot?.daStatus;
          if (status === 'confirmed' || status === 'finalized') {
            showToast({
              title: '✅ Saved on 0G DA',
              description: 'Session data confirmed on 0G Data Availability layer',
              txHash: null,
              type: 'da',
              duration: 7000,
            });
          } else if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
          }
        };
        setTimeout(poll, 5000);
      } catch (error) {
        console.error('Failed to show login toast:', error);
      }
    };

    handlePrivyLogin();
  }, [authenticated, connectedAddress, hasShownLoginToast, showToast]);

  // Fetch profile stats
  useEffect(() => {
    if (!isAuthenticated) {
      setWins(null);
      setCoins(null);
      setPlayerName(null);
      return;
    }
    let active = true;
    let attempts = 0;
    const load = () => {
      if (!active) return;
      const token = getToken();
      if (!token) {
        if (attempts < 6) {
          attempts += 1;
          setTimeout(load, 400);
        }
        return;
      }
      getPlayerData()
        .then((d) => {
          if (!active) return;
          setPlayerName((d as any)?.playerNames0 || null);
        })
        .catch(() => {});
      getPlayerStats()
        .then((s) => {
          if (!active) return;
          const totalWins = ((s?.totalGamesWonVsCPU || 0) + (s?.totalGamesWonVsHuman || 0)) as number;
          const totalCoins = (s?.totalBallsPocketed ?? 0) as number;
          setWins(totalWins);
          setCoins(totalCoins);
        })
        .catch(() => {});
    };
    load();
    return () => { active = false; };
  }, [isAuthenticated]);

  // Fetch leaderboard data
  useEffect(() => {
    let active = true;
    const fetchLB = async () => {
      if (!isAuthenticated) {
        setLeaderboardData(HARDCODED_LEADERBOARD);
        return;
      }

      try {
        const data = await getLeaderboard();
        if (active) {
          // If the real leaderboard is empty, keep the hardcoded ones to avoid blank UI
          setLeaderboardData(data.length > 0 ? data.slice(0, 5) : HARDCODED_LEADERBOARD);
        }
      } catch (err) {
        console.warn('Leaderboard fetch failed:', err);
        if (active) setLeaderboardData(HARDCODED_LEADERBOARD);
      }
    };
    fetchLB();
    return () => { active = false; };
  }, [isAuthenticated]);

  async function startSession() {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    let currentToken = getToken();
    let attempts = 0;
    while (!currentToken && attempts < 6) {
      await new Promise((r) => setTimeout(r, 250));
      currentToken = getToken();
      attempts += 1;
    }

    if (!currentToken) {
      navigate('/nft1');
      return;
    }

    try {
      const data = await getPlayerData();
      const hasName = !!(data && (data as any).playerNames0 && String((data as any).playerNames0).trim());
      navigate(hasName ? '/game' : '/nft1');
    } catch {
      navigate('/nft1');
    }
  }


  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[oklch(0.08_0.06_270)] text-white font-sans">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[oklch(0.08_0.06_270/0.6)] border-b border-[oklch(0.85_0.18_210/0.1)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
            <img
              src={logo}
              alt="Zero G Pool"
              className="h-8 w-auto sm:h-10 transition group-hover:scale-105 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]"
            />
            <span className="h-6 sm:h-8 w-px bg-gradient-to-b from-transparent via-[oklch(0.85_0.18_210/0.6)] to-transparent" />
            <img
              src={kultOgLogo}
              alt="Kult Games × 0G"
              className="h-5 sm:h-7 w-auto opacity-90 transition group-hover:opacity-100 group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]"
            />
          </a>

          <div className="flex items-center gap-4 shrink-0">
            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-3 mr-2 md:flex">
                  <div className="flex items-center gap-2 bg-indigo-600/80 rounded-xl px-3 py-1.5 ring-1 ring-white/20 shadow-md backdrop-blur-sm">
                    <img src={trophyIcon} alt="Wins" className="h-5 w-5" />
                    <span className="text-white text-xs font-extrabold uppercase tracking-tight">{(wins ?? 0).toLocaleString()} WINS</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600/80 rounded-xl px-3 py-1.5 ring-1 ring-white/20 shadow-md backdrop-blur-sm">
                    <img src={ball1} alt="Balls" className="h-5 w-5" />
                    <span className="text-white text-xs font-extrabold uppercase tracking-tight">{(coins ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <span className="hidden sm:inline-flex rounded-full border border-cyan-300/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-200 backdrop-blur-sm">
                  Secured on 0G
                </span>
                <Link to="/profile" className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600/60 to-cyan-600/60 backdrop-blur-md rounded-2xl p-1.5 sm:pr-4 ring-1 ring-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition hover:scale-105 hover:brightness-110">
                  <div className="relative">
                    <img src={profileIcon} alt="Profile" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-cyan-400/50 object-cover" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 to-transparent pointer-events-none" />
                  </div>
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-white text-xs font-bold tracking-tight">{displayName || shortAddress || 'Connected'}</span>
                    <span className="text-white/60 text-[10px] font-mono">{shortAddress}</span>
                  </div>
                </Link>
              </>
            ) : (
              <ConnectBtn size="sm" onClick={startSession} authenticated={isAuthenticated} />
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="top"
        className="relative flex min-h-[100svh] items-start justify-center overflow-hidden pb-28 pt-36 sm:min-h-screen sm:pb-24 sm:pt-32"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:center_top] sm:bg-center"
          style={{ backgroundImage: `url(${bg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.06_270/0.72)] via-[oklch(0.1_0.08_270/0.34)] to-[oklch(0.04_0.04_270/0.98)]" />
        <Bg variant="hero" className="opacity-45 sm:opacity-100" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="pointer-events-none absolute inset-x-6 top-28 h-px bg-gradient-to-r from-transparent via-[oklch(0.85_0.18_210/0.65)] to-transparent sm:hidden" />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[oklch(0.85_0.18_210/0.35)] bg-[oklch(0.1_0.08_270/0.55)] px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.24em] text-[oklch(0.85_0.18_210)] shadow-[0_0_24px_oklch(0.85_0.18_210/0.18)] backdrop-blur-md sm:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.28_340)] shadow-[0_0_12px_oklch(0.7_0.28_340)]" />
            Verified Pool Arena
          </div>

          <div className="relative overflow-visible group">
            {/* Enhanced Manual Glow Layers (Behind Logo) */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              {/* Primary Cyan Glow */}
              <div className="h-[70%] w-[70%] animate-pulse rounded-full bg-[oklch(0.85_0.18_210/0.45)] blur-[58px] transition-all duration-700 group-hover:bg-[oklch(0.85_0.18_210/0.8)] group-hover:blur-[140px] sm:blur-[120px]" />
              {/* Secondary Magenta Glow (for depth) */}
              <div className="absolute h-[50%] w-[50%] animate-pulse rounded-full bg-[oklch(0.7_0.28_340/0.28)] blur-[44px] transition-all duration-700 group-hover:bg-[oklch(0.7_0.28_340/0.6)] group-hover:blur-[110px] sm:blur-[100px] [animation-delay:1s]" />
              {/* Interactive Hover Explosion */}
              <div className="absolute h-[40%] w-[40%] rounded-full bg-white/0 blur-[20px] transition-all duration-500 group-hover:bg-white/20 group-hover:h-[80%] group-hover:w-[80%] group-hover:blur-[100px]" />
              {/* Core White Shine */}
              <div className="absolute h-[30%] w-[30%] rounded-full bg-white/10 blur-[40px]" />
            </div>
            <img
              src={logo}
              alt="Zero G Pool"
              className="animate-float w-full max-w-[88vw] sm:max-w-[420px] md:max-w-[580px] lg:max-w-[680px] transition-transform duration-500 hover:scale-[1.03] border-none outline-none ring-0 pointer-events-auto"
            />
          </div>

          <p className="mx-auto mt-5 max-w-2xl rounded-2xl border border-[oklch(0.85_0.18_210/0.18)] bg-[oklch(0.08_0.06_270/0.48)] px-4 py-3 text-base font-semibold leading-relaxed text-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-md sm:mt-8 sm:border-0 sm:bg-transparent sm:px-2 sm:py-0 sm:text-lg sm:font-medium sm:text-white/80 sm:shadow-none sm:backdrop-blur-0 md:text-xl">
            The first <span className="text-[oklch(0.85_0.18_210)] neon-text">on-chain 8-ball arena</span>.
            Every shot verified. Every victory remembered.
          </p>

          <div className="mt-7 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <ConnectBtn size="lg" onClick={startSession} authenticated={isAuthenticated} />
            {isAuthenticated && <LeaderboardBtn size="lg" onClick={() => navigate('/leaderboard')} />}
            <ManualBtn size="lg" onClick={() => navigate('/rules')} />
          </div>

          <div className="mt-7 grid w-full max-w-sm grid-cols-3 gap-2 sm:hidden">
            {["0G Verified", "AI Ready", "Ranked Play"].map((label) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/75 backdrop-blur-md">
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 sm:bottom-6 sm:text-xs whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.85_0.18_210)]/50 animate-pulse" />
          Powered by <img src={ogLogo} alt="0G" className="h-3.5 w-auto opacity-60 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
        </div>
      </section>



      {/* Powered by 0G Section */}
      <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
        <Bg variant="features" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.06_270/0.7)] via-transparent to-[oklch(0.08_0.06_270/0.7)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center sm:mb-16">
            {/* <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-[oklch(0.85_0.18_210)]">
              // Powered by <img src={ogLogo} alt="0G" className="h-3.5 w-auto drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            </div> */}
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white md:text-5xl lg:text-6xl">
              Built on the <span className="shine-text">0G Stack</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl px-2 text-sm text-white/60 sm:text-base">
              The first modular AI Layer-1. Compute, storage and data availability — the three pillars that make Zero G Pool unstoppable.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {[
              {
                tag: "Compute",
                title: "Verifiable Compute",
                desc: (
                  <>
                    Every shot, spin, and physics tick runs on <img src={ogLogo} alt="0G" className="inline-block h-3.5 w-auto align-baseline mx-0.5 translate-y-[1px]" />'s decentralized compute network — provably fair, never tampered.
                  </>
                ),
                icon: (
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" /><path d="M3 9h2M3 15h2M19 9h2M19 15h2M9 3v2M15 3v2M9 19v2M15 19v2" />
                  </svg>
                ),
                color: "oklch(0.85 0.18 210)",
              },
              {
                tag: "Storage",
                title: "On-Chain Storage",
                desc: (
                  <>
                    Tables, match replays, and player profiles stored permanently on <img src={ogLogo} alt="0G" className="inline-block h-3.5 w-auto align-baseline mx-0.5 translate-y-[1px]" />'s hyperscale storage layer.
                  </>
                ),
                icon: (
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                  </svg>
                ),
                color: "oklch(0.7 0.28 340)",
              },
              {
                tag: "DA",
                title: "Data Availability",
                desc: "Match state guaranteed available to every node — no rugs, no rewinds, instant settlement at scale.",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                  </svg>
                ),
                color: "oklch(0.65 0.22 295)",
              },
            ].map((p) => (
              <div key={p.tag} className="glass-card hover-lift group relative overflow-hidden rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl border transition group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      color: p.color,
                      borderColor: `color-mix(in oklab, ${p.color} 50%, transparent)`,
                      background: `color-mix(in oklab, ${p.color} 12%, transparent)`,
                      boxShadow: `0 0 25px color-mix(in oklab, ${p.color} 35%, transparent)`,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[oklch(0.85_0.18_210/0.3)] bg-[oklch(0.1_0.08_270/0.7)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: p.color }}>
                    <img src={ogLogo} alt="" className="h-2.5 w-auto" />
                    {p.tag}
                  </div>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold uppercase text-white transition group-hover:text-[oklch(0.85_0.18_210)]">{p.title}</h3>
                <div className="mt-4 text-sm leading-relaxed text-white/60">
                  {p.desc}
                </div>
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl transition group-hover:scale-150" style={{ background: `color-mix(in oklab, ${p.color} 25%, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
        <Bg variant="how" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.85_0.18_210/0.5)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.06_270/0.7)] via-transparent to-[oklch(0.08_0.06_270/0.7)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[oklch(0.7_0.28_340)]">// Workflow</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white md:text-5xl lg:text-6xl">
              The <span className="text-[oklch(0.85_0.18_210)] neon-text">Game Loop</span>
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Connect Wallet",
                Icon: Wallet,
                tone: "oklch(0.85 0.18 210)",
                d: (
                  <>
                    Plug in any <img src={ogLogo} alt="0G" className="inline-block h-3 w-auto align-baseline mx-1" /> wallet via Privy. Zero friction onboarding.
                  </>
                )
              },
              { n: "02", t: "Pick Your Mode", Icon: Gamepad2, tone: "oklch(0.7 0.28 340)", d: "Free-play, ranked, or AI-powered matches - your call." },
              { n: "03", t: "Run The Table", Icon: Crosshair, tone: "oklch(0.72 0.2 150)", d: "Aim, line it up, and sink it. Every match gets recorded on 0G." },
            ].map((s, i) => {
              const Icon = s.Icon;
              return (
              <div key={s.n} className="relative h-full">
                <div className="glass-card hover-lift group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-2xl border border-[oklch(0.85_0.18_210/0.25)] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition duration-500 hover:-translate-y-2 hover:border-[oklch(0.85_0.18_210/0.7)] sm:p-8">
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full blur-3xl transition duration-500 group-hover:scale-125"
                    style={{ background: `color-mix(in oklab, ${s.tone} 30%, transparent)` }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),transparent_34%)] opacity-70" />
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${s.tone}, transparent)` }}
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-black/30 shadow-[0_0_30px_rgba(34,211,238,0.22)] backdrop-blur-sm transition duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{ color: s.tone, borderColor: `color-mix(in oklab, ${s.tone} 55%, transparent)` }}
                    >
                      <Icon size={28} strokeWidth={1.8} />
                    </div>
                    <div className="font-display text-6xl font-black leading-none text-transparent transition duration-500 group-hover:scale-110" style={{ WebkitTextStroke: `1px color-mix(in oklab, ${s.tone} 80%, transparent)` }}>{s.n}</div>
                  </div>

                  <div className="relative mt-auto pt-10">
                    <h3 className="font-display text-xl font-bold uppercase text-white transition group-hover:text-[oklch(0.85_0.18_210)]">{s.t}</h3>
                    <div className="mt-3 text-base leading-relaxed text-white/65">{s.d}</div>
                  </div>
                  <div
                    className="pointer-events-none absolute bottom-0 left-8 right-8 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${s.tone}, transparent)` }}
                  />
                </div>
                {i < 2 && <div className="absolute top-1/2 -right-4 hidden h-px w-8 bg-gradient-to-r from-[oklch(0.85_0.18_210)] to-transparent md:block" />}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section id="leaderboard" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
        <Bg variant="leaderboard" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.06_270/0.7)] via-transparent to-[oklch(0.08_0.06_270/0.7)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[oklch(0.85_0.18_210)]">// Hall of Fame</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white md:text-5xl lg:text-6xl">
              Top of the <span className="shine-text">Table</span>
            </h2>
          </div>

          <div className="relative">
            <img src={leaderboardFrame} alt="" className="hidden w-full lg:block" />
            <div className="absolute inset-0 hidden p-[6%] lg:block">
              <div className="flex h-full flex-col justify-center gap-2 px-8">
                {leaderboardData.map((p, idx) => (
                  <div key={idx} className="group flex items-center gap-4 rounded-xl border border-[oklch(0.85_0.18_210/0.2)] bg-[oklch(0.15_0.1_270/0.4)] px-4 py-2 transition duration-300 hover:border-[oklch(0.7_0.28_340/0.8)] hover:bg-[oklch(0.15_0.1_270/0.8)] hover:translate-x-1 hover:shadow-[0_0_25px_oklch(0.7_0.28_340/0.4)]">
                    <div className="font-display w-8 text-lg font-black text-[oklch(0.85_0.18_210)] transition group-hover:scale-125">#{p.rank || idx + 1}</div>
                    <img src={profileIcon} alt="" className="h-10 w-10 rounded-full border border-[oklch(0.85_0.18_210/0.4)] transition group-hover:border-[oklch(0.7_0.28_340)]" />
                    <div className="flex-1 font-display text-base font-bold uppercase text-white transition group-hover:text-[oklch(0.85_0.18_210)] truncate">
                      {p.playerName || 'Anonymous'}
                    </div>
                    <div className="hidden text-xs text-white/60 sm:block">{(p as any).totalGamesWon ?? 0} W</div>
                    <div className="font-display text-base font-bold text-[oklch(0.7_0.28_340)] transition group-hover:scale-110">
                      {(p as any).totalBallsPocketed ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile Leaderboard */}
            <div className="lg:hidden glass-card rounded-2xl p-4">
               <div className="flex flex-col gap-2">
                 {leaderboardData.map((p, idx) => (
                   <div key={idx} className="flex items-center gap-3 p-2 border-b border-white/5 last:border-0">
                     <span className="text-sm font-bold text-[oklch(0.85_0.18_210)]">#{ (p as any).rank || idx + 1}</span>
                     <span className="text-sm font-medium truncate">{(p as any).playerName || 'Player'}</span>
                     <span className="ml-auto text-xs font-bold text-[oklch(0.7_0.28_340)]">{(p as any).totalBallsPocketed ?? 0}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/leaderboard" className="text-xs uppercase tracking-widest text-[oklch(0.85_0.18_210)] hover:text-white transition">View Full Leaderboard →</Link>
          </div>
        </div>
      </section>

      {/* NFT Section */}
      <section id="nft" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
        <Bg variant="nft" />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.06_270/0.7)] via-transparent to-[oklch(0.08_0.06_270/0.7)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[oklch(0.7_0.28_340)]">// Collectibles</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white md:text-5xl lg:text-6xl">
               <span className="shine-text">Precision Strategy Victory</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg text-white/70">
              Every shot verified. Every victory remembered.
            </p>
            <ul className="mt-8 space-y-3 text-white/80">
              {["Provable rarity & on-chain stats", "Custom tables & player identity", "AI-powered gameplay experiences"].map((x) => (
                <li key={x} className="group flex items-center gap-3 transition hover:translate-x-2 hover:text-white">
                  <span className="inline-block h-1.5 w-6 bg-gradient-to-r from-[oklch(0.7_0.28_340)] to-[oklch(0.85_0.18_210)] transition group-hover:w-10 group-hover:shadow-[0_0_10px_oklch(0.85_0.18_210/0.8)]" />
                  {x}
                </li>
              ))}
            </ul>
            {/* <div className="mt-10">
              <ConnectBtn label="View Marketplace" size="lg" onClick={() => navigate('/paidNFT')} />
            </div> */}
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute h-80 w-80 rounded-full bg-[oklch(0.7_0.28_340/0.3)] blur-3xl animate-pulse" />
            <div className="absolute h-96 w-96 rounded-full bg-[oklch(0.55_0.25_265/0.3)] blur-3xl" />
            <div className="animate-float group relative w-full max-w-md transition duration-500 hover:scale-105 hover:rotate-3">
              <img src={tableNFT} alt="Zero G NFT Table" className="relative w-full drop-shadow-[0_20px_60px_rgba(120,40,200,0.6)]" />
              <img
                src={kultOgLogo}
                alt="Kult Games x 0G"
                className="pointer-events-none absolute left-1/2 top-[38%] w-[42%] -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] transition duration-500 group-hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="relative border-t border-[oklch(0.85_0.18_210/0.15)] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Zero G Pool" className="h-10 w-auto" />
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">© 2025 Zero G Pool</span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-8">
            <a href="https://x.com/_KultGames" target="_blank" rel="noopener noreferrer" className="group p-2 transition-all duration-300 hover:scale-125">
              <svg className="h-5 w-5 fill-white/40 transition-all group-hover:fill-[oklch(0.85_0.18_210)] group-hover:drop-shadow-[0_0_8px_oklch(0.85_0.18_210/0.6)]" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://discord.com/invite/Cge7rrCyUB" target="_blank" rel="noopener noreferrer" className="group p-2 transition-all duration-300 hover:scale-125">
              <svg className="h-6 w-6 fill-white/40 transition-all group-hover:fill-[oklch(0.85_0.18_210)] group-hover:drop-shadow-[0_0_8px_oklch(0.85_0.18_210/0.6)]" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.666 4.37a.07.07 0 0 0-.032.027C1.059 8.255.366 12.042.7 15.783a.084.084 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993.023.033.07.044.103.028a19.811 19.811 0 0 0 6.002-3.03.085.085 0 0 0 .032-.054c.5-4.361-.845-8.127-3.676-11.413a.06.06 0 0 0-.032-.027ZM8.02 13.793c-1.185 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.185 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z" />
              </svg>
            </a>
            <a href="https://t.me/KultGamesOfficial" target="_blank" rel="noopener noreferrer" className="group p-2 transition-all duration-300 hover:scale-125">
              <svg className="h-6 w-6 fill-white/40 transition-all group-hover:fill-[oklch(0.85_0.18_210)] group-hover:drop-shadow-[0_0_8px_oklch(0.85_0.18_210/0.6)]" viewBox="0 0 24 24">
                <path d="M11.944 0C5.346 0 0 5.346 0 11.944s5.346 11.944 11.944 11.944 11.944-5.346 11.944-11.944S18.542 0 11.944 0zm5.836 8.353l-1.99 9.382c-.145.65-.533.811-1.077.505l-3.032-2.235-1.463 1.408c-.161.161-.297.297-.61.297l.217-3.084 5.613-5.07c.244-.217-.053-.337-.378-.12l-6.938 4.368-2.989-.933c-.65-.203-.662-.65.136-.961l11.684-4.503c.541-.203 1.013.12 0 .947z" />
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
            <span>Powered by</span>
            <img src={kultLogo} alt="Kult Games" className="h-5 w-auto opacity-80" />
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} />

      {/* Referral Button (Floating) */}
      <button
        onClick={() => setShowReferral(true)}
        className="fixed left-6 bottom-6 z-40 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-5 py-2.5 hover:bg-black/60 text-white text-xs font-bold tracking-widest flex items-center gap-2 transition-all hover:scale-105"
      >
        <span className="text-lg">🎁</span> REFERRAL
      </button>
    </div>
  );
}
