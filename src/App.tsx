import { Routes, Route, Navigate } from 'react-router-dom'
import { BlockchainToastProvider } from './context/BlockchainToastContext'
import RulesPage from './pages/RulesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import ChainHistoryPage from './pages/ChainHistoryPage'
import Layout from './components/Layout'
import NFTPage from './pages/NFTPage'
import PaidNFTPage from './pages/paidNFTPage'
import ProtectedRoute from './components/ProtectedRoute'
import AutoLogin from './pages/AutoLogin'

function App() {
  return (
    <BlockchainToastProvider>
      <Routes>
        <Route path="/autologin" element={<AutoLogin />} />

        {/* HomePage is now standalone to match the premium design exactly */}
        <Route path="/" element={<HomePage />} />

        {/* Other pages use the standard Layout */}
        <Route element={<Layout />}>
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/chain-history" element={<ProtectedRoute><ChainHistoryPage /></ProtectedRoute>} />
          <Route path="/nft1" element={<ProtectedRoute><NFTPage/></ProtectedRoute>} />
          <Route path="/nft2" element={<ProtectedRoute><PaidNFTPage/></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BlockchainToastProvider>
  )
}

export default App