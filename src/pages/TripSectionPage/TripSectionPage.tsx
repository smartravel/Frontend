import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useTripContext } from '../../entities/trip'

export function TripSectionPage({ title }: { title: string }) {
  const { trip } = useTripContext()

  return (
    <Paper variant="outlined" sx={{ p: 5, borderRadius: '20px', textAlign: 'center' }}>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ConstructionOutlinedIcon />
        </Box>
        <Typography variant="h2">{title}</Typography>
        <Typography color="text.secondary">
          Раздел для поездки «{trip.title}» скоро появится
        </Typography>
      </Stack>
    </Paper>
  )
}
