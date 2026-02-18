import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { getToken } from '../lib/api'

type Props = { children: React.ReactElement }

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { authenticated, ready } = usePrivy()
  const location = useLocation()
  const token = getToken()

  if (!ready && !token) return null
  if (!authenticated && !token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}

export default ProtectedRoute
