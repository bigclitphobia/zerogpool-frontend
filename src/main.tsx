import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.tsx'
import { WalletProvider } from './components/WalletContext'

const appId = import.meta.env.VITE_PRIVY_APP_ID

const privyConfig = {
  appearance: {
    theme: 'dark',
    walletChainType: 'ethereum',
    // Order and choose supported external wallets (includes WalletConnect)
    walletList: ['metamask', 'coinbase_wallet', 'walletconnect'],
  },
  embeddedWallets: { createOnLogin: 'users-without-wallets' },
  // Enable multiple auth methods (expand to your needs)
  loginMethods: ['wallet', 'email', 'sms', 'google', 'discord'],
  cookieOptions: { domain: undefined },
}

createRoot(document.getElementById('root')!).render(
  <PrivyProvider appId={appId} config={privyConfig as any}>
    <WalletProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletProvider>
  </PrivyProvider>
)
