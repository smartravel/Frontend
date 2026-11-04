import { Paper, Stack, Typography } from '@mui/material'
import { useSession } from '../../entities/user'
import { ProfileForm } from '../../features/profile'

export function ProfilePage() {
  const user = useSession((state) => state.user)

  if (!user) return null

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h1">Профиль</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: '20px' }}>
        <ProfileForm user={user} />
      </Paper>
    </Stack>
  )
}
