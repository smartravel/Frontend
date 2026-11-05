import { useOutletContext } from 'react-router'
import type { Member, Trip } from './types'

export type TripContext = {
  trip: Trip
  members: Member[]
}

export const useTripContext = () => useOutletContext<TripContext>()
