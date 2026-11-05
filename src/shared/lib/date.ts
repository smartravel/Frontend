const toDate = (iso: string) => new Date(`${iso}T00:00:00`)

const rangeFormat = new Intl.DateTimeFormat('ru', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// «21–23 ноября 2026», «30 октября – 2 ноября 2026»
export function formatDateRange(start: string, end: string) {
  return rangeFormat.formatRange(toDate(start), toDate(end)).replace(/ г\./g, '')
}

// Сколько дней от сегодня до даты: 16, 0 (сегодня), -3 (уже прошло)
export function daysUntil(iso: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((toDate(iso).getTime() - today.getTime()) / 86_400_000)
}

const plural = new Intl.PluralRules('ru')

// pluralize(16, ['день', 'дня', 'дней']) → 'дней'
export function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const form = plural.select(n)
  return form === 'one' ? one : form === 'few' ? few : many
}
