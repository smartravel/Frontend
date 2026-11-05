export { tripApi } from './api/tripApi'
export type {
  CoverTheme,
  CreateTripRequest,
  JoinTripRequest,
  Member,
  MemberPreview,
  StatusTrip,
  Trip,
  TripListItem,
  TripRole,
} from './model/types'
export { useTripContext, type TripContext } from './model/context'
export { useTripSocket } from './model/useTripSocket'
export { COVER_BACKGROUNDS } from './model/covers'

export { TripCard } from './ui/TripCard'
export { CoverArt } from './ui/Covers'
