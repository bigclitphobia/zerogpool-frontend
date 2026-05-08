import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { SiweMessage } from 'siwe'
import { getSiweNonce, loginWithSiwe, setToken, getToken, getTokenWalletAddress } from '../lib/api'

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

  // On login, perform SIWE flow with the connected wallet
  useEffect(() => {
    if (!ready || !authenticated) return
    const wallet = wallets.find((w) => !!w.address) || (user?.wallet?.address ? { address: user.wallet.address, getEthereumProvider: null } : null)
    const address = (wallet as any)?.address
    if (!address) return
    if (backendLoginSent.current === address) return
    backendLoginSent.current = address

    const tokenWallet = getTokenWalletAddress()
    if (tokenWallet && tokenWallet !== address.toLowerCase()) {
      setToken(null)
    } else if (getToken()) {
      return
    }

    const privyWallet = wallets.find((w) => w.address === address)
    if (!privyWallet) {
      console.warn('No Privy wallet object found for SIWE signing')
      return
    }

    ;(async () => {
      try {
        const nonce = await getSiweNonce(address)
        const siweMessage = new SiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in to ZeroG Pool',
          uri: window.location.origin,
          version: '1',
          chainId: 1,
          nonce,
        })
        const messageText = siweMessage.prepareMessage()
        const provider = await privyWallet.getEthereumProvider()
        const signature = await provider.request({
          method: 'personal_sign',
          params: [messageText, address],
        })
        await loginWithSiwe(messageText, signature as string)
      } catch (err: unknown) {
        console.warn('SIWE login failed:', err)
        setToken(null)
      }
    })()
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
