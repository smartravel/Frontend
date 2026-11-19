import { api } from '../../../shared/api'
import type { CreateItineraryRequest, ItineraryItem, UpdateItineraryRequest } from '../model/types'

export const itineraryApi = {
  getList: (tripId: string) => api.get<ItineraryItem[]>(`/trips/${tripId}/itinerary`),
  create: (tripId: string, data: CreateItineraryRequest) =>
    api.post<ItineraryItem>(`/trips/${tripId}/itinerary`, data),
  update: (tripId: string, itemId: string, data: UpdateItineraryRequest) =>
    api.patch<ItineraryItem>(`/trips/${tripId}/itinerary/${itemId}`, data),
  delete: (tripId: string, itemId: string) =>
    api.delete<void>(`/trips/${tripId}/itinerary/${itemId}`),
}
