import { Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useSession } from '../../entities/user'
import { api, ApiError } from '../../shared/api'

export function LoginPage() {
  const user = useSession((state) => state.user)
  const status = useSession((state) => state.status)
  const login = useSession((state) => state.login)
  const logout = useSession((state) => state.logout)
  const [error, setError] = useState<string | null>(null)

  async function tryLogin(password: string) {
    setError(null)
    try {
      await login({ email: 'dasha@mail.ru', password })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Неизвестная ошибка')
    }
  }

  return (
    <Stack spacing={2} sx={{ p: 6, alignItems: 'flex-start' }}>
      <Typography variant="h1">Проверка сессии</Typography>
      <Typography>
        Статус: <b>{status}</b>
        {user && ` · ${user.avatar_emoji} ${user.nickname}`}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" onClick={() => tryLogin('secret123')}>
          Войти
        </Button>
        <Button variant="outlined" onClick={() => tryLogin('wrong')}>
          Неверный пароль
        </Button>
        <Button variant="outlined" onClick={() => api.post('/__mock/expire-access')}>
          Просрочить access
        </Button>
        <Button variant="outlined" onClick={() => api.get('/users/me').catch(() => {})}>
          Запрос к API
        </Button>
        <Button variant="outlined" onClick={() => logout()}>
          Выйти
        </Button>
      </Stack>
      {error && <Typography color="error">{error}</Typography>}
    </Stack>
  )
}