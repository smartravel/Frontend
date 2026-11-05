import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import { tripApi, TripCard, type StatusTrip, type TripListItem } from '../../entities/trip'
import { CreateTripDialog } from '../../features/create-trip'
import { ApiError } from '../../shared/api'

type Filter = 'all' | StatusTrip

const EMPTY_TEXT: Record<Filter, string> = {
  all: 'Пока ни одной поездки',
  upcoming: 'Предстоящих поездок нет',
  past: 'Прошедших поездок пока нет',
}

export function TripsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [trips, setTrips] = useState<TripListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    let ignore = false
    tripApi
      .getList(filter === 'all' ? undefined : filter)
      .then((data) => {
        if (!ignore) setTrips(data)
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof ApiError ? e.message : 'Не удалось загрузить поездки')
      })
    return () => {
      ignore = true
    }
  }, [filter])

  function handleFilterChange(value: Filter | null) {
    // Повторный клик по выбранной кнопке присылает null — фильтр всегда должен быть выбран
    if (value === null || value === filter) return
    setFilter(value)
    setTrips(null)
    setError(null)
  }

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
        <Typography variant="h2">{EMPTY_TEXT[filter]}</Typography>
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
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
      >
        <Stack spacing={1}>
          <Typography variant="h1">Мои поездки</Typography>
          <Typography color="text.secondary">
            Планируйте маршрут, вещи и расходы вместе с друзьями
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Создать поездку
        </Button>
      </Stack>

      <ToggleButtonGroup
        exclusive
        value={filter}
        onChange={(_, value: Filter | null) => handleFilterChange(value)}
        aria-label="Какие поездки показать"
        sx={{
          alignSelf: 'flex-start',
          gap: 1,
          '& .MuiToggleButton-root': {
            border: 1,
            borderColor: 'divider',
            borderRadius: '20px !important',
            px: 2.5,
            height: 40,
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.primary',
            bgcolor: 'background.paper',
          },
          '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': {
            bgcolor: 'text.primary',
            color: 'background.paper',
            borderColor: 'text.primary',
          },
        }}
      >
        <ToggleButton value="all">Все</ToggleButton>
        <ToggleButton value="upcoming">Предстоящие</ToggleButton>
        <ToggleButton value="past">Прошедшие</ToggleButton>
      </ToggleButtonGroup>

      {content}

      <CreateTripDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Stack>
  )
}
