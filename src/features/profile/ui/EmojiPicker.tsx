import { Box, ButtonBase } from '@mui/material'
import { AVATAR_EMOJIS } from '../model/emoji'

type EmojiPickerProps = {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <Box
      role="group"
      aria-label="Аватарка"
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 1 }}
    >
      {AVATAR_EMOJIS.map(({ emoji, label }) => {
        const selected = emoji === value
        return (
          <ButtonBase
            key={emoji}
            aria-label={label}
            aria-pressed={selected}
            onClick={() => onChange(emoji)}
            sx={{
              aspectRatio: '1',
              minHeight: 44,
              borderRadius: '14px',
              fontSize: 26,
              border: 1,
              borderColor: selected ? 'primary.main' : 'divider',
              bgcolor: selected ? 'primary.light' : 'background.paper',
              boxShadow: selected ? (theme) => `0 0 0 1px ${theme.palette.primary.main}` : 'none',
            }}
          >
            {emoji}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
