import { Box, ButtonBase, Typography } from '@mui/material'
import type { CoverTheme } from '../../../entities/trip'
import { COVER_BACKGROUNDS } from '../../../entities/trip/model/covers'
import { CoverArt } from '../../../entities/trip/ui/Covers'
import { COVER_OPTIONS } from '../model/coverOptions'

type CoverPickerProps = {
  value: CoverTheme
  onChange: (value: CoverTheme) => void
}

export function CoverPicker({ value, onChange }: CoverPickerProps) {
  return (
    <Box
      role="group"
      aria-label="Обложка"
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}
    >
      {COVER_OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <ButtonBase
            key={option.value}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, borderRadius: '14px' }}
          >
            <Box
              sx={{
                height: 84,
                borderRadius: '14px',
                overflow: 'hidden',
                bgcolor: COVER_BACKGROUNDS[option.value],
                boxShadow: (theme) =>
                  selected
                    ? `0 0 0 3px ${theme.palette.primary.main}`
                    : `0 0 0 1px ${theme.palette.divider}`,
              }}
            >
              <CoverArt theme={option.value} />
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: selected ? 700 : 600,
                color: selected ? 'primary.dark' : 'text.secondary',
              }}
            >
              {option.label}
            </Typography>
          </ButtonBase>
        )
      })}
    </Box>
  )
}
