import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RulesPage from './pages/RulesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ConnectPage from './pages/ConnectPage'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="connect" element={<ConnectPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
