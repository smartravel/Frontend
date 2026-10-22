import { Box, Button, Divider, ListItemText, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSession, type User } from '../../entities/user'
import { EmojiAvatar } from '../../shared/ui'

export function UserMenu({ user }: { user: User }) {
  const logout = useSession((state) => state.logout)
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  async function handleLogout() {
    setAnchor(null)
    await logout()
    navigate('/login')
  }

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<EmojiAvatar emoji={user.avatar_emoji} size="sm" />}
        sx={{
          color: 'text.primary',
          border: 1,
          borderColor: 'divider',
          borderRadius: '22px',
          minHeight: 44,
          pl: 0.5,
          pr: 2,
          '& .MuiButton-startIcon': { ml: 0 },
        }}
      >
        {user.nickname}
      </Button>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: '16px' } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <ListItemText primary={user.nickname} secondary={user.email} />
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>Выйти</MenuItem>
      </Menu>
    </>
  )
}
