import { AvatarGroup, Box, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material'
import type { TripListItem } from '../model/types'
import { Link as RouterLink } from 'react-router'
import { CoverArt } from './Covers'
import { daysUntil, formatDateRange, pluralize } from '../../../shared/lib/date'
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'
import { EmojiAvatar } from '../../../shared/ui'
import { COVER_BACKGROUNDS } from '../model/covers'

export function TripCard({ trip }: { trip: TripListItem }) {
  const days = daysUntil(trip.start_date)
  let label: string

  if (days > 0) {
    label = `через ${days} ${pluralize(days, ['день', 'дня', 'дней'])}`
  } else if (daysUntil(trip.end_date) >= 0) {
    label = 'В процессе'
  } else {
    label = 'Завершена'
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: '20px' }}>
      <CardActionArea component={RouterLink} to={`/trips/${trip.id}`}>
        <Box
          sx={{
            height: '150px',
            background: COVER_BACKGROUNDS[trip.cover_theme],
            position: 'relative',
          }}
        >
          <CoverArt theme={trip.cover_theme} />
          <Chip
            label={label}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'background.paper',
              fontWeight: 700,
            }}
          />
        </Box>
        <Stack spacing={1} sx={{ padding: '20px' }}>
          <Typography variant="h2">{trip.title}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <CalendarTodayOutlined fontSize="small" />
            <Typography variant="body2">
              {formatDateRange(trip.start_date, trip.end_date)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <AvatarGroup
              max={4}
              total={trip.members_count}
              sx={{
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  fontSize: 14,
                  borderColor: 'background.paper',
                },
              }}
            >
              {trip.members_preview.map((member) => (
                <EmojiAvatar
                  key={member.user_id}
                  emoji={member.avatar_emoji}
                  size="sm"
                  label={member.nickname}
                />
              ))}
            </AvatarGroup>
            {trip.my_role === 'organizer' ? (
              <Chip
                label="Организатор"
                sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 }}
              />
            ) : (
              <Chip label="Участник" />
            )}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  )
}
