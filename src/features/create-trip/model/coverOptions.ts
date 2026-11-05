import type { CoverTheme } from '../../../entities/trip'

export const COVER_OPTIONS: { value: CoverTheme; label: string }[] = [
  { value: 'sunset', label: 'Закат' },
  { value: 'mountains', label: 'Горы' },
  { value: 'hills', label: 'Холмы' },
]
