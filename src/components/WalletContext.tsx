import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'

type WalletContextType = {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  toggle: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const backendLoginSent = useRef<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('wallet_connected')
    if (saved) setIsConnected(saved === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('wallet_connected', String(isConnected))
  }, [isConnected])

  // Sync our simple connection flag with Privy status
  useEffect(() => {
    if (ready) setIsConnected(authenticated)
  }, [ready, authenticated])

  // On login, call backend with wallet address
  useEffect(() => {
    if (!ready || !authenticated) return
    const address = user?.wallet?.address || wallets.find((w) => !!w.address)?.address
    if (!address) return
    if (backendLoginSent.current === address) return
    backendLoginSent.current = address

    try {
      fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      }).catch((err) => {
        // Network errors are non-fatal to the app; log for debugging
        console.warn('Backend login call failed:', err)
      })
    } catch (err) {
      console.warn('Backend login call error:', err)
    }
  }, [ready, authenticated, user, wallets])

  const value = useMemo(
    () => ({
      isConnected,
      connect: () => setIsConnected(true),
      disconnect: () => setIsConnected(false),
      toggle: () => setIsConnected((v) => !v),
    }),
    [isConnected]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
