import { api } from '../../../shared/api'
import type { CreatePollRequest, Poll, UpdatePollRequest, VotePollRequest } from '../model/types'

export const pollsApi = {
  getList: (tripId: string) => api.get<Poll[]>(`/trips/${tripId}/polls`),
  create: (tripId: string, data: CreatePollRequest) =>
    api.post<Poll>(`/trips/${tripId}/polls`, data),
  update: (tripId: string, pollId: string, data: UpdatePollRequest) =>
    api.patch<Poll>(`/trips/${tripId}/polls/${pollId}`, data),
  vote: (tripId: string, pollId: string, data: VotePollRequest) =>
    api.put<Poll>(`/trips/${tripId}/polls/${pollId}/vote`, data),
  delete: (tripId: string, pollId: string) => api.delete<void>(`/trips/${tripId}/polls/${pollId}`),
}
