import { gsap } from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { copy } from '../copy.js'
import { fill, phaseOf, dayOf } from '../lib/party.js'
import { buzz } from '../fx/haptics.js'

gsap.registerPlugin(ScrambleTextPlugin)

const $ = (s, r = document) => r.querySelector(s)
const pad = (n) => String(n).padStart(2, '0')
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const DAY = 86400000

/*
  Scene 3. The time left, but in his units. Tap the number to change them.
  The line underneath follows the calendar: before his birthday, on it, party day, during, after.
  More than two days after the party, hours are too many to look at: the first unit counts days.
*/
export function initCount({ P, T, clock, sfx }) {
  const bigBtn = $('#bigBtn')
  const bigN = $('#bigN')
  const bigU = $('#bigU')
  const eyebrow = $('#countEyebrow')
  const hint = $('#countHint')
  const lineEl = $('#countLine')
  const mapBtn = $('#countMap')
  const pipsEl = $('#countPips')
  const units = copy.count.units
  bigBtn.setAttribute('aria-describedby', 'countHint')

  let unit = 0
  let cells = [] // [{ k, ch, el }]
  let sig = ''
  let mode = ''
  let lineText = ''
  let tapped = false
  let flicker = null
  let inDays = false // the first unit is showing whole days (the party is more than two days behind us)

  // the small words under the number. the first unit says "days" instead of "hours" once it counts days
  const labelOf = (i) => fill(i === 0 && inDays ? copy.count.daysLabel : units[i].label, T)

  units.forEach(() => pipsEl.append(document.createElement('li')))
  const pips = [...pipsEl.children]
  const paintPips = () => pips.forEach((p, i) => p.classList.toggle('is-on', i === unit))

  /* ---------- the number ---------- */
  function cellsFor(ms) {
    const u = units[unit]
    if (u.clock && inDays) return [...String(Math.floor(ms / DAY))].map((ch) => ({ k: 'd', ch }))
    if (u.clock) {
      const s = Math.floor(ms / 1000)
      const text = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
      return [...text].map((ch) => ({ k: ch === ':' ? 's' : 'd', ch }))
    }
    const v = (ms / 3600000) * u.perHour
    const whole = Math.floor(v)
    const frac = (v - whole).toFixed(3).slice(2)
    return [...String(whole)].map((ch) => ({ k: 'd', ch })).concat([{ k: 'pt', ch: '.' }], [...frac].map((ch) => ({ k: 'f', ch })))
  }

  function fit() {
    bigN.style.setProperty('--big-fs', '100px')
    const natural = bigN.getBoundingClientRect().width || 1
    const avail = bigBtn.clientWidth || 280
    const tall = Math.min(window.innerHeight * 0.27, 170)
    const fs = Math.max(44, Math.min((avail / natural) * 100 * 0.985, tall))
    bigN.style.setProperty('--big-fs', fs.toFixed(1) + 'px')
  }

  function paint(next, animate = true) {
    const nextSig = next.map((c) => c.k).join('')
    if (nextSig !== sig) {
      sig = nextSig
      bigN.textContent = ''
      cells = next.map((c) => {
        const el = document.createElement('span')
        el.className = c.k
        el.textContent = c.ch
        bigN.append(el)
        return { ...c, el }
      })
      fit()
      return
    }
    next.forEach((c, i) => {
      const cell = cells[i]
      if (cell.ch === c.ch) return
      cell.ch = c.ch
      cell.el.textContent = c.ch
      if (animate && !reduce && c.k === 'd' && cell.el.animate) {
        cell.el.animate([{ transform: 'translateY(-14%)', opacity: 0.35 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'ease-out' })
      }
    })
  }

  /* ---------- where are we in the calendar ---------- */
  function readClock() {
    const now = clock.now()
    const ph = phaseOf(P, now)
    const m = ph.state === 'running' ? 'late' : ph.state === 'after' ? 'over' : 'to'
    const ms = Math.max(0, m === 'to' ? P.startMs - now : m === 'late' ? now - P.startMs : now - P.endMs)
    return { now, ph, m, ms, days: m === 'over' && ms >= 2 * DAY }
  }

  function lineFor(ph, now) {
    const L = copy.count.line
    const R = copy.count.rel
    const W = copy.count.when
    const A = copy.count.ago
    const rel = (gap) => (gap === 0 ? R.same : gap === 1 ? R.next : gap > 1 ? fill(R.after, { n: gap }) : gap === -1 ? R.prev : fill(R.before, { n: -gap }))
    const when = (n) => (n === 1 ? W.tomorrow : fill(W.inDays, { n }))
    switch (ph.state) {
      case 'before':
        return fill(ph.toBirthday === 1 ? L.beforeTomorrow : L.before, { ...T, n: ph.toBirthday, rel: rel(ph.gap) })
      case 'birthday':
        return fill(L.birthday, { ...T, when: when(ph.toParty) })
      case 'between': {
        const n = dayOf(P, now) - P.birthday.dayNo
        return fill(L.between, { ...T, ago: n === 1 ? A.yesterday : fill(A.daysAgo, { n }), when: when(ph.toParty) })
      }
      case 'partyday':
        return fill(L.partyday, T)
      case 'running':
        return fill(L.running, T)
      default:
        return fill(L.after, T)
    }
  }

  function swapText(el, text) {
    if (reduce) {
      el.textContent = text
      return
    }
    gsap
      .timeline()
      .to(el, { opacity: 0, y: -8, duration: 0.2 })
      .add(() => (el.textContent = text))
      .to(el, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' })
  }

  function render(animate = true) {
    if (flicker) return
    const { now, ph, m, ms, days } = readClock()
    if (days !== inDays) {
      inDays = days
      if (unit === 0) bigU.textContent = labelOf(0)
    }
    paint(cellsFor(ms), animate)

    if (m !== mode) {
      const first = mode === ''
      mode = m
      const t = fill(copy.count.eyebrow[m], T)
      if (first) eyebrow.textContent = t
      else swapText(eyebrow, t)
    }
    const line = lineFor(ph, now)
    if (line !== lineText) {
      const first = lineText === ''
      lineText = line
      if (first) lineEl.textContent = line
      else swapText(lineEl, line)
    }
    const showMap = ph.state === 'running' && !!P.mapLink
    if (showMap && mapBtn.hidden) {
      mapBtn.href = P.mapLink
      mapBtn.hidden = false
    } else if (!showMap && !mapBtn.hidden) mapBtn.hidden = true
  }

  /* ---------- tap: next unit ---------- */
  function cycle() {
    unit = (unit + 1) % units.length
    sfx.unlock()
    sfx.tick(1)
    buzz(12)
    paintPips()
    if (!tapped) {
      tapped = true
      gsap.to(hint, { opacity: 0, duration: 0.4 })
    }

    const { ms, days } = readClock()
    inDays = days
    const label = labelOf(unit)
    if (reduce) bigU.textContent = label
    else gsap.to(bigU, { duration: 0.8, scrambleText: { text: label, chars: 'lowerCase', speed: 0.6, revealDelay: 0.1 } })

    // the digits shuffle for a moment, then settle left to right
    const target = cellsFor(ms)
    paint(target, false)
    if (reduce) return
    const total = 520
    const t0 = performance.now()
    clearInterval(flicker)
    flicker = setInterval(() => {
      const p = (performance.now() - t0) / total
      if (p >= 1) {
        clearInterval(flicker)
        flicker = null
        // every digit settles on its real value (a number that stands still, like the days, would otherwise keep a shuffled digit)
        cells.forEach((c) => (c.el.textContent = c.ch))
        render(false)
        return
      }
      const lock = Math.floor(p * cells.length)
      cells.forEach((c, i) => {
        if (c.k === 's' || c.k === 'pt') return
        c.el.textContent = i < lock ? c.ch : String(Math.floor(Math.random() * 10))
      })
    }, 45)
  }

  bigBtn.addEventListener('click', cycle)

  /* ---------- go ---------- */
  inDays = readClock().days
  bigU.textContent = labelOf(0)
  paintPips()
  render(false)
  setInterval(render, 200)
  window.addEventListener('resize', () => {
    if (cells.length) fit()
  })
  if (document.fonts) document.fonts.ready.then(() => cells.length && fit())

  return {
    refit: () => cells.length && fit(),
    // called the first time the scene is on screen
    enter() {
      if (reduce) return
      gsap.fromTo([eyebrow, bigBtn, pipsEl, hint, lineEl], { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' })
    },
  }
}
