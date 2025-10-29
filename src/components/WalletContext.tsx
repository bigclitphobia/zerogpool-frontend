import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

type WalletContextType = {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  toggle: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const { ready, authenticated } = usePrivy()

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
