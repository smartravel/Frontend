import DeleteOutlineIcon from '@mui/icons-material/Delete'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import PersonOutlineIcon from '@mui/icons-material/Person'
import {
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { useState } from 'react'
import type { ChecklistItem } from '../../../entities/checklist'
import type { Member } from '../../../entities/trip'
import { EmojiAvatar } from '../../../shared/ui'

type ChecklistItemRowProps = {
  item: ChecklistItem
  members: Member[]
  personal: boolean
  currentUserId?: string
  disabled?: boolean
  onToggle: (item: ChecklistItem, checked: boolean) => void
  onAssign: (item: ChecklistItem, assigneeId: string | null) => void
  onEdit: (item: ChecklistItem) => void
  onDelete: (item: ChecklistItem) => void
}

export function ChecklistItemRow({
  item,
  members,
  personal,
  currentUserId,
  disabled = false,
  onToggle,
  onAssign,
  onEdit,
  onDelete,
}: ChecklistItemRowProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  function handleAssigneeChange(event: SelectChangeEvent<string>) {
    onAssign(item, event.target.value || null)
  }

  return (
    <Stack
      direction="row"
      spacing={{ xs: 1, sm: 1.75 }}
      sx={{
        alignItems: 'center',
        px: { xs: 1.5, sm: 2.75 },
        py: 1.25,
        minHeight: 60,
        borderTop: '1px solid #EEF1F5',
        bgcolor: item.is_checked ? '#FFFFFF' : 'transparent',
      }}
    >
      <Checkbox
        checked={item.is_checked}
        disabled={disabled}
        onChange={(event) => onToggle(item, event.target.checked)}
        inputProps={{
          'aria-label': `${item.is_checked ? 'Снять отметку' : 'Отметить выполненным'}: ${item.title}`,
        }}
        sx={{ p: 0.25, color: '#AAB5C2', '&.Mui-checked': { color: 'primary.main' } }}
      />

      <Typography
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          fontSize: 16,
          fontWeight: item.is_checked ? 500 : 600,
          color: item.is_checked ? 'text.secondary' : 'text.primary',
          textDecoration: item.is_checked ? 'line-through' : 'none',
          overflowWrap: 'anywhere',
        }}
      >
        {item.title}
      </Typography>

      {!personal ? (
        <Select<string>
          value={item.assignee_id ?? ''}
          onChange={handleAssigneeChange}
          disabled={disabled}
          displayEmpty
          size="small"
          renderValue={(value) => {
            const selected = members.find((member) => member.user_id === value)
            return selected ? (
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <EmojiAvatar emoji={selected.avatar_emoji} size="sm" label={selected.nickname} />
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
                  {selected.user_id === currentUserId ? 'Я' : selected.nickname}
                </Typography>
              </Stack>
            ) : (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: 'center', color: 'text.secondary' }}
              >
                <PersonOutlineIcon sx={{ fontSize: 17 }} />
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>
                  Кто возьмёт?
                </Typography>
              </Stack>
            )
          }}
          sx={{
            flex: 'none',
            minWidth: { xs: 72, sm: 150 },
            maxWidth: { xs: 90, sm: 190 },
            height: 40,
            borderRadius: '18px',
            bgcolor: '#FFFFFF',

            '& .MuiSelect-select': {
              py: 0.5,
              pl: 1.5,
              pr: '32px !important',
              display: 'flex',
              alignItems: 'center',
            },

            '& fieldset': {
              borderStyle: item.assignee_id ? 'solid' : 'dashed',
              borderColor: item.assignee_id ? '#E3E8EF' : '#C9D3DF',
            },

            '& .MuiSvgIcon-root': {
              right: 6,
              fontSize: 18,
            },
          }}
          inputProps={{ 'aria-label': `Ответственный за ${item.title}` }}
        >
          <MenuItem value="">
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Без ответственного</ListItemText>
          </MenuItem>
          {members.map((member) => (
            <MenuItem key={member.user_id} value={member.user_id}>
              <ListItemIcon>
                <EmojiAvatar emoji={member.avatar_emoji} size="sm" />
              </ListItemIcon>
              <ListItemText>
                {member.user_id === currentUserId ? `Я (${member.nickname})` : member.nickname}
              </ListItemText>
            </MenuItem>
          ))}
        </Select>
      ) : (
        <Typography sx={{ flex: 'none', fontSize: 13, color: 'text.secondary' }}>
          Только вы
        </Typography>
      )}

      <IconButton
        aria-label={`Действия: ${item.title}`}
        disabled={disabled}
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        sx={{ width: 40, height: 40, flex: 'none', color: 'text.secondary' }}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            onEdit(item)
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Изменить название
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            onDelete(item)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          Удалить
        </MenuItem>
      </Menu>
    </Stack>
  )
}
