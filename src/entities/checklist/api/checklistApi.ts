import { api } from '../../../shared/api'
import type {
  ChecklistItem,
  ChecklistScope,
  CreateChecklistRequest,
  UpdateChecklistRequest,
} from '../model/types'

export const checklistApi = {
  getList: (tripId: string, scope: ChecklistScope) =>
    api.get<ChecklistItem[]>(`/trips/${tripId}/checklist?scope=${scope}`),
  create: (tripId: string, data: CreateChecklistRequest) =>
    api.post<ChecklistItem>(`/trips/${tripId}/checklist`, data),
  update: (tripId: string, itemId: string, data: UpdateChecklistRequest) =>
    api.patch<ChecklistItem>(`/trips/${tripId}/checklist/${itemId}`, data),
  delete: (tripId: string, itemId: string) =>
    api.delete<void>(`/trips/${tripId}/checklist/${itemId}`),
}
