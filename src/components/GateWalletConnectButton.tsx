import { useState } from 'react'
import { loginWithWallet } from '../lib/api'
import { useBlockchainToast } from '../context/BlockchainToastContext'
import {
  connectGateWallet,
  getPrimaryGateWalletAddress,
  isGateWalletAvailable,
} from '../lib/gateWallet'

type Props = {
  onConnected?: (address: string) => void
  onError?: (message: string) => void
  disabled?: boolean
}

export default function GateWalletConnectButton({
  onConnected,
  onError,
  disabled,
}: Props) {
  const [connecting, setConnecting] = useState(false)
  const { showToast } = useBlockchainToast()

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

      const loginResult = await loginWithWallet(address)

      if (loginResult?.blockchain?.txHash) {
        showToast({
          title: '🎮 Login Successful',
          description: 'Session recorded on 0G blockchain',
          txHash: loginResult.blockchain.txHash,
          duration: 6000
        })
      }

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
