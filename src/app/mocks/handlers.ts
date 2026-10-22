import { delay, http, HttpResponse } from 'msw'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../../entities/user'
import { API_URL } from '../../shared/config/env'
import { currentUser, db, startSession, toPublicUser } from './db'

const url = (path: string) => `${API_URL}${path}`
const unauthorized = () => HttpResponse.json({ detail: 'Не авторизован' }, { status: 401 })

export const handlers = [
  http.post(url('/auth/login'), async ({ request }) => {
    await delay(400)
    const { email, password } = (await request.json()) as LoginRequest
    const user = db.users.find((u) => u.email === email.toLowerCase())
    if (!user || user.password !== password) {
      return HttpResponse.json({ detail: 'Неверный email или пароль' }, { status: 401 })
    }
    startSession(user.id)
    return HttpResponse.json(toPublicUser(user))
  }),

  http.post(url('/auth/register'), async ({ request }) => {
    await delay(400)
    const data = (await request.json()) as RegisterRequest
    const email = data.email.toLowerCase()
    if (db.users.some((u) => u.email === email)) {
      return HttpResponse.json({ detail: 'Этот email уже зарегистрирован' }, { status: 409 })
    }
    const user = { ...data, email, id: crypto.randomUUID(), avatar_emoji: '🙂' }
    db.users.push(user)
    startSession(user.id)
    return HttpResponse.json(toPublicUser(user), { status: 201 })
  }),

  http.post(url('/auth/refresh'), () => {
    if (!db.session.userId) return unauthorized()
    db.session.accessValid = true
    return HttpResponse.json({ status: 'session_refreshed' })
  }),

  http.post(url('/auth/logout'), () => {
    db.session = { userId: null, accessValid: false }
    return HttpResponse.json({ status: 'logged_out' })
  }),

  http.get(url('/users/me'), () => {
    const user = currentUser()
    return user ? HttpResponse.json(toPublicUser(user)) : unauthorized()
  }),

  http.patch(url('/users/me'), async ({ request }) => {
    const user = currentUser()
    if (!user) return unauthorized()
    Object.assign(user, (await request.json()) as UpdateProfileRequest)
    return HttpResponse.json(toPublicUser(user))
  }),

  http.post(url('/__mock/expire-access'), () => {
    db.session.accessValid = false
    return new HttpResponse(null, { status: 204 })
  }),
]