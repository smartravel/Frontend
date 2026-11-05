import { Box, CircularProgress } from '@mui/material'
import { useSession } from '../../entities/user'
import { Navigate, Outlet, useLocation } from 'react-router'
import { getRedirectPath } from '../../shared/lib/redirect'

export function GuestRoute() {
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
  if (status === 'authenticated') {
    return <Navigate to={getRedirectPath(location.state)} replace />
  }
  return <Outlet />
}
