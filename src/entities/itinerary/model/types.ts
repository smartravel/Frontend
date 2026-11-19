export type ItineraryItem = {
  id: string
  day_date: string
  title: string
  time?: string | null
  note?: string | null
  lat?: number | null
  lng?: number | null
  position: number
}

export type CreateItineraryRequest = {
  day_date: string
  title: string
  time?: string | null
  note?: string | null
  lat?: number | null
  lng?: number | null
  position?: number
}

export type UpdateItineraryRequest = Partial<CreateItineraryRequest>

export type ItineraryRatingSummary = {
  item_id: string
  average_rating: number | null
  ratings_count: number
  my_rating: number | null
  google_rating: number | null
  google_rating_count: number | null
}
