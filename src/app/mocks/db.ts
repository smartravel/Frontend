import type { TripListItem } from '../../entities/trip'
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
