import { Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { authApi } from '../../entities/user'
import { api, ApiError } from '../../shared/api'

// Временная проверка API-клиента. Настоящую форму сделаем позже
export function LoginPage() {
  const [log, setLog] = useState<string[]>([])
  const write = (line: string) => setLog((prev) => [...prev, line])

  async function run(label: string, action: () => Promise<string>) {
    try {
      write(`${label}: ${await action()}`)
    } catch (e) {
      write(`${label}: ошибка ${e instanceof ApiError ? `${e.status} ${e.message}` : e}`)
    }
  }

  return (
    <Stack spacing={2} sx={{ p: 6, alignItems: 'flex-start' }}>
      <Typography variant="h1">Проверка API</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="contained"
          onClick={() =>
            run('Вход', async () => {
              const user = await authApi.login({ email: 'dasha@mail.ru', password: 'secret123' })
              return `привет, ${user.avatar_emoji} ${user.nickname}`
            })
          }
        >
          Войти
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            run('Вход с неверным паролем', async () => {
              await authApi.login({ email: 'dasha@mail.ru', password: 'wrong' })
              return 'неожиданно получилось'
            })
          }
        >
          Неверный пароль
        </Button>
        <Button
          variant="outlined"
          onClick={() => run('Профиль', async () => (await authApi.getMe()).nickname)}
        >
          Загрузить профиль
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            run('Access просрочен', async () => {
              await api.post('/__mock/expire-access')
              return 'теперь загрузи профиль'
            })
          }
        >
          Просрочить access
        </Button>
        <Button
          variant="outlined"
          onClick={() => run('Выход', async () => (await authApi.logout()).status)}
        >
          Выйти
        </Button>
      </Stack>
      {log.map((line, i) => (
        <Typography key={i}>{line}</Typography>
      ))}
    </Stack>
  )
}