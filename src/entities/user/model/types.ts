export type User = {
  id: string
  email: string
  nickname: string
  avatar_emoji: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = LoginRequest & {
  nickname: string
}

export type UpdateProfileRequest = Partial<Pick<User, 'nickname' | 'avatar_emoji'>>