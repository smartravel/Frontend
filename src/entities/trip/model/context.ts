import { useOutletContext } from 'react-router'
import type { SocketEvent, SocketStatus } from '../../../shared/api'
import type { Member, Trip } from './types'

export type TripContext = {
  trip: Trip
  members: Member[]
  socketStatus: SocketStatus
  subscribe: (listener: (event: SocketEvent) => void) => () => void
}

export const useTripContext = () => useOutletContext<TripContext>()
