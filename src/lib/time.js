const pad = (value) => String(value).padStart(2, '0')

/** `2026-09-06 20:59:32` — the format orders carried before Firestore. */
export const formatTimestamp = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

/** `Senin, 7 September 2026` — a day header, not a record stamp. */
export const formatDay = (date) =>
  date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
