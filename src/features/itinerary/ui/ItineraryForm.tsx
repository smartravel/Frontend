import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { CreateItineraryRequest, ItineraryItem } from '../../../entities/itinerary'

type ItineraryFormProps = {
  open: boolean
  tripStart: string
  tripEnd: string
  initialDate: string
  item?: ItineraryItem | null
  saving?: boolean
  error?: string
  onClose: () => void
  onSubmit: (data: CreateItineraryRequest) => Promise<void>
}

export function ItineraryForm({
  open,
  tripStart,
  tripEnd,
  initialDate,
  item,
  saving = false,
  error,
  onClose,
  onSubmit,
}: ItineraryFormProps) {
  const [title, setTitle] = useState('')
  const [dayDate, setDayDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(item?.title ?? '')
    setDayDate(item?.day_date ?? initialDate)
    setTime(item?.time ?? '')
    setNote(item?.note ?? '')
    setLatitude(item?.lat != null ? String(item.lat) : '')
    setLongitude(item?.lng != null ? String(item.lng) : '')
    setValidationError('')
  }, [initialDate, item, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setValidationError('Укажите название места')
      return
    }
    if (!dayDate || dayDate < tripStart || dayDate > tripEnd) {
      setValidationError('Выберите дату в пределах поездки')
      return
    }

    const hasLatitude = latitude.trim() !== ''
    const hasLongitude = longitude.trim() !== ''
    if (hasLatitude !== hasLongitude) {
      setValidationError('Укажите обе координаты: широту и долготу')
      return
    }

    const parsedLatitude = hasLatitude ? Number(latitude) : null
    const parsedLongitude = hasLongitude ? Number(longitude) : null
    if (
      (parsedLatitude !== null &&
        (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) ||
      (parsedLongitude !== null &&
        (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180))
    ) {
      setValidationError('Проверьте координаты: широта от -90 до 90, долгота от -180 до 180')
      return
    }

    setValidationError('')
    await onSubmit({
      day_date: dayDate,
      title: title.trim(),
      time: time || null,
      note: note.trim() || null,
      lat: parsedLatitude,
      lng: parsedLongitude,
    })
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Stack component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontFamily: "'Unbounded', sans-serif", fontSize: 18, fontWeight: 600 }}>
          {item ? 'Редактировать пункт' : 'Новый пункт маршрута'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {(validationError || error) && (
              <Alert severity="error">{validationError || error}</Alert>
            )}
            <TextField
              autoFocus
              required
              fullWidth
              label="Название места"
              placeholder="Например, Казанский кремль"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
            <TextField
              required
              fullWidth
              type="date"
              label="День поездки"
              value={dayDate}
              onChange={(event) => setDayDate(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: tripStart, max: tripEnd },
              }}
              helperText="Дата должна попадать в период поездки"
            />
            <TextField
              fullWidth
              type="time"
              label="Время посещения"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Заметка"
              placeholder="Что важно не забыть?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                type="number"
                label="Широта (необязательно)"
                placeholder="55.7985"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                slotProps={{ htmlInput: { step: 'any', min: -90, max: 90 } }}
              />
              <TextField
                fullWidth
                type="number"
                label="Долгота (необязательно)"
                placeholder="49.1064"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                slotProps={{ htmlInput: { step: 'any', min: -180, max: 180 } }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Координаты нужны, чтобы показать место на карте и построить пеший маршрут. Их можно
              скопировать из ссылки OpenStreetMap.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button color="inherit" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Сохраняем…' : item ? 'Сохранить' : 'Добавить пункт'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
