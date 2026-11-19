export type ChecklistScope = 'shared' | 'personal'

export type ChecklistItem = {
  id: string
  title: string
  scope: ChecklistScope
  is_checked: boolean
  assignee_id: string | null
}

export type CreateChecklistRequest = {
  title: string
  scope: ChecklistScope
  assignee_id?: string | null
}

export type UpdateChecklistRequest = {
  title?: string
  is_checked?: boolean
  assignee_id?: string | null
}
