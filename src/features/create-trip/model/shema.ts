import z from 'zod'

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1, 'Минимум 1 символ').max(120, 'Максимум 120 символов'),
    destination: z.string().max(120, 'Максимум 120 символов'),
    start_date: z.string().min(1, 'Укажите дату начала'),
    end_date: z.string().min(1, 'Укажите дату конца'),
    cover_theme: z.enum(['sunset', 'mountains', 'hills']),
    password: z.string().min(4, 'Минимум 4 символа'),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'Конец не может быть раньше начала',
    path: ['endDate'],
  })

export type CreateTripFormValues = z.infer<typeof createTripSchema>
