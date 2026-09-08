const pad = (value) => String(value).padStart(2, '0')

/** `20:59` — every screen shows one day at a time, so the date is in its header. */
export const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

/** `Senin, 7 September 2026` — a day header, not a record stamp. */
export const formatDay = (date) =>
  date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
