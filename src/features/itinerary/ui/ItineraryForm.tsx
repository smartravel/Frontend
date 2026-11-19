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
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(item?.title ?? '')
    setDayDate(item?.day_date ?? initialDate)
    setTime(item?.time ?? '')
    setNote(item?.note ?? '')
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

    setValidationError('')
    await onSubmit({
      day_date: dayDate,
      title: title.trim(),
      time: time || null,
      note: note.trim() || null,
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
