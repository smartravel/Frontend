import { Box, CircularProgress } from '@mui/material'
import { useSession } from '../../entities/user'
import { Navigate, Outlet, useLocation } from 'react-router'

export function ProtectedRoute() {
  const status = useSession((state) => state.status)
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return (
      <Box
        sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress aria-label="Загрузка" />
      </Box>
    )
  }
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
