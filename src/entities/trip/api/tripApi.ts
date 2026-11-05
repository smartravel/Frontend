import { api } from '../../../shared/api'
import type { CreateTripRequest, StatusTrip, TripListItem } from '../model/types'

export const tripApi = {
  getList: (status?: StatusTrip) =>
    api.get<TripListItem[]>(status ? `/trips?status=${status}` : '/trips'),
  create: (data: CreateTripRequest) => api.post<TripListItem>('/trips', data),
}
