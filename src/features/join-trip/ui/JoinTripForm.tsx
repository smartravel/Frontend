import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertTitle, Button, Stack } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { tripApi } from '../../../entities/trip'
import { ApiError } from '../../../shared/api'
import { formatCountdown, useCountdown } from '../../../shared/lib/useCountdown'
import { PasswordField } from '../../../shared/ui'
import { joinTripSchema, type JoinTripFormValues } from '../model/schema'

const lockUntil = (seconds: number) => Date.now() + seconds * 1000

export function JoinTripForm({ inviteToken }: { inviteToken: string }) {
  const navigate = useNavigate()
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const secondsLeft = useCountdown(lockedUntil)
  const locked = secondsLeft > 0

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JoinTripFormValues>({
    resolver: zodResolver(joinTripSchema),
    defaultValues: { password: '' },
  })

  async function onSubmit(values: JoinTripFormValues) {
    try {
      const trip = await tripApi.join({ invite_token: inviteToken, password: values.password })
      navigate(`/trips/${trip.id}`, { replace: true })
    } catch (e) {
      if (!(e instanceof ApiError)) {
        setError('root', { message: 'Неизвестная ошибка' })
        return
      }
      if (e.status === 403) {
        setError('password', { message: 'Неверный пароль. Уточните его у организатора' })
      } else if (e.status === 429) {
        setLockedUntil(lockUntil(e.retryAfter ?? 60))
      } else if (e.status === 404) {
        setError('root', { message: 'Ссылка-приглашение недействительна или устарела' })
      } else {
        setError('root', { message: e.message })
      }
    }
  }

  return (
    <Stack component="form" spacing={2.5} noValidate onSubmit={handleSubmit(onSubmit)}>
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      {locked && (
        <Alert severity="warning" icon={<LockOutlinedIcon />} role="alert">
          <AlertTitle>Слишком много попыток</AlertTitle>
          Попробуйте снова через <b>{formatCountdown(secondsLeft)}</b>. Если забыли пароль, спросите
          его у организатора.
        </Alert>
      )}

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <PasswordField
            {...field}
            label="Пароль поездки"
            autoComplete="off"
            disabled={locked}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={isSubmitting}
        disabled={locked}
      >
        {locked ? `Присоединиться через ${formatCountdown(secondsLeft)}` : 'Присоединиться'}
      </Button>
    </Stack>
  )
}
