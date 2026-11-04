import { z } from 'zod'

export const profileSchema = z.object({
  nickname: z.string().trim().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  avatar_emoji: z.string().min(1, 'Выберите аватарку'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
