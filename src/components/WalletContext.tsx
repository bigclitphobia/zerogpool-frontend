import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type WalletContextType = {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  toggle: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem('wallet_connected')
    if (saved) setIsConnected(saved === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('wallet_connected', String(isConnected))
  }, [isConnected])

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

