import AddIcon from '@mui/icons-material/Add'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/Refresh'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import {
  itineraryApi,
  type CreateItineraryRequest,
  type ItineraryItem,
} from '../../entities/itinerary'
import { useTripContext } from '../../entities/trip'
import { ApiError } from '../../shared/api'
import { ItineraryForm, ItineraryItem as ItineraryItemCard } from '../../features/itinerary'

type TripDay = {
  date: string
  label: string
  items: ItineraryItem[]
}

type DropData = {
  type?: 'day' | 'itinerary-item'
  dayDate?: string
}

const itineraryCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  const itemCollision = pointerCollisions.find((collision) => {
    const container = args.droppableContainers.find((entry) => entry.id === collision.id)
    return (container?.data.current as DropData | undefined)?.type === 'itinerary-item'
  })

  if (itemCollision) return [itemCollision]
  if (pointerCollisions.length > 0) return pointerCollisions
  return closestCenter(args)
}

function addDays(isoDate: string, amount: number) {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + amount)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDayLabel(isoDate: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${isoDate}T12:00:00`))
}

function createTripDays(startDate: string, endDate: string, items: ItineraryItem[]): TripDay[] {
  const days: TripDay[] = []
  let date = startDate

  while (date <= endDate) {
    days.push({
      date,
      label: formatDayLabel(date),
      items: items.filter((item) => item.day_date === date).sort((a, b) => a.position - b.position),
    })
    date = addDays(date, 1)
  }

  return days
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function RoutePage() {
  const { tripId = '' } = useParams()
  const { trip } = useTripContext()
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [selectedDate, setSelectedDate] = useState(trip.start_date)
  const [saving, setSaving] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loadItems = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const result = await itineraryApi.getList(tripId)
      setItems(result)
    } catch (error) {
      setPageError(getErrorMessage(error, 'Не удалось загрузить маршрут. Попробуйте ещё раз.'))
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const days = useMemo(
    () => createTripDays(trip.start_date, trip.end_date, items),
    [items, trip.end_date, trip.start_date],
  )

  function openCreateForm(date: string) {
    setEditingItem(null)
    setSelectedDate(date)
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(item: ItineraryItem) {
    setEditingItem(item)
    setSelectedDate(item.day_date)
    setFormError('')
    setFormOpen(true)
  }

  async function saveItem(data: CreateItineraryRequest) {
    setSaving(true)
    setFormError('')
    try {
      if (editingItem) {
        const updated = await itineraryApi.update(tripId, editingItem.id, data)
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        setSnackbar('Изменения сохранены')
      } else {
        const created = await itineraryApi.create(tripId, data)
        setItems((current) => [...current, created])
        setSnackbar('Пункт добавлен в маршрут')
      }
      setFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      setFormError(getErrorMessage(error, 'Не удалось сохранить пункт. Попробуйте ещё раз.'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item: ItineraryItem) {
    setDeletingId(item.id)
    setPageError('')
    try {
      await itineraryApi.delete(tripId, item.id)
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
      setSnackbar('Пункт маршрута удалён')
    } catch (error) {
      setPageError(getErrorMessage(error, 'Не удалось удалить пункт. Попробуйте ещё раз.'))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || savingOrder) return

    const draggedItem = items.find((item) => item.id === String(active.id))
    if (!draggedItem) return

    const overItem = items.find((item) => item.id === String(over.id))
    const overData = over.data.current as DropData | undefined
    const targetDate = overItem?.day_date ?? overData?.dayDate
    if (!targetDate || targetDate === undefined) return

    const sourceDate = draggedItem.day_date
    const sourceDayItems = items
      .filter((item) => item.day_date === sourceDate)
      .sort((a, b) => a.position - b.position)
    const targetDayItems =
      sourceDate === targetDate
        ? sourceDayItems
        : items
            .filter((item) => item.day_date === targetDate)
            .sort((a, b) => a.position - b.position)

    const sourceNext = [...sourceDayItems]
    const sourceIndex = sourceNext.findIndex((item) => item.id === draggedItem.id)
    if (sourceIndex < 0) return
    sourceNext.splice(sourceIndex, 1)

    const targetNext = sourceDate === targetDate ? sourceNext : [...targetDayItems]
    let targetIndex = targetNext.length

    if (overItem) {
      const overIndex = targetNext.findIndex((item) => item.id === overItem.id)
      if (overIndex >= 0) {
        const translated = active.rect.current.translated
        const isAfter = Boolean(translated && translated.top > over.rect.top + over.rect.height / 2)
        targetIndex = overIndex + (isAfter ? 1 : 0)
      }
    }

    targetNext.splice(targetIndex, 0, { ...draggedItem, day_date: targetDate })

    const normalizedSource = (sourceDate === targetDate ? targetNext : sourceNext).map(
      (item, position) => ({ ...item, day_date: sourceDate, position }),
    )
    const normalizedTarget =
      sourceDate === targetDate
        ? normalizedSource
        : targetNext.map((item, position) => ({ ...item, day_date: targetDate, position }))

    const changedItems =
      sourceDate === targetDate ? normalizedSource : [...normalizedSource, ...normalizedTarget]
    const changedById = new Map(changedItems.map((item) => [item.id, item]))
    const nextItems = items.map((item) => changedById.get(item.id) ?? item)

    const hasChanges = changedItems.some((item) => {
      const previous = items.find((entry) => entry.id === item.id)
      return (
        previous && (previous.day_date !== item.day_date || previous.position !== item.position)
      )
    })
    if (!hasChanges) return

    setItems(nextItems)
    setSavingOrder(true)
    setPageError('')

    try {
      await Promise.all(
        changedItems.map((item) =>
          itineraryApi.update(tripId, item.id, {
            day_date: item.day_date,
            position: item.position,
          }),
        ),
      )
      setSnackbar('Порядок маршрута сохранён')
    } catch {
      await loadItems()
      setPageError('Не удалось сохранить новый порядок маршрута. Список обновлён.')
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <>
      {pageError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadItems()}
              startIcon={<RefreshOutlinedIcon />}
            >
              Повторить
            </Button>
          }
        >
          {pageError}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CircularProgress aria-label="Загрузка маршрута" />
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={itineraryCollisionDetection}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                lg: 'minmax(0, 1.55fr) minmax(340px, 0.9fr)',
              },
              alignItems: 'start',
              gap: 3,
            }}
          >
            <Stack spacing={2.5} sx={{ minWidth: 0 }}>
              {days.map((day, dayIndex) => (
                <RouteDaySection
                  key={day.date}
                  day={day}
                  dayIndex={dayIndex}
                  itemOffset={days
                    .slice(0, dayIndex)
                    .reduce((total, previousDay) => total + previousDay.items.length, 0)}
                  onAdd={openCreateForm}
                  onEdit={openEditForm}
                  onDelete={deleteItem}
                  deletingId={deletingId}
                  dragDisabled={savingOrder}
                />
              ))}
            </Stack>
            <RouteMapPreview days={days} items={items} />
          </Box>
        </DndContext>
      )}

      <ItineraryForm
        open={formOpen}
        tripStart={trip.start_date}
        tripEnd={trip.end_date}
        initialDate={selectedDate}
        item={editingItem}
        saving={saving}
        error={formError}
        onClose={() => {
          if (!saving) setFormOpen(false)
        }}
        onSubmit={saveItem}
      />

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </>
  )
}

function RouteDaySection({
  day,
  dayIndex,
  itemOffset,
  onAdd,
  onEdit,
  onDelete,
  deletingId,
  dragDisabled,
}: {
  day: TripDay
  dayIndex: number
  itemOffset: number
  onAdd: (date: string) => void
  onEdit: (item: ItineraryItem) => void
  onDelete: (item: ItineraryItem) => void
  deletingId: string | null
  dragDisabled: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.date}`,
    data: { type: 'day', dayDate: day.date },
  })

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.75 },
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75,
        borderColor: isOver ? 'primary.main' : 'divider',
        bgcolor: isOver ? 'rgba(14,124,134,0.035)' : 'background.paper',
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
    >
      <Stack direction="row" sx={{
        display:'flex',
        justifyContent:"space-between",
        gap:1.5,
        alignItems:'center'
      }}>
        <Typography
          component="h2"
          sx={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 600,
            fontSize: 18,
            lineHeight: 1.4,
          }}
        >
          День {dayIndex + 1}{' '}
          <Box
            component="span"
            sx={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              color: 'text.secondary',
            }}
          >
            · {day.label}
          </Box>
        </Typography>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => onAdd(day.date)}
          sx={{
            minHeight: 40,
            px: 1.75,
            bgcolor: 'primary.light',
            color: 'primary.dark',
            '&:hover': { bgcolor: '#C8E8EA' },
            flex: 'none',
          }}
        >
          Пункт
        </Button>
      </Stack>

      <SortableContext
        items={day.items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {day.items.length === 0 ? (
          <Box
            sx={{
              minHeight: 76,
              borderRadius: '14px',
              border: '1px dashed',
              borderColor: isOver ? 'primary.main' : 'divider',
              bgcolor: isOver ? '#DDF1F2' : '#FBFCFD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              textAlign: 'center',
            }}
          >
            <Typography color="text.secondary" variant="body2">
              {isOver
                ? 'Отпустите пункт, чтобы переместить его сюда'
                : 'Пока нет пунктов. Добавьте первое место на этот день.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {day.items.map((item, itemIndex) => (
              <ItineraryItemCard
                key={item.id}
                item={item}
                index={itemOffset + itemIndex}
                dayIndex={dayIndex}
                dayDate={day.date}
                onEdit={onEdit}
                onDelete={onDelete}
                deleting={deletingId === item.id}
                dragDisabled={dragDisabled}
              />
            ))}
          </Stack>
        )}
      </SortableContext>
    </Paper>
  )
}

function RouteMapPreview({ days, items }: { days: TripDay[]; items: ItineraryItem[] }) {
  const points = [
    { x: 110, y: 90 },
    { x: 230, y: 200 },
    { x: 300, y: 330 },
    { x: 120, y: 300 },
  ]
  const dayByDate = new Map(days.map((day, index) => [day.date, index] as const))
  const markers = items.slice(0, points.length)
  const legendDays = days.filter((day) => day.items.length > 0)

  return (
    <Paper
      component="aside"
      aria-label="Карта маршрута"
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: { xs: 300, lg: 520 },
          borderRadius: '14px',
          overflow: 'hidden',
          bgcolor: '#E9F1F4',
        }}
      >
        <svg
          role="img"
          aria-label={`Схема карты маршрута, пунктов: ${items.length}`}
          width="100%"
          height="100%"
          viewBox="0 0 400 520"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M-20 360 C80 330 120 400 200 380 C280 360 320 420 420 400 L420 470 C320 490 260 440 200 450 C120 465 60 420 -20 440 Z"
            fill="#BFE0EA"
          />
          <path d="M0 120 L400 160" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M140 0 L180 520" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M0 260 L400 230" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M300 0 L270 520" stroke="#FFFFFF" strokeWidth="6" />
          <rect x="30" y="20" width="90" height="80" rx="8" fill="#DCE8D9" />
          <rect x="200" y="280" width="50" height="60" rx="8" fill="#DCE8D9" />
          {markers.length > 1 && (
            <polyline
              points={markers
                .map((item, index) => `${points[index].x},${points[index].y}`)
                .join(' ')}
              fill="none"
              stroke="#0E7C86"
              strokeWidth="4"
              strokeDasharray="2 9"
              strokeLinecap="round"
            />
          )}
          {markers.map((item, index) => {
            const dayIndex = dayByDate.get(item.day_date) ?? 0
            const fill = dayIndex % 2 === 1 ? '#F28F3B' : '#0E7C86'
            return (
              <g key={item.id}>
                <circle cx={points[index].x} cy={points[index].y} r="16" fill={fill} />
                <text
                  x={points[index].x}
                  y={points[index].y + 5}
                  textAnchor="middle"
                  fontFamily="Manrope, sans-serif"
                  fontSize="14"
                  fontWeight="700"
                  fill={dayIndex === 1 ? '#1B2433' : '#FFFFFF'}
                >
                  {index + 1}
                </text>
              </g>
            )
          })}
        </svg>
        <Box
          sx={{
            position: 'absolute',
            left: 1.5,
            bottom: 1.5,
            height: 28,
            px: 1.25,
            borderRadius: '8px',
            bgcolor: 'rgba(255,255,255,0.92)',
            color: '#3D4757',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <MapOutlinedIcon sx={{ fontSize: 15 }} />
          Здесь будет карта Leaflet
        </Box>
        {items.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stack
              alignItems="center"
              spacing={0.5}
              sx={{ bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 2, px: 2, py: 1.5 }}
            >
              <PlaceOutlinedIcon color="disabled" />
              <Typography variant="body2" color="text.secondary">
                Места появятся на карте
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {legendDays.map((day) => {
          const dayIndex = days.indexOf(day)
          return (
            <Stack key={day.date} direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: dayIndex % 2 === 1 ? 'secondary.main' : 'primary.main',
                }}
              />
              <Typography sx={{ fontSize: 13, color: '#3D4757', fontWeight: 700 }}>
                День {dayIndex + 1}
              </Typography>
            </Stack>
          )
        })}
        {legendDays.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            Добавьте места, чтобы увидеть дни маршрута
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
