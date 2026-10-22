import { API_URL } from '../config/env'
import { ApiError } from './ApiError'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

async function send(method: Method, path: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Нет связи с сервером')
  }
}

let refreshPromise: Promise<boolean> | null = null
function refreshSession(): Promise<boolean> {
  refreshPromise ??= send('POST', '/auth/refresh')
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response = await send(method, path, body)

  if (response.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshSession()) {
      response = await send(method, path, body)
    }
    if (response.status === 401) onUnauthorized()
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined
    throw new ApiError(response.status, data?.detail, retryAfter)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}