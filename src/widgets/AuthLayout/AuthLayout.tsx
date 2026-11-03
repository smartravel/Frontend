import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Logo } from '../../shared/ui'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      {/* Левая бирюзовая панель */}
      <Box
        component="section"
        sx={{
          flex: '1 1 480px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: { xs: 4, md: 7 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <Typography variant="h1" component="p" sx={{ maxWidth: 460 }}>
          Путешествуйте вместе, а не в чатах
        </Typography>
        <Typography sx={{ maxWidth: 460, fontSize: 17, opacity: 0.9 }}>
          Маршрут, вещи, голосования и общие расходы — в одном месте для всей компании.
        </Typography>
      </Box>

      {/* Правая колонка с карточкой */}
      <Box
        sx={{
          flex: '1 1 440px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4.5 }, borderRadius: '24px' }}
        >
          <Stack spacing={3}>
            <Logo />
            <Stack spacing={1}>
              <Typography variant="h1" sx={{ fontSize: 28 }}>
                {title}
              </Typography>
              <Typography color="text.secondary">{subtitle}</Typography>
            </Stack>
            {children}
            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              {footer}
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
