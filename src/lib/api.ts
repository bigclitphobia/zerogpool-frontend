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
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const data: any = await request('/leaderboard', { method: 'GET' })
  return data?.data || []
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
  request,
  loginWithWallet,
  loginV2,
  getPlayerData,
  updatePlayerName,
  getPlayerStats,
  getLeaderboard,
  generateReferralCode,
}
