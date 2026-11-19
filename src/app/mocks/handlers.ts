import { delay, http, HttpResponse, ws } from 'msw'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../../entities/user'
import { API_URL } from '../../shared/config/env'
import { currentUser, db, startSession, toPublicUser } from './db'
import type { CreateTripRequest, JoinTripRequest, TripListItem } from '../../entities/trip'
import type { CreateItineraryRequest, ItineraryItem, UpdateItineraryRequest } from '../../entities/itinerary'
import type { ChecklistItem, ChecklistScope, CreateChecklistRequest, UpdateChecklistRequest } from '../../entities/checklist'
import type { CreatePollRequest, Poll, PollRecord, UpdatePollRequest, VotePollRequest } from '../../entities/polls'

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
    invite_token: trip.my_role === 'organizer' ? details?.invite_token : undefined,
  }
}

const wsOrigin = window.location.origin.replace(/^http/, 'ws')
const tripSocket = ws.link(`${wsOrigin}${API_URL}/ws/trips/:tripId`)

type SocketClient = { send: (data: string) => void }
const rooms = new Map<string, Set<SocketClient>>()

function notifyTrip(tripId: string, event: { type: string; entity: string; data: unknown }) {
  rooms.get(tripId)?.forEach((client) => client.send(JSON.stringify(event)))
}

const socketHandlers = [
  tripSocket.addEventListener('connection', ({ client, params }) => {
    const tripId = String(params.tripId)
    if (!currentUser()) {
      client.close(4401, 'Не авторизован')
      return
    }
    if (!rooms.has(tripId)) rooms.set(tripId, new Set())
    rooms.get(tripId)!.add(client)
    client.addEventListener('close', () => rooms.get(tripId)?.delete(client))
  }),
]

const GUESTS = [
  { nickname: 'Лена', avatar_emoji: '🦉' },
  { nickname: 'Костя', avatar_emoji: '🐢' },
  { nickname: 'Вика', avatar_emoji: '🦄' },
]

function publicChecklistItem(item: ChecklistItem & { owner_id: string | null }): ChecklistItem {
  return {
    id: item.id,
    title: item.title,
    scope: item.scope,
    is_checked: item.is_checked,
    assignee_id: item.assignee_id,
  }
}

function publicPoll(poll: PollRecord, tripId: string, userId: string): Poll {
  const members = db.members[tripId] ?? []
  const creator = members.find((member) => member.user_id === poll.created_by)
  const createdBy = creator ?? {
    user_id: poll.created_by,
    nickname: 'Участник',
    avatar_emoji: '🙂',
    role: 'member' as const,
  }
  const votersByOption = new Map<string, Array<{ user_id: string; nickname: string; avatar_emoji: string }>>()

  for (const vote of poll.votes) {
    const member = members.find((entry) => entry.user_id === vote.user_id)
    if (!member) continue
    const voters = votersByOption.get(vote.option_id) ?? []
    voters.push({ user_id: member.user_id, nickname: member.nickname, avatar_emoji: member.avatar_emoji })
    votersByOption.set(vote.option_id, voters)
  }

  return {
    id: poll.id,
    title: poll.title,
    status: poll.status,
    created_by: {
      user_id: createdBy.user_id,
      nickname: createdBy.nickname,
      avatar_emoji: createdBy.avatar_emoji,
    },
    created_at: poll.created_at,
    total_votes: poll.votes.length,
    total_members: members.length,
    my_option_id: poll.votes.find((vote) => vote.user_id === userId)?.option_id ?? null,
    options: poll.options.map((option) => ({
      ...option,
      votes_count: votersByOption.get(option.id)?.length ?? 0,
      voters: votersByOption.get(option.id) ?? [],
    })),
  }
}

const pollHandlers = [
  http.get(url('/trips/:tripId/polls'), async ({ params }) => {
    await delay(250)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }
    const polls = db.polls[tripId] ??= []
    return HttpResponse.json(polls.map((poll) => publicPoll(poll, tripId, user.id)))
  }),

  http.post(url('/trips/:tripId/polls'), async ({ params, request }) => {
    await delay(300)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const data = (await request.json()) as CreatePollRequest
    const title = data.title?.trim()
    const options = Array.isArray(data.options) ? data.options : []
    const normalized = options.map((option) => ({ title: option.title?.trim() ?? '', description: option.description?.trim() || null }))
    if (!title || normalized.length < 2 || normalized.length > 6 || normalized.some((option) => !option.title)) {
      return HttpResponse.json({ detail: 'Укажите вопрос и от двух до шести непустых вариантов' }, { status: 422 })
    }
    if (new Set(normalized.map((option) => option.title.toLocaleLowerCase())).size !== normalized.length) {
      return HttpResponse.json({ detail: 'Варианты ответа не должны повторяться' }, { status: 422 })
    }

    const poll: PollRecord = {
      id: crypto.randomUUID(),
      title,
      status: 'open',
      created_by: user.id,
      created_at: new Date().toISOString(),
      options: normalized.map((option) => ({ id: crypto.randomUUID(), ...option })),
      votes: [],
    }
    const polls = db.polls[tripId] ??= []
    polls.unshift(poll)
    const result = publicPoll(poll, tripId, user.id)
    notifyTrip(tripId, { type: 'created', entity: 'poll', data: result })
    return HttpResponse.json(result, { status: 201 })
  }),

  http.patch(url('/trips/:tripId/polls/:pollId'), async ({ params, request }) => {
    await delay(250)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    const members = db.members[tripId] ?? []
    const member = members.find((entry) => entry.user_id === user.id)
    if (!member) return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    const poll = (db.polls[tripId] ?? []).find((entry) => entry.id === String(params.pollId))
    if (!poll) return HttpResponse.json({ detail: 'Опрос не найден' }, { status: 404 })
    if (poll.created_by !== user.id && member.role !== 'organizer') {
      return HttpResponse.json({ detail: 'Закрыть опрос может его автор или организатор поездки' }, { status: 403 })
    }

    const data = (await request.json()) as UpdatePollRequest
    if (data.title !== undefined && !data.title.trim()) {
      return HttpResponse.json({ detail: 'Название опроса не может быть пустым' }, { status: 422 })
    }
    if (data.status !== undefined && data.status !== 'open' && data.status !== 'closed') {
      return HttpResponse.json({ detail: 'Недопустимый статус опроса' }, { status: 422 })
    }
    if (data.title !== undefined) poll.title = data.title.trim()
    if (data.status !== undefined) poll.status = data.status
    const result = publicPoll(poll, tripId, user.id)
    notifyTrip(tripId, { type: 'updated', entity: 'poll', data: result })
    return HttpResponse.json(result)
  }),

  http.delete(url('/trips/:tripId/polls/:pollId'), async ({ params }) => {
    await delay(250)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    const members = db.members[tripId] ?? []
    const member = members.find((entry) => entry.user_id === user.id)
    if (!member) return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    const polls = db.polls[tripId] ?? []
    const index = polls.findIndex((entry) => entry.id === String(params.pollId))
    if (index < 0) return HttpResponse.json({ detail: 'Опрос не найден' }, { status: 404 })
    if (polls[index].created_by !== user.id && member.role !== 'organizer') {
      return HttpResponse.json({ detail: 'Удалить опрос может его автор или организатор поездки' }, { status: 403 })
    }
    const [deleted] = polls.splice(index, 1)
    notifyTrip(tripId, { type: 'deleted', entity: 'poll', data: { id: deleted.id } })
    return new HttpResponse(null, { status: 204 })
  }),

  http.put(url('/trips/:tripId/polls/:pollId/vote'), async ({ params, request }) => {
    await delay(250)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }
    const poll = (db.polls[tripId] ?? []).find((entry) => entry.id === String(params.pollId))
    if (!poll) return HttpResponse.json({ detail: 'Опрос не найден' }, { status: 404 })
    if (poll.status === 'closed') {
      return HttpResponse.json({ detail: 'Опрос уже закрыт' }, { status: 409 })
    }

    const data = (await request.json()) as VotePollRequest
    if (!poll.options.some((option) => option.id === data.option_id)) {
      return HttpResponse.json({ detail: 'Такого варианта ответа нет' }, { status: 422 })
    }
    const existingVote = poll.votes.find((vote) => vote.user_id === user.id)
    if (existingVote) existingVote.option_id = data.option_id
    else poll.votes.push({ user_id: user.id, option_id: data.option_id })

    const result = publicPoll(poll, tripId, user.id)
    notifyTrip(tripId, { type: 'updated', entity: 'poll', data: result })
    return HttpResponse.json(result)
  }),
]

const checklistHandlers = [
  http.get(url('/trips/:tripId/checklist'), async ({ params, request }) => {
    await delay(250)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const scope = new URL(request.url).searchParams.get('scope') as ChecklistScope | null
    if (scope !== 'shared' && scope !== 'personal') {
      return HttpResponse.json({ detail: 'Укажите тип списка: shared или personal' }, { status: 422 })
    }
    const records = (db.checklist[tripId] ??= [])
    const visible = records.filter((item) =>
      item.scope === scope && (scope === 'shared' || item.owner_id === user.id),
    )
    return HttpResponse.json(visible.map(publicChecklistItem))
  }),

  http.post(url('/trips/:tripId/checklist'), async ({ params, request }) => {
    await delay(250)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    const members = db.members[tripId] ?? []
    if (!members.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const data = (await request.json()) as CreateChecklistRequest
    if (!data.title?.trim() || (data.scope !== 'shared' && data.scope !== 'personal')) {
      return HttpResponse.json(
        { detail: [{ loc: ['body', !data.title?.trim() ? 'title' : 'scope'], msg: 'Укажите название и тип списка', type: 'value_error' }] },
        { status: 422 },
      )
    }
    if (data.scope === 'shared' && data.assignee_id && !members.some((member) => member.user_id === data.assignee_id)) {
      return HttpResponse.json({ detail: 'Ответственный не является участником поездки' }, { status: 422 })
    }

    const record: ChecklistItem & { owner_id: string | null } = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      scope: data.scope,
      is_checked: false,
      assignee_id: data.scope === 'shared' ? data.assignee_id ?? null : null,
      owner_id: data.scope === 'personal' ? user.id : null,
    }
    const records = (db.checklist[tripId] ??= [])
    records.push(record)
    return HttpResponse.json(publicChecklistItem(record), { status: 201 })
  }),

  http.patch(url('/trips/:tripId/checklist/:itemId'), async ({ params, request }) => {
    await delay(200)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    const members = db.members[tripId] ?? []
    if (!members.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const records = (db.checklist[tripId] ??= [])
    const item = records.find((entry) =>
      entry.id === String(params.itemId) && (entry.scope === 'shared' || entry.owner_id === user.id),
    )
    if (!item) return HttpResponse.json({ detail: 'Пункт чеклиста не найден' }, { status: 404 })

    const data = (await request.json()) as UpdateChecklistRequest
    if (data.title !== undefined && !data.title.trim()) {
      return HttpResponse.json(
        { detail: [{ loc: ['body', 'title'], msg: 'Название не может быть пустым', type: 'value_error' }] },
        { status: 422 },
      )
    }
    if (data.assignee_id && !members.some((member) => member.user_id === data.assignee_id)) {
      return HttpResponse.json({ detail: 'Ответственный не является участником поездки' }, { status: 422 })
    }
    Object.assign(item, data)
    if (data.title !== undefined) item.title = data.title.trim()
    if (item.scope === 'personal') item.assignee_id = null
    return HttpResponse.json(publicChecklistItem(item))
  }),

  http.delete(url('/trips/:tripId/checklist/:itemId'), async ({ params }) => {
    await delay(200)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const records = (db.checklist[tripId] ??= [])
    const index = records.findIndex((entry) =>
      entry.id === String(params.itemId) && (entry.scope === 'shared' || entry.owner_id === user.id),
    )
    if (index < 0) return HttpResponse.json({ detail: 'Пункт чеклиста не найден' }, { status: 404 })
    records.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

const tripHandlers = [
  http.get(url('/trips/:tripId/itinerary'), async ({ params }) => {
    await delay(350)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }
    const items = (db.itinerary[tripId] ??= [])
    return HttpResponse.json([...items].sort((a, b) =>
      a.day_date.localeCompare(b.day_date) || a.position - b.position,
    ))
  }),

  http.post(url('/trips/:tripId/itinerary'), async ({ params, request }) => {
    await delay(350)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const data = (await request.json()) as CreateItineraryRequest
    if (!data.day_date || !data.title?.trim()) {
      return HttpResponse.json(
        {
          detail: [
            {
              loc: ['body', !data.day_date ? 'day_date' : 'title'],
              msg: !data.day_date ? 'Укажите дату' : 'Укажите название места',
              type: 'value_error',
            },
          ],
        },
        { status: 422 },
      )
    }

    const items = (db.itinerary[tripId] ??= [])
    const dayItems = items.filter((item) => item.day_date === data.day_date)
    const created: ItineraryItem = {
      id: crypto.randomUUID(),
      day_date: data.day_date,
      title: data.title.trim(),
      time: data.time ?? null,
      note: data.note ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      position: data.position ?? (dayItems.length ? Math.max(...dayItems.map((item) => item.position)) + 1 : 0),
    }
    items.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(url('/trips/:tripId/itinerary/:itemId'), async ({ params, request }) => {
    await delay(300)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const items = (db.itinerary[tripId] ??= [])
    const item = items.find((entry) => entry.id === String(params.itemId))
    if (!item) return HttpResponse.json({ detail: 'Пункт маршрута не найден' }, { status: 404 })

    const data = (await request.json()) as UpdateItineraryRequest
    if (data.title !== undefined && !data.title.trim()) {
      return HttpResponse.json(
        { detail: [{ loc: ['body', 'title'], msg: 'Укажите название места', type: 'value_error' }] },
        { status: 422 },
      )
    }

    const previousDate = item.day_date
    Object.assign(item, data)
    if (data.title !== undefined) item.title = data.title.trim()
    if (data.day_date && data.day_date !== previousDate && data.position === undefined) {
      const targetItems = items.filter((entry) => entry.day_date === data.day_date && entry.id !== item.id)
      item.position = targetItems.length ? Math.max(...targetItems.map((entry) => entry.position)) + 1 : 0
    }
    return HttpResponse.json(item)
  }),

  http.delete(url('/trips/:tripId/itinerary/:itemId'), async ({ params }) => {
    await delay(300)
    const user = currentUser()
    if (!user) return unauthorized()
    const tripId = String(params.tripId)
    const trip = findTrip(tripId)
    if (trip instanceof Response) return trip
    if (!db.members[tripId]?.some((member) => member.user_id === user.id)) {
      return HttpResponse.json({ detail: 'Вы не участник этой поездки' }, { status: 403 })
    }

    const items = (db.itinerary[tripId] ??= [])
    const itemIndex = items.findIndex((entry) => entry.id === String(params.itemId))
    if (itemIndex < 0) return HttpResponse.json({ detail: 'Пункт маршрута не найден' }, { status: 404 })
    items.splice(itemIndex, 1)
    return new HttpResponse(null, { status: 204 })
  }),
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

  http.post(url('/trips/join'), async ({ request }) => {
    await delay(500)
    const user = currentUser()
    if (!user) return unauthorized()
    const { invite_token, password } = (await request.json()) as JoinTripRequest
    const invite = db.invites[invite_token]
    if (!invite) return HttpResponse.json({ detail: 'Приглашение не найдено' }, { status: 404 })

    const attempts = (db.joinAttempts[invite_token] ??= { failed: 0, lockedUntil: 0 })
    const secondsLocked = Math.ceil((attempts.lockedUntil - Date.now()) / 1000)
    if (secondsLocked > 0) {
      return HttpResponse.json(
        { detail: 'Слишком много попыток' },
        { status: 429, headers: { 'Retry-After': String(secondsLocked) } },
      )
    }
    if (password !== invite.password) {
      attempts.failed += 1
      if (attempts.failed >= 3) {
        attempts.failed = 0
        attempts.lockedUntil = Date.now() + 60_000
        return HttpResponse.json(
          { detail: 'Слишком много попыток' },
          { status: 429, headers: { 'Retry-After': '60' } },
        )
      }
      return HttpResponse.json({ detail: 'Неверный пароль группы' }, { status: 403 })
    }

    attempts.failed = 0
    let trip = db.trips.find((t) => t.id === invite.tripId)
    if (!trip) {
      trip = db.hiddenTrips.find((t) => t.id === invite.tripId)!
      db.trips.unshift(trip)
    }
    const members = (db.members[trip.id] ??= [])
    if (!members.some((m) => m.user_id === user.id)) {
      const member = {
        user_id: user.id,
        nickname: user.nickname,
        avatar_emoji: user.avatar_emoji,
        role: 'member' as const,
      }
      members.push(member)
      trip.members_count = members.length
      notifyTrip(trip.id, { type: 'created', entity: 'member', data: member })
    }
    return HttpResponse.json(tripDetail(trip))
  }),

  http.post(url('/__mock/someone-joined/:tripId'), ({ params }) => {
    const tripId = String(params.tripId)
    const trip = db.trips.find((t) => t.id === tripId)
    if (!trip) return HttpResponse.json({ detail: 'Поездка не найдена' }, { status: 404 })
    const guest = GUESTS[(db.members[tripId]?.length ?? 0) % GUESTS.length]
    const member = { user_id: crypto.randomUUID(), ...guest, role: 'member' as const }
    db.members[tripId] = [...(db.members[tripId] ?? []), member]
    trip.members_count = db.members[tripId].length
    notifyTrip(tripId, { type: 'created', entity: 'member', data: member })
    return new HttpResponse(null, { status: 204 })
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
  ...socketHandlers,
  ...tripHandlers,
  ...checklistHandlers,
  ...pollHandlers,
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
