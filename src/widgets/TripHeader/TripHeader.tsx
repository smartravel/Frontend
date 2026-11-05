import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import LinkIcon from '@mui/icons-material/Link'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import {
  AvatarGroup,
  Box,
  Button,
  ButtonBase,
  Chip,
  Link,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router'
import type { Member, Trip } from '../../entities/trip'
import type { SocketStatus } from '../../shared/api'
import { daysUntil, formatDateRange, pluralize } from '../../shared/lib/date'
import { EmojiAvatar } from '../../shared/ui'
import { MembersDialog } from './MembersDialog'

const TABS = [
  { path: 'route', label: 'Маршрут' },
  { path: 'checklist', label: 'Чеклист' },
  { path: 'polls', label: 'Опросы' },
  { path: 'expenses', label: 'Расходы' },
  { path: 'dates', label: 'Даты' },
]

function getDaysLabel(trip: Trip) {
  if (trip.days_left > 0) {
    return `До поездки ${trip.days_left} ${pluralize(trip.days_left, ['день', 'дня', 'дней'])}`
  }
  if (daysUntil(trip.end_date) >= 0) return 'Сейчас в пути'
  return 'Поездка завершилась'
}

const SOCKET_LABELS: Record<SocketStatus, { text: string; color: string }> = {
  open: { text: 'Изменения видны всем сразу', color: 'primary.main' },
  connecting: { text: 'Подключаемся…', color: 'text.disabled' },
  reconnecting: { text: 'Нет связи, переподключаемся…', color: 'secondary.main' },
}

type TripHeaderProps = {
  trip: Trip
  members: Member[]
  socketStatus: SocketStatus
}

export function TripHeader({ trip, members, socketStatus }: TripHeaderProps) {
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const socketLabel = SOCKET_LABELS[socketStatus]

  const currentTab = location.pathname.split('/').at(-1)
  const activeTab = TABS.some((tab) => tab.path === currentTab) ? currentTab : false

  async function copyInviteLink() {
    if (!trip.invite_token) return
    await navigator.clipboard.writeText(`${window.location.origin}/join/${trip.invite_token}`)
    setCopied(true)
  }

  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ px: { xs: 2.5, md: 4 }, pt: 3.5, borderRadius: '20px' }}
    >
      <Stack spacing={2.5}>
        <Link
          component={RouterLink}
          to="/"
          underline="none"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontWeight: 600,
            width: 'fit-content',
          }}
        >
          <ArrowBackIcon fontSize="small" />
          Мои поездки
        </Link>

        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2.5,
          }}
        >
          <Stack spacing={1.25}>
            <Typography variant="h1">{trip.title}</Typography>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5, color: 'text.secondary' }}
            >
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <CalendarTodayOutlinedIcon fontSize="small" />
                <Typography>{formatDateRange(trip.start_date, trip.end_date)}</Typography>
              </Stack>
              {trip.destination && (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <PlaceOutlinedIcon fontSize="small" />
                  <Typography>{trip.destination}</Typography>
                </Stack>
              )}
              <Chip
                label={getDaysLabel(trip)}
                size="small"
                sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', fontWeight: 700 }}
              />
              <Stack
                direction="row"
                spacing={0.75}
                role="status"
                sx={{ alignItems: 'center', color: 'text.secondary' }}
              >
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: socketLabel.color }}
                />
                <Typography variant="body2">{socketLabel.text}</Typography>
              </Stack>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <ButtonBase
              onClick={() => setMembersOpen(true)}
              aria-label={`Участники: ${trip.members_count}. Показать список`}
              sx={{ borderRadius: '22px', p: 0.5 }}
            >
              <AvatarGroup
                max={5}
                total={trip.members_count}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 38,
                    height: 38,
                    fontSize: 15,
                    borderColor: 'background.paper',
                  },
                }}
              >
                {members.map((member) => (
                  <EmojiAvatar
                    key={member.user_id}
                    emoji={member.avatar_emoji}
                    label={member.nickname}
                  />
                ))}
              </AvatarGroup>
            </ButtonBase>
            {trip.invite_token && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LinkIcon />}
                onClick={copyInviteLink}
              >
                Пригласить
              </Button>
            )}
          </Stack>
        </Stack>

        <Tabs
          value={activeTab}
          variant="scrollable"
          scrollButtons={false}
          aria-label="Разделы поездки"
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.path}
              value={tab.path}
              label={tab.label}
              component={RouterLink}
              to={tab.path}
            />
          ))}
        </Tabs>
      </Stack>

      <MembersDialog open={membersOpen} onClose={() => setMembersOpen(false)} members={members} />

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message="Ссылка-приглашение скопирована. Не забудьте сообщить друзьям пароль"
      />
    </Paper>
  )
}
