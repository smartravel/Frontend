import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import DeleteOutlineIcon from '@mui/icons-material/Delete'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded'
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type {
  ItineraryItem as ItineraryItemType,
  ItineraryRatingSummary,
} from '../../../entities/itinerary'

type ItineraryItemProps = {
  item: ItineraryItemType
  index: number
  dayIndex: number
  dayDate: string
  onEdit: (item: ItineraryItemType) => void
  onDelete: (item: ItineraryItemType) => void
  deleting?: boolean
  dragDisabled?: boolean
  ratingSummary?: ItineraryRatingSummary
  ratingSaving?: boolean
  onRate: (itemId: string, rating: number) => void
}

export function ItineraryItem({
  item,
  index,
  dayIndex,
  dayDate,
  onEdit,
  onDelete,
  deleting,
  dragDisabled = false,
  ratingSummary,
  ratingSaving = false,
  onRate,
}: ItineraryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: dragDisabled,
    data: { type: 'itinerary-item', dayDate },
  })



  const badgeSx =
    dayIndex % 2 === 1
      ? { bgcolor: 'secondary.main', color: 'text.primary' }
      : { bgcolor: 'primary.main', color: 'primary.contrastText' }

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 2 : 'auto',
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.75 },
        p: 1.75,
        borderRadius: '14px',
        bgcolor: '#FBFCFD',
        borderColor: isDragging ? 'primary.main' : 'divider',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        '&:hover': { borderColor: 'primary.light' },
      }}
    >
      <IconButton
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Переместить: ${item.title}`}
        size="small"
        disabled={dragDisabled}
        sx={{
          color: 'grey.400',
          flex: 'none',
          cursor: dragDisabled ? 'default' : isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <DragIndicatorIcon aria-hidden="true" sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        sx={{
          width: 28,
          height: 28,
          flex: 'none',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          ...badgeSx,
        }}
      >
        {index + 1}
      </Box>
      <Typography sx={{ width: 56, flex: 'none', fontSize: 15, fontWeight: 700 }}>
        {item.time || '—:—'}
      </Typography>
      <Stack spacing={0.25} sx={{ flex: '1 1 auto', minWidth: 0 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, overflowWrap: 'anywhere' }}>
          {item.title}
        </Typography>
        {item.note && (
          <Typography color="text.secondary" sx={{ fontSize: 14, overflowWrap: 'anywhere' }}>
            {item.note}
          </Typography>
        )}
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          sx={{ pt: 0.5 }}
        >
          <Stack direction="row" spacing={0.4} alignItems="center">
            <StarRoundedIcon sx={{ fontSize: 16, color: '#F28F3B' }} />
            <Typography
              component="span"
              sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}
            >
              {ratingSummary?.average_rating ?? '—'}
            </Typography>
            <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
              · {ratingSummary?.ratings_count ?? 0} оценок участников
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.1} alignItems="center">
            <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', mr: 0.25 }}>
              Ваша оценка
            </Typography>
            {[1, 2, 3, 4, 5].map((value) => (
              <Tooltip key={value} title={`Оценить на ${value}`} arrow>
                <span>
                  <IconButton
                    size="small"
                    aria-label={`Оценить ${item.title} на ${value} из 5`}
                    disabled={ratingSaving}
                    onClick={() => onRate(item.id, value)}
                    sx={{
                      p: 0.15,
                      color: (ratingSummary?.my_rating ?? 0) >= value ? '#F28F3B' : '#C9D3DF',
                    }}
                  >
                    {(ratingSummary?.my_rating ?? 0) >= value ? (
                      <StarRoundedIcon sx={{ fontSize: 17 }} />
                    ) : (
                      <StarOutlineRoundedIcon sx={{ fontSize: 17 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            ))}
          </Stack>
            <Tooltip
              title="Демонстрационный внешний рейтинг. После настройки Places API здесь будут реальные данные."
              arrow
            >
              <Stack spacing={0.35} direction="row"  alignItems="center">
                <StarRoundedIcon sx={{ fontSize: 15, color: '#F28F3B' }} />
                <Typography component="span" sx={{ fontSize: 12, fontWeight: 700 }}>
                </Typography>
                <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>
                  демо · {ratingSummary?.google_rating_count?.toLocaleString('ru-RU') ?? 0} оценок
                </Typography>
              </Stack>
            </Tooltip>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={0} sx={{ flex: 'none' }}>
        <IconButton
          aria-label={`Редактировать: ${item.title}`}
          onClick={() => onEdit(item)}
          size="large"
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          aria-label={`Удалить: ${item.title}`}
          onClick={() => onDelete(item)}
          disabled={deleting}
          size="large"
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  )
}
