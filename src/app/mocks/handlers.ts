import { delay, http, HttpResponse } from 'msw'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../../entities/user'
import { API_URL } from '../../shared/config/env'
import { currentUser, db, startSession, toPublicUser } from './db'
import type { CreateTripRequest, TripListItem } from '../../entities/trip'

const url = (path: string) => `${API_URL}${path}`
const unauthorized = () => HttpResponse.json({ detail: 'Не авторизован' }, { status: 401 })
const today = () => new Date().toISOString().slice(0, 10)

const FORBIDDEN_TRIP_ID = 't-secret'

function findTrip(tripId: string) {
  if (tripId === FORBIDDEN_TRIP_ID) {
    return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
  }
  const trip = db.trips.find((t) => t.id === tripId)
  if (!trip) return HttpResponse.json({ detail: 'Поездка не найдена' }, { status: 404 })
  return trip
}

function tripDetail(trip: TripListItem) {
  const { members_preview: _preview, ...rest } = trip
  const details = db.tripDetails[trip.id]
  const daysLeft = Math.round(
    (new Date(`${trip.start_date}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) /
      86_400_000,
  )
  return {
    ...rest,
    destination: details?.destination ?? null,
    days_left: daysLeft,
    // Ссылку-приглашение видит только организатор
    invite_token: trip.my_role === 'organizer' ? details?.invite_token : undefined,
  }
}

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
    db.tripDetails[trip.id] = {
      destination: data.destination ?? null,
      invite_token: crypto.randomUUID().slice(0, 8),
    }
    db.members[trip.id] = [
      {
        user_id: user.id,
        nickname: user.nickname,
        avatar_emoji: user.avatar_emoji,
        role: 'organizer',
      },
    ]
    return HttpResponse.json(tripDetail(trip), { status: 201 })
  }),

  http.get(url('/trips/:tripId'), async ({ params }) => {
    await delay(400)
    if (!currentUser()) return unauthorized()
    const found = findTrip(String(params.tripId))
    if (found instanceof Response) return found
    return HttpResponse.json(tripDetail(found))
  }),

  http.get(url('/trips/:tripId/members'), async ({ params }) => {
    await delay(300)
    if (!currentUser()) return unauthorized()
    const found = findTrip(String(params.tripId))
    if (found instanceof Response) return found
    return HttpResponse.json(db.members[found.id] ?? [])
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
