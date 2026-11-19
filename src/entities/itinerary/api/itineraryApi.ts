import { api } from '../../../shared/api'
import type {
  CreateItineraryRequest,
  ItineraryItem,
  UpdateItineraryRequest,
  ItineraryRatingSummary,
} from '../model/types'

export const itineraryApi = {
  getList: (tripId: string) => api.get<ItineraryItem[]>(`/trips/${tripId}/itinerary`),
  create: (tripId: string, data: CreateItineraryRequest) =>
    api.post<ItineraryItem>(`/trips/${tripId}/itinerary`, data),
  update: (tripId: string, itemId: string, data: UpdateItineraryRequest) =>
    api.patch<ItineraryItem>(`/trips/${tripId}/itinerary/${itemId}`, data),
  delete: (tripId: string, itemId: string) =>
    api.delete<void>(`/trips/${tripId}/itinerary/${itemId}`),
  getRatingSummaries: (tripId: string) =>
    api.get<ItineraryRatingSummary[]>(`/trips/${tripId}/itinerary/ratings`),
  rate: (tripId: string, itemId: string, rating: number) =>
    api.put<ItineraryRatingSummary>(`/trips/${tripId}/itinerary/${itemId}/rating`, { rating }),
}
