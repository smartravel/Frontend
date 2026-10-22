import { Typography } from '@mui/material'
import { useParams } from 'react-router'

export function TripPage() {
  const { tripId } = useParams()
  return <Typography variant="h1">Поездка {tripId}</Typography>
}
