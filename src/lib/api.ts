// Lightweight API client and auth token utilities

const configuredApiBase = String(
  (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000/api'
).replace(/\/+$/, '')
/** Normalized `/api` base (used by game manifest + other clients). */
export const API_BASE = configuredApiBase.endsWith('/api') ? configuredApiBase : `${configuredApiBase}/api`
const TOKEN_KEY = 'jwt_token'
const WALLET_KEY = "walletAddress"

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore storage errors
  }
}

export function getWalletAddress(): string | null {
  try {
    return localStorage.getItem(WALLET_KEY)
  } catch {
    return null
  }
}

export function setWalletAddress(wallet: string | null) {
  try {
    if (!wallet) localStorage.removeItem(WALLET_KEY)
    else localStorage.setItem(WALLET_KEY, wallet)
  } catch {
    // ignore storage errors
  }
}

export function clearClientAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(WALLET_KEY)
    localStorage.removeItem('wallet_connected')
    localStorage.removeItem('username')
  } catch {
    // ignore storage errors
  }
}

/** Decode the wallet address embedded in the stored JWT without verifying the signature. */
export function getTokenWalletAddress(): string | null {
  try {
    const token = getToken()
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload.walletAddress as string)?.toLowerCase() || null
  } catch {
    return null
  }
}

type RequestOptions = RequestInit & { auth?: boolean }

async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.headers) Object.assign(headers, opts.headers as any)
  if (opts.auth) {
    const token = getToken()
    if (!token) {
      throw new Error(
        'Not signed in (missing session). Connect your wallet and complete login, then try again.',
      )
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  const data = await res.json().catch(() => ({}))

  // Token expired or invalid — clear it and redirect to home so the user re-authenticates
  if (res.status === 401 && opts.auth) {
    setToken(null)
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/')) {
      window.location.href = '/'
    }
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok || data?.success === false) {
    const err = (data && (data.error || data.message)) || res.statusText
    throw new Error(typeof err === 'string' ? err : 'Request failed')
  }
  return data
}

// Auth - NOW RETURNS BLOCKCHAIN DATA
export async function loginWithWallet(walletAddress: string): Promise<{ 
  token: string;
  blockchain?: {
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    onChainLoginCount?: number;
  }
} | null> {
  const body = JSON.stringify({ walletAddress })
  const data: any = await request('/auth/login', { method: 'POST', body })
  const token = data?.data?.token
  const _walletAddress = data?.data?.walletAddress
  const blockchain = data?.blockchain
  
  console.log("Login response:", data)
  console.log("Blockchain data:", blockchain)
  
  if (_walletAddress) setWalletAddress(_walletAddress)
  if (token) setToken(token)
  
  return token ? { token, blockchain } : null
}

// V2 Login for autologin support
export async function loginV2(payload: { jwt?: string; walletAddress?: string; source?: string }): Promise<{ 
  token: string;
  username?: string;
  blockchain?: {
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    onChainLoginCount?: number;
  }
} | null> {
  const body = JSON.stringify(payload)
  const data: any = await request('/v2/login', { method: 'POST', body })
  const token = data?.data?.token
  const walletAddress = data?.data?.walletAddress
  const blockchain = data?.blockchain
  
  console.log("V2 Login response:", data)
  console.log("Blockchain data:", blockchain)
  
  if (walletAddress) setWalletAddress(walletAddress)
  if (token) setToken(token)
  
  return token ? { token, blockchain } : null
}

// Player profile
export async function getPlayerData(): Promise<{ playerNames0?: string } | null> {
  const data: any = await request('/player/data', { method: 'GET', auth: true })
  return data?.data || null
}

export async function updatePlayerName(playerNames0: string): Promise<{ playerNames0: string }> {
  const body = JSON.stringify({ playerNames0 })
  const data: any = await request('/player/name', { method: 'POST', body, auth: true })
  return data?.data
}

// Player stats
export async function getPlayerStats(statType?: string): Promise<any> {
  const qs = statType ? `?statType=${encodeURIComponent(statType)}` : ''
  const data: any = await request(`/player/stats${qs}`, { method: 'GET', auth: true })
  return data?.data
}

// Leaderboard (public)
export type LeaderboardRow = {
  rank: number
  walletAddress: string
  playerName: string
  totalBallsPocketed: number
  totalGamesWon: number
  trust?: {
    antiCheatSource: string | null
    antiCheatCheckedAt: string | null
    saveBackedBy0g: boolean
  }
  intelligence?: {
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro'
  }
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const data: any = await request('/leaderboard', { method: 'GET', auth: true })
  return data?.data || []
}

export type LeaderboardAiComment = {
  comment: string | null
  source: string | null
}

export async function getLeaderboardAiComment(walletAddress: string): Promise<LeaderboardAiComment | null> {
  if (!walletAddress) return null
  try {
    const data: any = await request(
      `/leaderboard/ai-comment?wallet=${encodeURIComponent(walletAddress)}`,
      { method: 'GET', auth: true },
    )
    return {
      comment: data?.comment ?? null,
      source: data?._meta?.source ?? null,
    }
  } catch {
    return null
  }
}

// DA snapshot
export type DaSnapshot = {
  eventId?: string
  eventType?: string
  daStatus?: string
  daReference?: string
  submittedAt?: string
  trigger?: string
}

export async function getDaSnapshot(walletAddress: string): Promise<{ snapshot: DaSnapshot | null; history: DaSnapshot[] } | null> {
  if (!walletAddress) return null
  try {
    const data: any = await request(`/da/snapshot?wallet=${encodeURIComponent(walletAddress)}`, {
      method: 'GET',
      auth: true,
    })
    return { snapshot: data?.snapshot || null, history: data?.history || [] }
  } catch {
    return null
  }
}

// On-chain session (0G EVM session contract)
export async function getBlockchainSession(walletAddress: string): Promise<any> {
  if (!walletAddress) return null
  const data: any = await request(`/blockchain/session/${encodeURIComponent(walletAddress.toLowerCase())}`, {
    method: 'GET',
    auth: true,
  })
  return data?.data || null
}

// Full on-chain login history from SessionRecorded events
export async function getBlockchainHistory(walletAddress: string): Promise<any[]> {
  if (!walletAddress) return []
  try {
    const data: any = await request(`/blockchain/history/${encodeURIComponent(walletAddress.toLowerCase())}`, {
      method: 'GET',
      auth: true,
    })
    return data?.data || []
  } catch {
    return []
  }
}

// On-chain login count
export async function getBlockchainLoginCount(walletAddress: string): Promise<number | null> {
  if (!walletAddress) return null
  try {
    const data: any = await request(`/blockchain/login-count/${encodeURIComponent(walletAddress.toLowerCase())}`, {
      method: 'GET',
      auth: true,
    })
    return data?.data?.onChainLoginCount ?? null
  } catch {
    return null
  }
}

// Player memory & intelligence (0G DA — no rate limit)
export async function getPlayerMemory(walletAddress: string): Promise<any> {
  if (!walletAddress) return null
  try {
    const data: any = await request(`/0g/player-memory/${encodeURIComponent(walletAddress.toLowerCase())}`, {
      method: 'GET',
    })
    return data
  } catch {
    return null
  }
}

// Player difficulty recommendation (rate-limited 0G Compute)
export async function getPlayerDifficulty(walletAddress: string): Promise<any> {
  if (!walletAddress) return null
  const data: any = await request(`/player/difficulty?wallet=${encodeURIComponent(walletAddress.toLowerCase())}`, {
    method: 'GET',
    auth: true,
  })
  return data
}

// Player coaching tips (rate-limited 0G Compute)
export async function getPlayerCoaching(walletAddress: string): Promise<any> {
  if (!walletAddress) return null
  const data: any = await request(`/player/coaching?wallet=${encodeURIComponent(walletAddress.toLowerCase())}`, {
    method: 'GET',
    auth: true,
  })
  return data
}

// Player performance insight (rate-limited 0G Compute)
export async function getPlayerInsight(walletAddress: string, rank = 1): Promise<any> {
  if (!walletAddress) return null
  const data: any = await request(
    `/player/insight?wallet=${encodeURIComponent(walletAddress.toLowerCase())}&rank=${rank}`,
    { method: 'GET', auth: true },
  )
  return data
}

// Referral system
export const generateReferralCode = async (
  walletAddress: string,
  signature: string,
  nonce: number
) => {
  const res = await fetch("https://zerogpoolgame.onrender.com/api/referral/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature, nonce }),
  });

  return res.json();
};

export const API = {
  API_BASE,
  getToken,
  setToken,
  getWalletAddress,
  clearClientAuthSession,
  request,
  loginWithWallet,
  loginV2,
  getPlayerData,
  updatePlayerName,
  getPlayerStats,
  getLeaderboard,
  getLeaderboardAiComment,
  getDaSnapshot,
  getBlockchainSession,
  getPlayerMemory,
  getPlayerDifficulty,
  getPlayerCoaching,
  getPlayerInsight,
  generateReferralCode,
}
