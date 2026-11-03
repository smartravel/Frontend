import { Stack, Typography } from '@mui/material'
import { Logo } from '../../shared/ui'
import { LoginForm } from '../../features/auth/ui/LoginForm'

export function LoginPage() {
  return (
    <Stack spacing={2} sx={{ p: 6, alignItems: 'flex-start' }}>
      <Logo />
      <Typography variant="h1">Страница входа</Typography>
      <LoginForm />
    </Stack>
  )
}
