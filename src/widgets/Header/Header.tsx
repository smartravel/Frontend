import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Box, Button, IconButton, Stack } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { useSession } from '../../entities/user'
import { Logo } from '../../shared/ui'
import { UserMenu } from './UserMenu'

export function Header() {
  const user = useSession((state) => state.user)

  return (
    <Box
      component="header"
      sx={{
        px: { xs: 2, md: 5 },
        py: 1.75,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Logo />
      {user ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconButton
            aria-label="Уведомления"
            sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', width: 44, height: 44 }}
          >
            <NotificationsNoneOutlinedIcon />
          </IconButton>
          <UserMenu user={user} />
        </Stack>
      ) : (
        <Button component={RouterLink} to="/login" variant="contained" sx={{ minHeight: 44 }}>
          Войти
        </Button>
      )}
    </Box>
  )
}
