import { Routes, Route, Navigate } from 'react-router-dom'
import RulesPage from './pages/RulesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout'
import NFTPage from './pages/NFTPage';
import PaidNFTPage from './pages/paidNFTPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/nft1" element={<ProtectedRoute><NFTPage/></ProtectedRoute>} />
        <Route path="/nft2" element={<ProtectedRoute><PaidNFTPage/></ProtectedRoute>} /> 
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
