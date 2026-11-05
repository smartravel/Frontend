export type CoverTheme = 'sunset' | 'mountains' | 'hills'
export type TripRole = 'member' | 'organizer'
export type StatusTrip = 'upcoming' | 'past'

export type MemberPreview = {
  user_id: string
  nickname: string
  avatar_emoji: string
}

export type TripListItem = {
  id: string
  title: string
  start_date: string
  end_date: string
  my_role: TripRole
  members_count: number
  members_preview: MemberPreview[]
  cover_theme: CoverTheme
}

export type Trip = {
  id: string
  title: string
  destination: string | null
  start_date: string
  end_date: string
  cover_theme: CoverTheme
  my_role: TripRole
  members_count: number
  days_left: number
  invite_token?: string
}

export type Member = MemberPreview & {
  role: TripRole
}

export type JoinTripRequest = {
  invite_token: string
  password: string
}

export type CreateTripRequest = {
  title: string
  destination?: string
  start_date: string
  end_date: string
  cover_theme: CoverTheme
  password: string
}
