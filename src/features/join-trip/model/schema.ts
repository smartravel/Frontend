import { z } from 'zod'

export const joinTripSchema = z.object({
  password: z.string().min(1, 'Введите пароль поездки'),
})

export type JoinTripFormValues = z.infer<typeof joinTripSchema>
