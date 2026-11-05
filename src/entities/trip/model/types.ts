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

export type CreateTripRequest = {
  title: string
  destination?: string
  start_date: string
  end_date: string
  cover_theme: CoverTheme
  password: string
}
