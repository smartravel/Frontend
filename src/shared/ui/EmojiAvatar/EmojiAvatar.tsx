import { Box } from '@mui/material'

const SIZES = { sm: 32, md: 40, lg: 48 }
const BACKGROUNDS = ['#FDEBDB', '#E1ECFB', '#DDF1F2', '#E6F2EA', '#F3E8FB', '#FBE4E8']

function pickBackground(emoji: string) {
  let hash = 0
  for (const char of emoji) hash = (hash + char.codePointAt(0)!) % BACKGROUNDS.length
  return BACKGROUNDS[hash]
}

type EmojiAvatarProps = {
  emoji: string
  size?: keyof typeof SIZES
  label?: string
}

export function EmojiAvatar({ emoji, size = 'md', label }: EmojiAvatarProps) {
  const px = SIZES[size]
  return (
    <Box
      component="span"
      role="img"
      aria-label={label ?? emoji}
      sx={{
        width: px,
        height: px,
        flexShrink: 0,
        borderRadius: '50%',
        bgcolor: pickBackground(emoji),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px * 0.55,
        lineHeight: 1,
      }}
    >
      {emoji}
    </Box>
  )
}
