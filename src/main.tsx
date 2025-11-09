import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider, type PrivyClientConfig } from '@privy-io/react-auth'
import { WalletProvider } from './components/WalletContext'
import './index.css'
import App from './App'

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'dark',
    walletChainType: 'ethereum-only',
    walletList: [
      'metamask',
      'coinbase_wallet',
      'okx_wallet',
    ],
  },
  embeddedWallets: {
    // 👇 automatically create wallet for new users (only when using Privy UI)
    createOnLogin: 'users-without-wallets',
  },
  loginMethods: ['wallet', 'email', 'google'],
}

const appId = import.meta.env.VITE_PRIVY_APP_ID!  // must match Privy dashboard

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider appId={appId} config={privyConfig}>
      <WalletProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WalletProvider>
    </PrivyProvider>
  </React.StrictMode>
)
