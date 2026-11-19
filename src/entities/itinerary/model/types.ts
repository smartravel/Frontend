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
