import CloseIcon from '@mui/icons-material/Close'
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material'
import type { Member } from '../../entities/trip'
import { useSession } from '../../entities/user'
import { EmojiAvatar } from '../../shared/ui'

type MembersDialogProps = {
  open: boolean
  onClose: () => void
  members: Member[]
}

export function MembersDialog({ open, onClose, members }: MembersDialogProps) {
  const myId = useSession((state) => state.user?.id)

  const sorted = [...members].sort((a, b) =>
    a.role === b.role
      ? a.nickname.localeCompare(b.nickname, 'ru')
      : a.role === 'organizer'
        ? -1
        : 1,
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 7 }}>Участники · {members.length}</DialogTitle>
      <IconButton
        aria-label="Закрыть"
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 12 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ pt: 0 }}>
        <List disablePadding>
          {sorted.map((member) => (
            <ListItem
              key={member.user_id}
              disableGutters
              secondaryAction={
                member.role === 'organizer' ? (
                  <Chip
                    label="Организатор"
                    size="small"
                    sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 }}
                  />
                ) : undefined
              }
            >
              <ListItemAvatar>
                <EmojiAvatar emoji={member.avatar_emoji} label={member.nickname} />
              </ListItemAvatar>
              <ListItemText
                primary={member.user_id === myId ? `${member.nickname} (вы)` : member.nickname}
                slotProps={{ primary: { sx: { fontWeight: 600 } } }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
