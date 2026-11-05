import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { tripApi } from '../../../entities/trip'
import { ApiError } from '../../../shared/api'
import { createTripSchema, type CreateTripFormValues } from '../model/shema'
import { CoverPicker } from './CoverPicker'
import { PasswordField } from '../../../shared/ui'

type CreateTripDialogProps = {
  open: boolean
  onClose: () => void
}

export function CreateTripDialog({ open, onClose }: CreateTripDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <CreateTripForm onCancel={onClose} />
    </Dialog>
  )
}

const FIELD_NAMES = ['title', 'destination', 'start_date', 'end_date', 'cover_theme', 'password']

function CreateTripForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: '',
      destination: '',
      start_date: '',
      end_date: '',
      cover_theme: 'sunset',
      password: '',
    },
  })

  async function onSubmit(values: CreateTripFormValues) {
    try {
      const trip = await tripApi.create({
        ...values,
        destination: values.destination || undefined,
      })
      navigate(`/trips/${trip.id}`)
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          if (FIELD_NAMES.includes(field)) {
            setError(field as keyof CreateTripFormValues, { message })
          }
        }
        return
      }
      setError('root', { message: e instanceof ApiError ? e.message : 'Неизвестная ошибка' })
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h2" component="span" sx={{ display: 'block' }}>
          Новая поездка
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Вы станете организатором и сможете пригласить друзей
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 2.5 }}>
          {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Название"
                placeholder="Казань на выходные"
                autoFocus
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />

          <Controller
            name="destination"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Город · необязательно"
                error={!!errors.destination}
                helperText={
                  errors.destination?.message ?? 'Пригодится для напоминаний перед поездкой'
                }
              />
            )}
          />

          <Stack direction="row" spacing={2}>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Начало"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.start_date}
                  helperText={errors.start_date?.message}
                />
              )}
            />
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Конец"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.end_date}
                  helperText={errors.end_date?.message}
                />
              )}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>Обложка</Typography>
            <Controller
              name="cover_theme"
              control={control}
              render={({ field }) => <CoverPicker value={field.value} onChange={field.onChange} />}
            />
          </Stack>

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordField
                {...field}
                label="Пароль поездки"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={
                  errors.password?.message ?? 'Друзья введут его, когда откроют ссылку-приглашение'
                }
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="inherit" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" variant="contained" loading={isSubmitting}>
          Создать поездку
        </Button>
      </DialogActions>
    </Box>
  )
}
