import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import { tripApi, type TripListItem, TripCard } from '../../entities/trip'
import { ApiError } from '../../shared/api'

export function TripsPage() {
  const [trips, setTrips] = useState<TripListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    tripApi
      .getList()
      .then((data) => {
        if (!ignore) setTrips(data)
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof ApiError ? e.message : 'Не удалось загрузить поездки')
      })
    return () => {
      ignore = true
    }
  }, [])

  let content: ReactNode

  if (error) {
    content = <Alert severity="error">{error}</Alert>
  } else if (trips === null) {
    content = (
      <Box sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress aria-label="Загрузка" />
      </Box>
    )
  } else if (trips.length === 0) {
    content = (
      <Paper variant="outlined" sx={{ p: 5, borderRadius: '20px', textAlign: 'center' }}>
        <Typography variant="h2">Пока ни одной поездки</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Создайте поездку и пригласите друзей по ссылке
        </Typography>
      </Paper>
    )
  } else {
    content = (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3,
        }}
      >
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </Box>
    )
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h1">Мои поездки</Typography>
        <Typography color="text.secondary">
          Планируйте маршрут, вещи и расходы вместе с друзьями
        </Typography>
      </Stack>
      {content}
    </Stack>
  )
}
