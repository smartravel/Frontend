type ValidationIssue = { loc: (string | number)[]; msg: string; type: string }

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  retryAfter?: number

  constructor(status: number, detail: unknown, retryAfter?: number) {
    super(ApiError.toMessage(detail))
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = ApiError.toFieldErrors(detail)
    this.retryAfter = retryAfter
  }

  private static toMessage(detail: unknown): string {
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return 'Проверьте правильность заполнения полей'
    return 'Что-то пошло не так, попробуйте ещё раз'
  }

  private static toFieldErrors(detail: unknown): Record<string, string> {
    if (!Array.isArray(detail)) return {}
    const result: Record<string, string> = {}
    for (const issue of detail as ValidationIssue[]) {
      const field = issue.loc.at(-1)
      if (field !== undefined) result[String(field)] = issue.msg
    }
    return result
  }
}
