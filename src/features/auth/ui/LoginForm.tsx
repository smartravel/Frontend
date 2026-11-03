import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '../model/schemas'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { useSession } from '../../../entities/user'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api'

export function LoginForm() {
  const login = useSession((state) => state.login)
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values)
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
          <TextField
            {...field}
            label="Password"
            autoComplete="current-password"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
      />
      <Button type="submit" variant="contained" loading={isSubmitting}>
        Войти
      </Button>
    </Stack>
  )
}
