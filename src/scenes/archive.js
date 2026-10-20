import { copy } from '../copy.js'
import { fill, accession } from '../lib/party.js'
import { buzz } from '../fx/haptics.js'
import { openSheet, closeSheet, trapSheet } from '../ui/sheet.js'

const $ = (s, r = document) => r.querySelector(s)
const pad2 = (n) => String(n).padStart(2, '0')
const make = (tag, cls, text) => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text != null) e.textContent = text
  return e
}
// lowercase, no accents, letters and digits only, single spaces:  "3 AM!"  ->  "3 am"
const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const MAX_Q = 32 // characters in the search box
const MAX_SHOWN = 6 // results on screen at once
const GO_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></svg>'

/*
  The search. The magnifier in the top bar opens it.
  It looks through the objects in the Collection, the rooms (the scenes) and the font credits, and a few questions
  ("when", "where", "sleep") get a straight answer. Everything it knows comes from copy.js, so it follows the text.
    object  -> the Collection opens on that card
    room    -> the page scrolls there
    credits -> the "Fonts in use" sheet opens
*/
export function initArchive({ P, T, sfx, goto, collection, colophon }) {
  const C = copy.archive
  const btn = $('#searchBtn')
  const sheet = $('#archiveSheet')
  const form = $('#archiveForm')
  const input = $('#archiveQ')
  const statusEl = $('#archiveStatus')
  const tryEl = $('#archiveTry')
  const listEl = $('#archiveList')
  if (!btn || !sheet) return

  const sw = Object.fromEntries(copy.collection.swatches.map((s) => [s.id, s]))
  const base = { ...T, objects: copy.collection.objects.length, rooms: copy.rooms.length }

  /* ---------- what it knows ---------- */
  // each text it can be found by has a weight: a hit in the title counts more than one in the small print
  const field = (text, w) => {
    const n = norm(text)
    return { hay: ` ${n} `, flat: n.replace(/ /g, ''), w }
  }
  const entries = []
  copy.collection.objects.forEach((o, i) => {
    const t = { ...base, accession: accession(P, i + 1) }
    const cols = (o.colours || []).map((id) => sw[id]).filter(Boolean)
    const title = fill(o.title, t)
    entries.push({
      kind: 'object',
      id: o.id,
      label: fill(C.kind.object, t),
      title,
      line: fill(o.note, t),
      hues: cols.map((c) => c.hex),
      fields: [
        field(title, 5),
        field((o.tags || []).join(' '), 4),
        field(cols.map((c) => `${c.id} ${(c.words || []).join(' ')}`).join(' '), 3),
        field(fill(o.sub || '', t), 3),
        field((o.rows || []).map(([, v]) => fill(v, t)).join(' '), 2),
        field(fill(o.note, t), 1),
      ],
    })
  })
  copy.rooms.forEach((r, i) => {
    const title = fill(r.name, base)
    const line = fill(r.line, base)
    entries.push({ kind: 'room', id: r.id, label: fill(C.kind.room, { n: pad2(i + 1) }), title, line, fields: [field(title, 5), field((r.words || []).join(' '), 4), field(line, 1)] })
  })
  C.extras.forEach((x) => {
    const title = fill(x.name, base)
    const line = fill(x.line, base)
    entries.push({ kind: 'extra', id: x.id, label: fill(C.kind.extra, base), title, line, fields: [field(title, 5), field((x.words || []).join(' '), 4), field(line, 1)] })
  })
  const answers = C.answers.map((a) => ({ words: a.words.map(norm), line: fill(a.line, base) }))

  /* ---------- looking things up ---------- */
  // a word matches the start of a word in the text ("ligh" finds "lighter"). a long word may match inside one.
  const hit = (f, term) => (term.length >= 5 ? f.hay.includes(term) : f.hay.includes(` ${term}`))
  function scoreOf(e, terms, flatQ) {
    let total = 0
    for (const term of terms) {
      let best = 0
      let places = 0
      for (const f of e.fields) {
        if (!hit(f, term)) continue
        places++
        if (f.w > best) best = f.w
      }
      if (!best) {
        total = 0
        break
      }
      total += best + places * 0.01
    }
    // "3 am" should still find "3am" (only for several words: on a single word it would find "red" inside "credits")
    if (!total && terms.length > 1) for (const f of e.fields) if (f.w > total && f.flat.includes(flatQ)) total = f.w
    return total
  }
  function search(q) {
    const nq = norm(q)
    const terms = nq.split(' ').filter((t) => t.length >= 2 || /\d/.test(t))
    if (!terms.length) return null
    const flatQ = nq.replace(/ /g, '')
    const found = entries
      .map((e, i) => ({ e, i, s: scoreOf(e, terms, flatQ) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, MAX_SHOWN)
      .map((x) => x.e)
    const said = answers.filter((a) => terms.some((t) => a.words.some((w) => w === t || (t.length >= 3 && w.startsWith(t))))).slice(0, 2)
    return { found, said }
  }

  /* ---------- showing it ---------- */
  const li = (child) => {
    const l = make('li')
    l.append(child)
    return l
  }
  function resultRow(e) {
    const b = make('button', 'hit')
    b.type = 'button'
    b.append(make('span', 'hit__k mono', e.label), make('span', 'hit__t', e.title))
    const side = make('span', 'hit__side')
    side.setAttribute('aria-hidden', 'true')
    if (e.hues) {
      for (const hex of e.hues) {
        const i = make('i')
        i.style.setProperty('--c', hex)
        side.append(i)
      }
    } else {
      side.innerHTML = GO_ICON // a fixed drawing, nothing typed by anyone
    }
    b.append(side, make('span', 'hit__s', e.line))
    b.addEventListener('click', () => go(e))
    return li(b)
  }
  function noteRow(text) {
    const p = make('p', 'hit hit--note')
    p.append(make('span', 'hit__k mono', C.kind.answer), make('span', 'hit__s', text))
    return li(p)
  }
  const shortQ = (q) => Array.from(q.trim()).slice(0, 24).join('')

  function render(q) {
    const r = search(q)
    tryEl.hidden = !!r
    if (!r) {
      statusEl.textContent = fill(C.hint, base)
      listEl.replaceChildren()
      return
    }
    const rows = [...r.said.map((a) => noteRow(a.line)), ...r.found.map(resultRow)]
    if (!rows.length) rows.push(noteRow(fill(C.none, { ...base, q: shortQ(q) })))
    const n = r.said.length + r.found.length
    statusEl.textContent = n === 1 ? C.countOne : fill(C.count, { n })
    listEl.replaceChildren(...rows)
  }
  let timer = 0
  input.addEventListener('input', () => {
    clearTimeout(timer)
    timer = setTimeout(() => render(input.value), 130)
  })

  /* the little buttons under the box */
  const tryLabel = make('span', 'sr-only', fill(C.suggestLabel, base))
  tryEl.append(tryLabel)
  for (const word of C.suggest) {
    const b = make('button', 'srch__chip mono', word)
    b.type = 'button'
    b.addEventListener('click', () => {
      sfx.tick(0.7)
      buzz(8)
      input.value = word
      render(word)
      sheet.focus({ preventScroll: true }) // the phone's keyboard goes away, so the answer is not under it
    })
    tryEl.append(b)
  }

  /* ---------- going somewhere ---------- */
  const focusSoon = (el) => {
    if (!el) return
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
  function go(e) {
    sfx.unlock()
    sfx.tick(0.8)
    buzz(8)
    closeSheet(sheet, { restore: false })
    if (e.kind === 'extra') {
      colophon.open(btn)
    } else if (e.kind === 'object') {
      collection.show(e.id)
      const scene = $('#scene-collection')
      goto(scene)
      focusSoon($('#colRail'))
    } else {
      const scene = $('#' + e.id)
      goto(scene)
      focusSoon(scene)
    }
  }

  /* ---------- the sheet ---------- */
  input.placeholder = fill(C.placeholder, base)
  input.maxLength = MAX_Q
  const close = () => closeSheet(sheet)
  $('#archiveClose').addEventListener('click', close)
  trapSheet(sheet, close)
  // Enter / the keyboard's Search key: show the answer, put the keyboard away
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    clearTimeout(timer)
    render(input.value)
    sheet.focus({ preventScroll: true })
  })
  btn.addEventListener('click', () => {
    sfx.unlock()
    sfx.tick(0.6)
    buzz(8)
    input.value = ''
    render('')
    openSheet(sheet, input, btn)
  })
  render('')
  btn.disabled = false // it stays off until the scenes exist, so a tap in the intro cannot open a half-built page
}
