import { Box, CircularProgress } from '@mui/material'
import { useSession } from '../../entities/user'
import { Navigate, Outlet } from 'react-router'

export function GuestRoute() {
  const status = useSession((state) => state.status)

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
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
