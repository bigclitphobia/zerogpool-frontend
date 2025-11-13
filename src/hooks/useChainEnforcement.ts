import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { getAllowedChainFromEnv, type AllowedChainConfig } from '../lib/chain'

type ChainState = {
  allowed: AllowedChainConfig
  currentCaip2?: string
  isAllowed: boolean
}

export function useChainEnforcement() {
  const { wallets, ready } = useWallets()
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string>('')
  const autoTriedRef = useRef(false)

  const allowed: AllowedChainConfig = useMemo(() => {
    return (
      getAllowedChainFromEnv() || {
        caip2: 'eip155:16661',
        decimalChainId: 16661,
        hexChainId: '0x4115',
        chainName: '0G Mainnet',
        nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
        rpcUrls: ['https://evmrpc.0g.ai'],
        blockExplorerUrls: ['https://chainscan.0g.ai'],
      }
    )
  }, [])

  const chain: ChainState = useMemo(() => {
    const w = wallets.find((w) => (w as any)?.type === 'ethereum') as any | undefined
    const currentCaip2 = w?.chainId as string | undefined
    return {
      allowed,
      currentCaip2,
      isAllowed: currentCaip2 === allowed.caip2,
    }
  }, [wallets, allowed])

  const ensureAllowedChain = useCallback(async () => {
    setError('')
    setSwitching(true)
    try {
      // Try each connected ETH wallet
      for (const w of wallets as any[]) {
        if (w?.type !== 'ethereum') continue
        try {
          // Prefer Privy wallet helper
          await w.switchChain(chain.allowed.hexChainId)
          return true
        } catch (err: any) {
          // If not supported or unrecognized chain, try EIP-1193 methods as fallback
          try {
            const provider = await w.getEthereumProvider()
            if (!provider?.request) throw err
            // First try standard wallet_switchEthereumChain
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chain.allowed.hexChainId }],
            } as any)
            return true
          } catch (switchErr: any) {
            // Only attempt addEthereumChain if RPC URL is provided
            if (Array.isArray(chain.allowed.rpcUrls) && chain.allowed.rpcUrls.length > 0) {
              try {
                const provider = await w.getEthereumProvider()
                await provider.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: chain.allowed.hexChainId,
                      chainName: chain.allowed.chainName || `Chain ${chain.allowed.decimalChainId}`,
                      nativeCurrency: chain.allowed.nativeCurrency || { name: 'Token', symbol: 'TKN', decimals: 18 },
                      rpcUrls: chain.allowed.rpcUrls,
                      blockExplorerUrls: chain.allowed.blockExplorerUrls || [],
                    },
                  ],
                } as any)
                // Retry switching after adding
                await provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: chain.allowed.hexChainId }],
                } as any)
                return true
              } catch (addErr: any) {
                setError(addErr?.message || 'Failed to add/switch network in wallet')
              }
            } else {
              // No RPC known → ask user to switch manually
              setError('Wrong network. Please switch your wallet to the allowed chain.')
            }
          }
        }
      }
      return false
    } finally {
      setSwitching(false)
    }
  }, [wallets, chain.allowed])

  // Attempt auto-switch once when a mismatch is detected and wallets are ready
  useEffect(() => {
    if (!ready) return
    if (chain.isAllowed) return
    if (autoTriedRef.current) return
    autoTriedRef.current = true
    // Fire and forget; UI shows spinner if user clicks button
    ensureAllowedChain().catch(() => {})
  }, [ready, chain.isAllowed, ensureAllowedChain])

  return {
    allowed,
    currentCaip2: chain.currentCaip2,
    isAllowed: chain.isAllowed,
    ensureAllowedChain,
    switching,
    error,
    showBanner: ready && wallets.length > 0 && !chain.isAllowed,
  }
}
