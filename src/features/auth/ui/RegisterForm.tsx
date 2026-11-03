import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormValues } from '../model/schemas'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { useSession } from '../../../entities/user'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api'
import { PasswordField } from './PasswordField'

export function RegisterForm() {
  const register = useSession((state) => state.register)
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nickname: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: RegisterFormValues) {
    try {
      await register({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
      })
      navigate('/')
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Неизвестная ошибка'
      setError('root', { message: message })
    }
  }

  return (
    <Stack component="form" spacing={2} noValidate onSubmit={handleSubmit(onSubmit)}>
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      <Controller
        name="nickname"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Имя пользователя"
            error={!!errors.nickname}
            helperText={errors.nickname?.message}
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            autoComplete="email"
            label="Email"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <PasswordField
            {...field}
            label="Пароль"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <PasswordField
            {...field}
            label="Повторите пароль"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
        )}
      />
      <Button type="submit" variant="contained" loading={isSubmitting}>
        Зарегистрироваться
      </Button>
    </Stack>
  )
}
