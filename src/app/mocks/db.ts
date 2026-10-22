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
