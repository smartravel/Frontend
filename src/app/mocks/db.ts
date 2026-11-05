import type { Member, TripListItem } from '../../entities/trip'
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
    't-3': [
      { user_id: 'u-1', nickname: 'Даша', avatar_emoji: '🦊', role: 'organizer' },
      { user_id: 'u-4', nickname: 'Миша', avatar_emoji: '🐻', role: 'member' },
      { user_id: 'u-2', nickname: 'Женя', avatar_emoji: '🐼', role: 'member' },
    ],
  } as Record<string, Member[]>,

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
