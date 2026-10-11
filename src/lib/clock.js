/*
  "What time is it?", with a way to ask the page to pretend.

    ?now=YYYY-MM-DDTHH:MM     the page behaves as if it is that moment
                              (read as time at the party, then it keeps ticking)

  Handy for seeing every state of the countdown before the day.
*/
const pad = (n) => String(n).padStart(2, '0')

export function makeClock(P, search = location.search) {
  const raw = new URLSearchParams(search).get('now')
  let offset = 0
  let preview = false

  if (raw) {
    const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i)
    if (m) {
      const [, y, mo, d, h = '0', mi = '0', s = '0', zone] = m
      let ms
      if (zone) {
        const z = zone.toUpperCase() === 'Z' ? 'Z' : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone
        ms = Date.parse(`${y}-${mo}-${d}T${pad(h)}:${mi}:${pad(s)}${z}`)
      } else {
        ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - P.tz.min * 60000
      }
      if (!Number.isNaN(ms)) {
        offset = ms - Date.now()
        preview = true
      }
    }
  }

  return { now: () => Date.now() + offset, preview }
}
