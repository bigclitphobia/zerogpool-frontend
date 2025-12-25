import { useState } from 'react'
import { loginWithWallet } from '../lib/api'
import {
  connectGateWallet,
  getGateWalletCurrentNetwork,
  getPrimaryGateWalletAddress,
  isGateWalletAvailable,
  type NetworkInfo,
} from '../lib/gateWallet'

type Props = {
  onConnected?: (address: string) => void
  onError?: (message: string) => void
  onNetworkMismatch?: () => void
  disabled?: boolean
}

const allowedChain = {
  caip2: 'eip155:16661',
  decimalChainId: 16661,
  hexChainId: '0x4115',
  chainName: '0G Mainnet',
  rpcUrls: ['https://evmrpc.0g.ai'],
  blockExplorerUrls: ['https://chainscan.0g.ai'],
}

function normalizeChainId(chainId?: string) {
  if (!chainId) return undefined
  if (chainId.startsWith('0x')) {
    const parsed = Number.parseInt(chainId, 16)
    return Number.isFinite(parsed) ? String(parsed) : chainId
  }
  return chainId
}

function getNetworkLabel(network: NetworkInfo | null | undefined) {
  if (network === null) return 'All Networks'
  if (!network) return 'Unknown'
  return network.name || network.chainId
}

export default function GateWalletConnectButton({
  onConnected,
  onError,
  onNetworkMismatch,
  disabled,
}: Props) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    if (disabled || connecting) return
    onError?.('')
    setConnecting(true)
    try {
      if (!isGateWalletAvailable()) {
        throw new Error('Gate Wallet not detected. Please install or enable it.')
      }
      const accountInfo = await connectGateWallet()
      const address = getPrimaryGateWalletAddress(accountInfo)
      if (!address) {
        throw new Error('Gate Wallet did not return an address.')
      }
      const network = await getGateWalletCurrentNetwork().catch(() => undefined)
      if (network === undefined) {
        throw new Error('Gate Wallet network check is unavailable. Only 0G Mainnet is supported.')
      }
      if (network === null) {
        throw new Error('Gate Wallet is set to All Networks. Select 0G Mainnet and try again.')
      }
      const normalized = normalizeChainId(network.chainId)
      const allowed = String(allowedChain.decimalChainId)
      if (!normalized || normalized !== allowed) {
        onNetworkMismatch?.()
        throw new Error(
          `Gate Wallet is on ${getNetworkLabel(network)}. Switch to ${allowedChain.chainName}.`
        )
      }
      await loginWithWallet(address)
      onConnected?.(address)
    } catch (err: any) {
      onError?.(err?.message || 'Failed to connect Gate Wallet.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={disabled || connecting}
      className="w-full inline-flex items-center justify-center rounded-2xl border border-amber-400/60 bg-gradient-to-tr from-amber-400 via-yellow-400 to-orange-500 px-4 py-3 text-lg font-bold text-black shadow-[0_10px_28px_rgba(251,191,36,0.35)] hover:shadow-[0_14px_34px_rgba(251,191,36,0.45)] active:scale-[.99] transition disabled:opacity-60"
    >
      {connecting ? 'Connecting Gate Wallet...' : 'Connect Gate Wallet'}
    </button>
  )
}
