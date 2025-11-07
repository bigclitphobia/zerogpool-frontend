import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'

type Props = { children: React.ReactElement }

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { authenticated, ready } = usePrivy()
  const location = useLocation()

  if (!ready) return null
  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}

export default ProtectedRoute

