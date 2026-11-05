import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import { Box, Link, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router'
import { JoinTripForm } from '../../features/join-trip'

export function JoinTripPage() {
  const { inviteToken = '' } = useParams()

  return (
    <Paper
      variant="outlined"
      sx={{ maxWidth: 480, mx: 'auto', p: { xs: 3, sm: 4.5 }, borderRadius: '24px' }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'secondary.light',
            color: 'secondary.dark',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FlightTakeoffIcon />
        </Box>
        <Stack spacing={1}>
          <Typography variant="h1" sx={{ fontSize: 28 }}>
            Вас пригласили в поездку
          </Typography>
          <Typography color="text.secondary">
            Введите пароль, который дал организатор поездки
          </Typography>
        </Stack>

        <JoinTripForm key={inviteToken} inviteToken={inviteToken} />

        <Link component={RouterLink} to="/" sx={{ fontWeight: 700, textAlign: 'center' }}>
          Вернуться к моим поездкам
        </Link>
      </Stack>
    </Paper>
  )
}
