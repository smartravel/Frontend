import { api } from '../../../shared/api'
import type { CreateTripRequest, Member, StatusTrip, Trip, TripListItem } from '../model/types'

export const tripApi = {
  getList: (status?: StatusTrip) =>
    api.get<TripListItem[]>(status ? `/trips?status=${status}` : '/trips'),
  getById: (tripId: string) => api.get<Trip>(`/trips/${tripId}`),
  getMembers: (tripId: string) => api.get<Member[]>(`/trips/${tripId}/members`),
  create: (data: CreateTripRequest) => api.post<Trip>('/trips', data),
}
