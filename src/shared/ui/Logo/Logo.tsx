import ExploreIcon from '@mui/icons-material/Explore'
import { Box, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
export function Logo() {
  return (
    <Link component={RouterLink} to="/" underline="none">
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          color="primary"
          sx={{
            height: '38px',
            width: '38px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
          }}
        >
          <ExploreIcon sx={{ color: 'primary.contrastText' }} />
        </Box>
        <Typography variant="h2" component="span" sx={{ color: 'text.primary' }}>
          SmartTravel
        </Typography>
      </Stack>
    </Link>
  )
}
