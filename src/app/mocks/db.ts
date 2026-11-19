import type { Member, TripListItem } from '../../entities/trip'
import type { ItineraryItem } from '../../entities/itinerary'
import type { ChecklistItem } from '../../entities/checklist'
import type { User } from '../../entities/user'

type MockUser = User & { password: string }

export const db = {
  users: [
    {
      id: 'u-1',
      email: 'dasha@mail.ru',
      password: 'secret123',
      nickname: 'Даша',
      avatar_emoji: '🦊',
    },
  ] as MockUser[],

  trips: [
    {
      id: 't-1',
      title: 'Казань на выходные',
      start_date: '2026-11-21',
      end_date: '2026-11-23',
      cover_theme: 'sunset',
      my_role: 'organizer',
      members_count: 5,
      members_preview: [
        { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊' },
        { user_id: 'u-2', nickname: 'Женя', avatar_emoji: '🐼' },
        { user_id: 'u-3', nickname: 'Оля', avatar_emoji: '🐳' },
      ],
    },
    {
      id: 't-2',
      title: 'Байкал зимой',
      start_date: '2027-02-14',
      end_date: '2027-02-21',
      cover_theme: 'mountains',
      my_role: 'member',
      members_count: 2,
      members_preview: [
        { user_id: 'u-5', nickname: 'Аня', avatar_emoji: '🐧' },
        { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊' },
      ],
    },
    {
      id: 't-3',
      title: 'Алтай с палатками',
      start_date: '2026-07-03',
      end_date: '2026-07-12',
      cover_theme: 'hills',
      my_role: 'organizer',
      members_count: 3,
      members_preview: [
        { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊' },
        { user_id: 'u-4', nickname: 'Миша', avatar_emoji: '🐻' },
        { user_id: 'u-2', nickname: 'Женя', avatar_emoji: '🐼' },
      ],
    },
  ] as TripListItem[],

  tripDetails: {
    't-1': { destination: 'Казань', invite_token: 'k7f2q9xa' },
    't-2': { destination: 'Иркутск', invite_token: 'b4k1l2m9' },
    't-3': { destination: null, invite_token: 'a1t2a3y4' },
    't-4': { destination: 'Санкт-Петербург', invite_token: 'piter2027' },
  } as Record<string, { destination: string | null; invite_token: string }>,

  members: {
    't-1': [
      { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊', role: 'organizer' },
      { user_id: 'u-2', nickname: 'Женя', avatar_emoji: '🐼', role: 'member' },
      { user_id: 'u-3', nickname: 'Оля', avatar_emoji: '🐳', role: 'member' },
      { user_id: 'u-4', nickname: 'Миша', avatar_emoji: '🐻', role: 'member' },
      { user_id: 'u-5', nickname: 'Аня', avatar_emoji: '🐧', role: 'member' },
    ],
    't-2': [
      { user_id: 'u-5', nickname: 'Аня', avatar_emoji: '🐧', role: 'organizer' },
      { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊', role: 'member' },
    ],
    't-4': [
      { user_id: 'u-3', nickname: 'Оля', avatar_emoji: '🐳', role: 'organizer' },
      { user_id: 'u-4', nickname: 'Миша', avatar_emoji: '🐻', role: 'member' },
    ],
    't-3': [
      { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊', role: 'organizer' },
      { user_id: 'u-4', nickname: 'Миша', avatar_emoji: '🐻', role: 'member' },
      { user_id: 'u-2', nickname: 'Женя', avatar_emoji: '🐼', role: 'member' },
    ],
  } as Record<string, Member[]>,

  invites: {
    k7f2q9xa: { tripId: 't-1', password: 'kazan' },
    b4k1l2m9: { tripId: 't-2', password: 'baikal' },
    a1t2a3y4: { tripId: 't-3', password: 'altai' },
    piter2027: { tripId: 't-4', password: 'nevsky' },
  } as Record<string, { tripId: string; password: string }>,

  hiddenTrips: [
    {
      id: 't-4',
      title: 'Питер белыми ночами',
      start_date: '2027-06-20',
      end_date: '2027-06-24',
      cover_theme: 'hills',
      my_role: 'member',
      members_count: 2,
      members_preview: [
        { user_id: 'u-3', nickname: 'Оля', avatar_emoji: '🐳' },
        { user_id: 'u-4', nickname: 'Миша', avatar_emoji: '🐻' },
      ],
    },
  ] as TripListItem[],

  itinerary: {
    't-1': [
      {
        id: 'route-1',
        day_date: '2026-11-21',
        title: 'Казанский кремль',
        time: '10:00',
        note: 'Билеты на башню купить заранее',
        lat: 55.7985,
        lng: 49.1064,
        position: 0,
      },
      {
        id: 'route-2',
        day_date: '2026-11-21',
        title: 'Улица Баумана',
        time: '13:30',
        note: 'Обед и прогулка',
        lat: 55.7879,
        lng: 49.1221,
        position: 1,
      },
      {
        id: 'route-3',
        day_date: '2026-11-21',
        title: 'Набережная Казанки',
        time: '19:00',
        note: 'Закат и фото',
        lat: 55.8094,
        lng: 49.1262,
        position: 2,
      },
      {
        id: 'route-4',
        day_date: '2026-11-22',
        title: 'Старо-Татарская слобода',
        time: '11:00',
        note: 'Попробовать эчпочмаки',
        lat: 55.7775,
        lng: 49.1192,
        position: 0,
      },
    ],
  } as Record<string, ItineraryItem[]>,

  checklist: {
    't-1': [
      {
        id: 'check-1',
        title: 'Аптечка',
        scope: 'shared',
        is_checked: false,
        assignee_id: 'u-3',
        owner_id: null,
      },
      {
        id: 'check-2',
        title: 'Настолка «Каркассон»',
        scope: 'shared',
        is_checked: false,
        assignee_id: 'u-4',
        owner_id: null,
      },
      {
        id: 'check-3',
        title: 'Портативная колонка',
        scope: 'shared',
        is_checked: false,
        assignee_id: null,
        owner_id: null,
      },
      {
        id: 'check-4',
        title: 'Распечатать билеты на поезд',
        scope: 'shared',
        is_checked: false,
        assignee_id: 'u-1',
        owner_id: null,
      },
      {
        id: 'check-5',
        title: 'Удлинитель',
        scope: 'shared',
        is_checked: false,
        assignee_id: null,
        owner_id: null,
      },
      {
        id: 'check-6',
        title: 'Пауэрбанк',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-2',
        owner_id: null,
      },
      {
        id: 'check-7',
        title: 'Термос',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-4',
        owner_id: null,
      },
      {
        id: 'check-8',
        title: 'Документы на поездку',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-1',
        owner_id: null,
      },
      {
        id: 'check-9',
        title: 'Зарядные кабели',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-1',
        owner_id: null,
      },
      {
        id: 'check-10',
        title: 'Настроить офлайн-карты',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-2',
        owner_id: null,
      },
      {
        id: 'check-11',
        title: 'Купить билеты в музей',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-2',
        owner_id: null,
      },
      {
        id: 'check-12',
        title: 'Забронировать столик',
        scope: 'shared',
        is_checked: true,
        assignee_id: 'u-3',
        owner_id: null,
      },
      {
        id: 'personal-1',
        title: 'Паспорт',
        scope: 'personal',
        is_checked: true,
        assignee_id: null,
        owner_id: 'u-1',
      },
      {
        id: 'personal-2',
        title: 'Зарядка для телефона',
        scope: 'personal',
        is_checked: false,
        assignee_id: null,
        owner_id: 'u-1',
      },
      {
        id: 'personal-3',
        title: 'Лекарства',
        scope: 'personal',
        is_checked: false,
        assignee_id: null,
        owner_id: 'u-1',
      },
      {
        id: 'personal-4',
        title: 'Наушники',
        scope: 'personal',
        is_checked: true,
        assignee_id: null,
        owner_id: 'u-1',
      },
      {
        id: 'personal-5',
        title: 'Солнцезащитные очки',
        scope: 'personal',
        is_checked: false,
        assignee_id: null,
        owner_id: 'u-1',
      },
    ] as (ChecklistItem & { owner_id: string | null })[],
  } as Record<string, (ChecklistItem & { owner_id: string | null })[]>,

  joinAttempts: {} as Record<string, { failed: number; lockedUntil: number }>,

  session: { userId: null as string | null, accessValid: false },
}

export const toPublicUser = ({ password: _password, ...user }: MockUser): User => user

export function startSession(userId: string) {
  db.session = { userId, accessValid: true }
}

export function currentUser() {
  const { userId, accessValid } = db.session
  if (!userId || !accessValid) return null
  return db.users.find((u) => u.id === userId) ?? null
}
