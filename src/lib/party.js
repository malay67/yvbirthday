/*
  Reads party.config.js and works out everything the page needs: real dates,
  weekdays, the moment the party starts and ends, and the links.

  Nothing in here touches the browser, so vite.config.js can use it too
  (that is how the page title and the WhatsApp preview get the right date).
*/

// day and month names come from the platform, so no real date is written anywhere in the code
const names = (opts, at) => Array.from({ length: opts.month ? 12 : 7 }, (_, i) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(at(i)))
const WEEK = names({ weekday: 'long' }, (i) => Date.UTC(2023, 0, 1 + i)) // day 0 of that year is the first day of the week
const MONTH = names({ month: 'long' }, (i) => Date.UTC(2023, i, 1))
export const DAY_MS = 86400000

const pad = (n) => String(n).padStart(2, '0')
const str = (v) => (v == null ? '' : String(v)).trim()

/* ---------- parsing ---------- */

// day/month/year, day first. Separators can be / . or -
function parseDate(v) {
  const m = str(v).match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})$/)
  if (!m) return null
  const d = +m[1]
  const mo = +m[2]
  const y = +m[3]
  const t = new Date(Date.UTC(y, mo - 1, d))
  // Date quietly rolls an impossible day into the next month. If it moved, the date was never real.
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null
  return { d, m: mo, y, wd: t.getUTCDay(), dayNo: Math.floor(t.getTime() / DAY_MS) }
}

// 12-hour with AM/PM, with or without minutes, or a 24-hour clock
function parseTime(v) {
  const m = str(v)
    .toLowerCase()
    .match(/^(\d{1,2})(?:\s*[:.]\s*(\d{2}))?\s*(?:([ap])\.?\s*m\.?)?$/)
  if (!m) return null
  let h = +m[1]
  const min = +(m[2] || 0)
  if (min > 59) return null
  if (m[3]) {
    if (h < 1 || h > 12) return null
    h = (h % 12) + (m[3] === 'p' ? 12 : 0)
  } else if (h > 23) return null
  const h12 = h % 12 || 12
  const ap = h >= 12 ? 'PM' : 'AM'
  return { h, min, label: min ? `${h12}:${pad(min)} ${ap}` : `${h12} ${ap}` }
}

// an offset from UTC, like +hh:mm
function parseZone(v) {
  const s = str(v).toUpperCase()
  if (s === 'Z' || s === 'UTC') return { min: 0, text: '+00:00' }
  const m = s.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!m) return null
  const h = +m[2]
  const mi = +(m[3] || 0)
  if (h > 14 || mi > 59) return null
  return { min: (m[1] === '-' ? -1 : 1) * (h * 60 + mi), text: `${m[1]}${pad(h)}:${pad(mi)}` }
}

function dateInfo(p) {
  const yy = String(p.y).slice(2)
  return {
    d: p.d,
    m: p.m,
    y: p.y,
    dd: pad(p.d),
    mm: pad(p.m),
    yy,
    wd: p.wd,
    dayNo: p.dayNo,
    weekday: WEEK[p.wd],
    weekdayShort: WEEK[p.wd].slice(0, 3),
    nextWeekday: WEEK[(p.wd + 1) % 7],
    month: MONTH[p.m - 1],
    monthShort: MONTH[p.m - 1].slice(0, 3),
    dots: `${pad(p.d)}.${pad(p.m)}.${yy}`,
    dotsLong: `${pad(p.d)}.${pad(p.m)}.${p.y}`,
  }
}

/* ---------- the check ---------- */

/*
  Returns { P, errors }.
  errors is a list of { field, value, message }: which line of party.config.js is wrong and why.
  P is everything derived, or null if anything was wrong.
*/
export function check(cfg = {}) {
  const errors = []
  const bad = (field, message) => errors.push({ field, value: str(cfg[field]), message })

  const name = str(cfg.name)
  if (!name) bad('name', "Write his name between the quote marks, like 'Yuvraj'.")

  const bday = parseDate(cfg.birthday)
  if (!bday) bad('birthday', 'That is not a real date. Write it day/month/year, like 07/03/2030.')

  const day = parseDate(cfg.partyDate)
  if (!day) bad('partyDate', 'That is not a real date. Write it day/month/year, like 07/03/2030.')

  const start = parseTime(cfg.partyTime)
  if (!start) bad('partyTime', "That is not a time. Write it like '7:15 PM'.")

  const end = parseTime(cfg.partyEnds)
  if (!end) bad('partyEnds', "That is not a time. Write it like '1:30 AM'.")

  const zone = parseZone(cfg.timezone)
  if (!zone) bad('timezone', "Write the hours and minutes ahead of UTC with a plus sign, like '+05:30' (that is India).")

  const mapLink = str(cfg.mapLink)
  if (mapLink && !/^https?:\/\/\S+$/i.test(mapLink)) bad('mapLink', "It should start with https://. In Google Maps tap Share, Copy link. Or leave '' for no map button.")

  let wa = ''
  const waRaw = str(cfg.rsvpWhatsApp)
  if (waRaw) {
    let digits = waRaw.replace(/[\s\-().+]/g, '')
    if (!/^\d+$/.test(digits)) digits = ''
    if (digits.length === 11 && digits[0] === '0') digits = digits.slice(1)
    if (digits.length === 10) digits = '91' + digits // a plain Indian mobile number
    if (digits.length < 8 || digits.length > 15) bad('rsvpWhatsApp', "Digits only, with the country code, like '919876543210'. Or leave '' and the guest picks who to send to.")
    else wa = digits
  }

  let age = null
  const ageRaw = str(cfg.age)
  if (ageRaw) {
    const n = Number(ageRaw)
    if (!Number.isInteger(n) || n < 1 || n > 120) bad('age', "Write a number like 25, or leave '' to skip the age joke.")
    else age = n
  }

  let siteUrl = ''
  const urlRaw = str(cfg.siteUrl)
  if (urlRaw) {
    try {
      const u = new URL(urlRaw)
      if (!/^https?:$/.test(u.protocol)) throw new Error('protocol')
      siteUrl = u.href.replace(/\/$/, '')
    } catch {
      bad('siteUrl', "It should look like 'https://yuvraj-bday.netlify.app'. Or leave '' until you have the address.")
    }
  }

  let startMs = 0
  let endMs = 0
  if (day && start && end && zone) {
    const startLocal = Date.UTC(day.y, day.m - 1, day.d, start.h, start.min)
    let endLocal = Date.UTC(day.y, day.m - 1, day.d, end.h, end.min)
    if (endLocal <= startLocal) endLocal += DAY_MS // ends after midnight
    if (endLocal === startLocal + DAY_MS) bad('partyEnds', 'That is the same time the party starts. Pick a different end time.')
    startMs = startLocal - zone.min * 60000
    endMs = endLocal - zone.min * 60000
  }

  if (errors.length) return { P: null, errors }

  const party = dateInfo(day)
  const P = {
    name,
    NAME: name.toUpperCase(),
    party,
    birthday: dateInfo(bday),
    time: start,
    ends: end,
    tz: zone,
    startMs,
    endMs,
    venue: str(cfg.venue),
    mapLink,
    waNumber: wa,
    age,
    siteUrl,
    weekend: party.wd === 5 || party.wd === 6, // the two nights before the weekend days off
    tonight: start.h >= 17 || start.h < 5 ? 'Tonight' : 'Today',
  }
  return { P, errors }
}

/* ---------- words ---------- */

// "Hello {name}" -> "Hello Yuvraj". Unknown {words} are left alone so a typo is easy to spot.
export function fill(s, t) {
  return String(s).replace(/\{(\w+)\}/g, (m, k) => (k in t ? t[k] : m))
}

// an accession number, built from his birthday: 2026.10.11.003 (year.month.day.number)
export function accession(P, n) {
  const b = P.birthday
  return `${b.y}.${b.mm}.${b.dd}.${String(n).padStart(3, '0')}`
}

// everything a line in copy.js can ask for, e.g. {weekday} {time} {name}
export function tokens(P, copy) {
  const p = P.party
  const b = P.birthday
  const t = {
    name: P.name,
    NAME: P.NAME,
    weekday: p.weekday,
    weekdayShort: p.weekdayShort,
    nextWeekday: p.nextWeekday,
    day: p.d,
    month: p.month,
    monthShort: p.monthShort,
    year: p.y,
    date: `${p.weekdayShort} ${p.d} ${p.monthShort}`,
    dateLong: `${p.weekday} ${p.d} ${p.month}`,
    partyDay: `${p.weekday} ${p.d} ${p.month}`,
    // the day he was born. the year is only added if you set an age in party.config.js (the birthday there is this year's)
    birthday: P.age == null ? `${b.d} ${b.month}` : `${b.d} ${b.month} ${b.y - P.age}`,
    accession: accession(P, 1),
    time: P.time.label,
    ends: P.ends.label,
    dots: p.dots,
    dotsLong: p.dotsLong,
    place: P.venue || copy.place.empty,
    age: P.age == null ? '' : P.age,
    ticketNo: `${p.dd}${p.mm}`,
    tonight: P.tonight,
    birthdayWeekday: b.weekday,
    birthdayDate: `${b.weekdayShort} ${b.d} ${b.monthShort}`,
    // the friend who promised the cake. empty means there are no cake jokes at all
    cakeGuy: str(copy.cakeGuy),
  }
  // a weekday party is the next morning's problem. a weekend night has no excuses.
  t.dayJoke = fill(P.weekend ? copy.hero.weekendLine : copy.hero.weekdayLine, t)
  return t
}

/* ---------- which line is it? ---------- */

// finds the line number of each wrong setting in the text of party.config.js
export function withLines(raw, errors) {
  const lines = String(raw || '').split(/\r?\n/)
  return errors.map((e) => {
    const re = new RegExp('^\\s*' + e.field + '\\s*:')
    const i = lines.findIndex((l) => re.test(l))
    return { ...e, line: i < 0 ? 0 : i + 1 }
  })
}

/* ---------- where are we on the calendar? ---------- */

// the calendar day (a whole number) that a moment falls on, in the party's own time zone
export const dayOf = (P, ms) => Math.floor((ms + P.tz.min * 60000) / DAY_MS)

/*
  before    more than a day before his birthday and the party
  birthday  it is his birthday, the party is still ahead
  between   his birthday has passed, the party is still ahead
  partyday  the party is today, doors not open yet
  running   the party is on
  after     it is over
*/
export function phaseOf(P, ms) {
  if (ms >= P.endMs) return { state: 'after' }
  if (ms >= P.startMs) return { state: 'running' }
  const today = dayOf(P, ms)
  const B = P.birthday.dayNo
  const D = P.party.dayNo
  if (today >= D) return { state: 'partyday' }
  if (today === B) return { state: 'birthday', toParty: D - today }
  if (today > B) return { state: 'between', toParty: D - today }
  return { state: 'before', toBirthday: B - today, gap: D - B }
}

/* ---------- shared pieces built from copy.js ---------- */

// what goes in the calendar entry
export function calendarParts(P, copy) {
  const t = tokens(P, copy)
  return { title: fill(copy.calendar.title, t), description: fill(copy.calendar.description, t), location: P.venue || t.place }
}

// the browser tab title and the card that shows when the link is shared
export function metaParts(P, copy) {
  const t = tokens(P, copy)
  return {
    title: fill(copy.meta.title, t),
    description: fill(copy.meta.description, t),
    noscript: fill(copy.meta.noscript, t),
    image: P.siteUrl ? `${P.siteUrl}/og.jpg` : '',
    url: P.siteUrl ? `${P.siteUrl}/` : '',
  }
}

// the message that opens in WhatsApp. `extra` is an optional second line (what the guest collected)
export function whatsappMessage(P, copy, extra = '') {
  const t = tokens(P, copy)
  const base = fill(P.venue ? copy.whatsapp.withPlace : copy.whatsapp.noPlace, t)
  return extra ? `${base}\n${extra}` : base
}

/* ---------- calendar and WhatsApp ---------- */

const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s) => String(s).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\r?\n/g, '\\n')

function fold(line) {
  const out = []
  let s = line
  while (s.length > 74) {
    out.push(s.slice(0, 74))
    s = ' ' + s.slice(74)
  }
  out.push(s)
  return out.join('\r\n')
}

// the text of an .ics calendar file
export function buildIcs(P, { title, description, location }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Birthday invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:birthday-${P.party.y}${P.party.mm}${P.party.dd}@invite`,
    `DTSTAMP:${utc(Date.now())}`,
    `DTSTART:${utc(P.startMs)}`,
    `DTEND:${utc(P.endMs)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

// a link that opens Google Calendar with the event filled in (works where downloads do not)
export function googleCalUrl(P, { title, description, location }) {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${utc(P.startMs)}/${utc(P.endMs)}`, details: description, location })
  return 'https://calendar.google.com/calendar/render?' + q.toString()
}

// opens WhatsApp with the message typed in. With no number, the guest picks the chat.
export function whatsappUrl(P, message) {
  const t = encodeURIComponent(message)
  return P.waNumber ? `https://wa.me/${P.waNumber}?text=${t}` : `https://wa.me/?text=${t}`
}
