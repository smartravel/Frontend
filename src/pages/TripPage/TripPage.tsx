import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, Link as RouterLink, useParams } from 'react-router'
import {
  tripApi,
  useTripSocket,
  type Member,
  type Trip,
  type TripContext,
} from '../../entities/trip'
import { ApiError } from '../../shared/api'
import { TripHeader } from '../../widgets/TripHeader'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; code: number; message: string }
  | { status: 'ready'; trip: Trip; members: Member[] }

export function TripPage() {
  const { tripId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [loadedId, setLoadedId] = useState(tripId)

  if (loadedId !== tripId) {
    setLoadedId(tripId)
    setState({ status: 'loading' })
  }

  const { status: socketStatus, subscribe } = useTripSocket(tripId, state.status === 'ready')

  useEffect(() => {
    return subscribe((event) => {
      if (event.entity !== 'member') return
      Promise.all([tripApi.getById(tripId), tripApi.getMembers(tripId)])
        .then(([trip, members]) => setState({ status: 'ready', trip, members }))
        .catch(() => {})
    })
  }, [subscribe, tripId])

  useEffect(() => {
    let ignore = false
    Promise.all([tripApi.getById(tripId), tripApi.getMembers(tripId)])
      .then(([trip, members]) => {
        if (!ignore) setState({ status: 'ready', trip, members })
      })
      .catch((e) => {
        if (ignore) return
        setState({
          status: 'error',
          code: e instanceof ApiError ? e.status : 0,
          message: e instanceof ApiError ? e.message : 'Не удалось загрузить поездку',
        })
      })
    return () => {
      ignore = true
    }
  }, [tripId])

  if (state.status === 'loading') {
    return (
      <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress aria-label="Загрузка поездки" />
      </Box>
    )
  }

  if (state.status === 'error') {
    if (state.code === 403) {
      return (
        <ErrorScreen
          icon={<LockOutlinedIcon />}
          title="Нет доступа к поездке"
          text="Вы не участник этой поездки. Попросите у организатора ссылку и пароль."
        />
      )
    }
    if (state.code === 404) {
      return (
        <ErrorScreen
          icon={<SearchOffIcon />}
          title="Поездка не найдена"
          text="Возможно, ссылка устарела или поездку удалили."
        />
      )
    }
    return <Alert severity="error">{state.message}</Alert>
  }

  const context: TripContext = {
    trip: state.trip,
    members: state.members,
    socketStatus,
    subscribe,
  }

  return (
    <Stack spacing={3}>
      <TripHeader trip={state.trip} members={state.members} socketStatus={socketStatus} />
      <Outlet context={context} />
    </Stack>
  )
}

function ErrorScreen({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 5, borderRadius: '20px', textAlign: 'center', maxWidth: 560, mx: 'auto' }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'secondary.light',
            color: 'secondary.dark',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 32 },
          }}
        >
          {icon}
        </Box>
        <Typography variant="h2">{title}</Typography>
        <Typography color="text.secondary">{text}</Typography>
        <Button component={RouterLink} to="/" variant="contained">
          К моим поездкам
        </Button>
      </Stack>
    </Paper>
  )
}
