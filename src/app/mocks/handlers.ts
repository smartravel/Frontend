import { delay, http, HttpResponse } from 'msw'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../../entities/user'
import { API_URL } from '../../shared/config/env'
import { currentUser, db, startSession, toPublicUser } from './db'
import type { CreateTripRequest, TripListItem } from '../../entities/trip'

const url = (path: string) => `${API_URL}${path}`
const unauthorized = () => HttpResponse.json({ detail: 'Не авторизован' }, { status: 401 })
// Сегодняшняя дата в формате YYYY-MM-DD — так же, как даты поездок
const today = () => new Date().toISOString().slice(0, 10)

const tripHandlers = [
  http.get(url('/trips'), async ({ request }) => {
    await delay(500)
    if (!currentUser()) return unauthorized()
    const status = new URL(request.url).searchParams.get('status')
    const trips = db.trips.filter((trip) => {
      if (status === 'upcoming') return trip.end_date >= today()
      if (status === 'past') return trip.end_date < today()
      return true
    })
    return HttpResponse.json(trips)
  }),

  http.post(url('/trips'), async ({ request }) => {
    await delay(500)
    const user = currentUser()
    if (!user) return unauthorized()
    const data = (await request.json()) as CreateTripRequest
    if (data.end_date < data.start_date) {
      return HttpResponse.json(
        {
          detail: [
            {
              loc: ['body', 'end_date'],
              msg: 'Конец не может быть раньше начала',
              type: 'value_error',
            },
          ],
        },
        { status: 422 },
      )
    }
    const trip: TripListItem = {
      id: crypto.randomUUID(),
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      cover_theme: data.cover_theme,
      my_role: 'organizer',
      members_count: 1,
      members_preview: [
        { user_id: user.id, nickname: user.nickname, avatar_emoji: user.avatar_emoji },
      ],
    }
    db.trips.unshift(trip)
    return HttpResponse.json(
      { ...trip, destination: data.destination ?? null, invite_token: 'k7f2q9xa' },
      { status: 201 },
    )
  }),
]

export const handlers = [
  ...tripHandlers,
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
