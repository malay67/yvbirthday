import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { copy } from '../copy.js'
import { fill, accession } from '../lib/party.js'
import { collected } from '../lib/collected.js'
import { buzz } from '../fx/haptics.js'
import { artSvg } from './collection-art.js'
import { ACT } from './collection-act.js'

gsap.registerPlugin(Flip)

const $ = (s, r = document) => r.querySelector(s)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pad2 = (n) => String(n).padStart(2, '0')
const make = (tag, cls, text) => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text != null) e.textContent = text
  return e
}
// how bright a #rrggbb colour is, 0 (black) to 1 (white)
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

/*
  Scene 3. The Yuvraj Collection: the museum after hours.
  One object per card, on a sideways scroll-snap rail. Native scrolling, like the rest of the page, so a sideways
  swipe stays on the card and a vertical one still moves to the next scene (the rail only scrolls on x).
    Collect   punches a hole in the card (a mask), stamps it COLLECTED, and remembers it
    colours   filter the cards with GSAP Flip, and tint the room for a moment
    Shuffle   jumps to a random card
    the drawing on each card is a button: a tap moves the card to its next state (a new line, a little animation)
    the last card is the missing cake (only if copy.cakeGuy is set): card 09 of 08, nothing to collect, nothing to shuffle to
*/
export function initCollection({ P, T, sfx, sparks }) {
  const C = copy.collection
  const cakeCard = T.cakeGuy ? copy.cake.card : null
  const rail = $('#colRail')
  const countEl = $('#colCount')
  const titleEl = $('#colTitle')
  const resetBtn = $('#colReset')
  const resetName = $('#colResetName')
  const prevBtn = $('#colPrev')
  const nextBtn = $('#colNext')
  const collectBtn = $('#colCollect')
  const collectV = $('#colCollectV')
  const collectN = $('#colCollectN')
  const shuffleBtn = $('#colShuffle')
  const chipsEl = $('#colChips')
  const statusEl = $('#colStatus')
  const tintEl = $('#tint')
  const scene = $('#scene-collection')

  const sw = Object.fromEntries(C.swatches.map((s) => [s.id, s]))

  /* ---------- the cards ---------- */
  // `o` is an object from copy.collection.objects, or the missing cake card (o.missing)
  function buildSlide(o, i) {
    const t = { ...T, accession: accession(P, i + 1) }
    const say = (s) => fill(s, t)
    const colours = (o.colours || []).filter((id) => sw[id])
    const missing = !!o.missing

    const root = make('article', missing ? 'obj obj--missing' : 'obj')
    root.dataset.id = o.id
    root.setAttribute('role', 'group')
    root.setAttribute('aria-roledescription', 'slide')
    root.setAttribute('aria-label', say(o.title))

    const wrap = make('div', 'obj__wrap')
    const paper = make('div', 'obj__paper')

    const top = make('div', 'obj__top mono')
    top.append(make('span', 'obj__acc', say(C.acc)))

    /* the lines that change when the drawing is tapped. every version of a line is in the page, on top of the others, and only
       one shows, so a line is always as tall as its tallest version and the card never changes size. */
    const states = (o.tap && o.tap.states) || []
    const nStates = states.length
    const at = (k) => (k > 0 ? states[k - 1] : null)
    const subAt = (k) => (at(k) && at(k).sub != null ? at(k).sub : o.sub || '')
    const noteAt = (k) => (at(k) && at(k).note != null ? at(k).note : o.note || '')
    const rowAt = (r, k) => (at(k) && at(k).rows && at(k).rows[r] != null ? at(k).rows[r] : o.rows[r][1])
    const groups = [] // each: { els: [one per state], texts: [one per state] }
    const versions = (get) => Array.from({ length: nStates + 1 }, (_, k) => say(get(k)))
    const same = (texts) => texts.every((x) => x === texts[0])
    // fills the line `el` from its texts; with only one version it is plain. `parts(text)` makes what goes inside,
    // `tag` is what each version is wrapped in (a span inside a paragraph, a div inside a row)
    const fillLine = (el, texts, parts, tag = 'div') => {
      if (same(texts)) {
        el.append(...parts(texts[0]))
        return
      }
      el.classList.add('obj__vary')
      const els = texts.map((tx, k) => {
        const v = make(tag, k === 0 ? 'v is-on' : 'v')
        v.append(...parts(tx))
        el.append(v)
        return v
      })
      groups.push({ els, texts })
    }
    const textPart = (tx) => [document.createTextNode(tx)]

    const head = make('div', 'obj__head')
    const titles = make('div', 'obj__titles')
    // a long title ("Ashtray (Diet Coke bottle)") is set a little smaller on a big screen, so it takes three short lines and not four
    titles.append(make('h3', say(o.title).length > 20 ? 'obj__title obj__title--long' : 'obj__title', say(o.title)))
    if (o.sub) {
      const sub = make('p', 'obj__sub')
      fillLine(sub, versions(subAt), textPart, 'span')
      titles.append(sub)
    }
    const plate = make('div', 'obj__plate')
    let svg = null
    if (o.tap) {
      // the drawing is a button. a tap moves the card to its next state
      const btn = make('button', 'obj__tap')
      btn.type = 'button'
      btn.setAttribute('aria-label', say(o.tap.label))
      btn.innerHTML = artSvg(o.art)
      svg = btn.firstElementChild
      plate.append(btn)
      btn.addEventListener('click', () => tapArt(slide))
    } else {
      plate.innerHTML = artSvg(o.art)
      svg = plate.firstElementChild
    }
    const hues = make('ul', 'obj__hues')
    const huesLi = {}
    for (const id of colours) {
      const li = make('li')
      li.style.setProperty('--c', sw[id].hex)
      li.append(make('span', 'sr-only', `${sw[id].name} ${sw[id].hex}`))
      hues.append(li)
      huesLi[id] = li
    }
    plate.append(hues)
    // (the caption goes under the words, not under the frame: the frame is small and the card must not get taller)
    if (o.caption) titles.append(make('p', 'obj__cap mono', say(o.caption)))
    // the red COLLECTED stamp sits in the head, bottom left, where there is usually empty paper
    const stamp = make('span', 'obj__stamp', say(C.stamp))
    stamp.setAttribute('aria-hidden', 'true')
    head.append(titles, plate, stamp)
    // a little hint on the first card, shown once (see the end of this file)
    let hint = null
    if (i === 0 && !missing && o.tap && C.tapHint) {
      hint = make('span', 'obj__hint mono', say(C.tapHint))
      hint.setAttribute('aria-hidden', 'true')
      head.append(hint)
    }

    const body = make('div', 'obj__body')
    const dl = make('dl', 'obj__meta')
    ;(o.rows || []).forEach(([k], r) => {
      const row = make('div')
      fillLine(row, versions((s) => rowAt(r, s)), (tx) => [make('dt', null, say(k)), make('dd', null, tx)])
      dl.append(row)
    })
    const note = make('p', 'obj__note')
    fillLine(note, versions(noteAt), textPart, 'span')
    body.append(dl, note)

    const chad = make('span', 'obj__chad')
    chad.setAttribute('aria-hidden', 'true')

    paper.append(top, head, body)
    wrap.append(paper, chad)
    root.append(wrap)
    const slide = {
      id: o.id,
      title: say(o.title),
      colours,
      huesLi,
      el: root,
      paper,
      stamp,
      chad,
      missing,
      art: o.art,
      svg,
      hint,
      nStates,
      k: 0, // which state the card is in: 0 is as printed
      tl: null,
      // the line to read out for a state: the first line that changes
      sayFor: (k) => {
        const g = groups.find((x) => x.texts[k] !== x.texts[0]) || groups[0]
        return g ? g.texts[k] : ''
      },
      show: (k) => groups.forEach((g) => g.els.forEach((e, j) => e.classList.toggle('is-on', j === k))),
    }
    if (svg && ACT[o.art]) ACT[o.art].rest(svg, 0)
    return slide
  }

  const real = C.objects.map(buildSlide)
  // the missing cake: the last card. card 09 of 08. it has no colours, so any colour hides it
  const lost = cakeCard ? buildSlide({ ...cakeCard, missing: true, colours: [], art: `missing` }, C.objects.length) : null
  const slides = lost ? [...real, lost] : real
  rail.append(...slides.map((s) => s.el))
  rail.setAttribute('aria-label', fill(C.title, T))

  // the tally on the Collect button: a punch card with one hole for each object (the same order as the cards). not the cake
  const holes = real.map(() => collectN.appendChild(make('i')))

  const visible = () => slides.filter((s) => !s.el.hidden)
  // scroll-snap is switched off while something moves the rail by itself. more than one thing can ask, so count them.
  let freezes = 0
  const freeze = (on) => {
    freezes = Math.max(0, freezes + (on ? 1 : -1))
    rail.classList.toggle('is-free', freezes > 0)
  }
  let cur = 0
  let filter = null
  let driving = 0 // until this moment a scroll we started ourselves is under way: do not read the counter from it
  let raf = 0

  /* ---------- the colour squares ---------- */
  chipsEl.setAttribute('aria-label', fill(C.colourLabel, T))
  const label = make('span', 'col__chipsLabel', fill(C.byColour, T))
  label.setAttribute('aria-hidden', 'true')
  chipsEl.append(label)
  const chips = C.swatches.map((s) => {
    const b = make('button', 'chip')
    b.type = 'button'
    b.dataset.c = s.id
    b.setAttribute('aria-pressed', 'false')
    b.setAttribute('aria-label', `${s.name} ${s.hex}`)
    const i = make('i')
    i.style.setProperty('--c', s.hex)
    b.append(i)
    b.addEventListener('click', () => pickColour(s.id))
    chipsEl.append(b)
    return b
  })

  /* ---------- what is showing ---------- */
  function paintHead() {
    const vis = visible()
    // the missing cake is not one of the things in the count: on its card the counter reads 09 / 08, on purpose
    const counted = vis.filter((x) => !x.missing).length
    countEl.textContent = `${pad2(Math.min(cur + 1, vis.length))} / ${pad2(counted)}`
    prevBtn.setAttribute('aria-disabled', String(cur <= 0))
    nextBtn.setAttribute('aria-disabled', String(cur >= vis.length - 1))
    const s = vis[cur]
    if (s) {
      statusEl.textContent = fill(C.slide, { title: s.title, n: cur + 1, total: vis.length })
      paintCollect()
    }
  }

  function paintCollect() {
    const s = visible()[cur]
    const lostCard = !!s && s.missing
    // on the missing cake the big button is Report a sighting, and there is no tally to show
    collectBtn.classList.toggle('is-report', lostCard)
    collectN.hidden = lostCard
    if (lostCard) {
      clearTimeout(reportTimer)
      collectV.textContent = fill(copy.cake.card.report, T)
      collectBtn.removeAttribute('aria-pressed')
    } else {
      const on = !!s && collected.has(s.id)
      collectV.textContent = fill(on ? C.uncollect : C.collect, T)
      collectBtn.setAttribute('aria-pressed', String(on))
    }
    holes.forEach((h, i) => h.classList.toggle('is-on', collected.has(real[i].id)))
    collectN.setAttribute('aria-label', fill(C.tally, { n: collected.count(), total: collected.total() }))
  }

  function paintFilter() {
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === filter)))
    chipsEl.classList.toggle('is-on', !!filter)
    titleEl.hidden = !!filter
    resetBtn.hidden = !filter
    if (filter) resetName.textContent = fill(C.colourPicked, { colour: sw[filter].name, hex: sw[filter].hex })
    slides.forEach((s) => Object.entries(s.huesLi).forEach(([id, li]) => li.classList.toggle('is-hit', id === filter)))
  }

  const indexNow = () => {
    const w = rail.clientWidth || 1
    return Math.max(0, Math.min(visible().length - 1, Math.round(rail.scrollLeft / w)))
  }

  function setCur(i) {
    if (i === cur) return
    cur = i
    paintHead()
  }

  // a card change from a finger swipe: a quiet tick
  function onScroll() {
    raf = 0
    if (performance.now() < driving) return
    const i = indexNow()
    if (i !== cur) {
      setCur(i)
      sfx.tick(0.45)
    }
  }
  rail.addEventListener(
    'scroll',
    () => {
      if (!raf) raf = requestAnimationFrame(onScroll)
    },
    { passive: true }
  )

  function goTo(i, { smooth = true } = {}) {
    const n = visible().length
    i = Math.max(0, Math.min(n - 1, i))
    const instant = !smooth || reduce
    driving = performance.now() + (instant ? 0 : 750)
    rail.scrollTo({ left: i * rail.clientWidth, behavior: instant ? 'auto' : 'smooth' })
    setCur(i)
    if (!instant) setTimeout(() => performance.now() >= driving && onScroll(), 800)
    ready()
  }

  const step = (d) => {
    const n = visible().length
    const to = cur + d
    if (to < 0 || to >= n) return
    sfx.unlock()
    sfx.tick(0.6)
    goTo(to)
  }
  prevBtn.addEventListener('click', () => step(-1))
  nextBtn.addEventListener('click', () => step(1))

  // arrow keys, when this scene is the one on screen
  let inView = false
  new IntersectionObserver(([e]) => (inView = e.isIntersecting && e.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] }).observe(scene)
  window.addEventListener('keydown', (e) => {
    if (!inView || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const t = e.target
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    }
  })

  // sound needs a tap on the page first, and a swipe is a tap too
  const wake = () => sfx.unlock()
  rail.addEventListener('touchend', wake, { passive: true })
  rail.addEventListener('pointerup', wake, { passive: true })

  // a turned phone, or a resized window, changes the width of a card: stay on the same one
  window.addEventListener('resize', () => rail.scrollTo({ left: cur * rail.clientWidth, behavior: 'auto' }))

  /* ---------- Collect: punch a hole ---------- */
  function showPunched(s, animate) {
    s.el.classList.add('is-collected')
    gsap.killTweensOf([s.paper, s.stamp, s.chad])
    if (!animate || reduce) {
      gsap.set([s.paper, s.stamp, s.chad], { clearProps: 'all' })
      return
    }
    gsap
      .timeline({ onComplete: () => gsap.set([s.paper, s.stamp, s.chad], { clearProps: 'all' }) })
      .fromTo(s.paper, { '--hole': '0px' }, { '--hole': '8px', duration: 0.16, ease: 'power2.out' }, 0)
      .fromTo(s.paper, { scaleY: 1, y: 0 }, { scaleY: 0.982, y: 1.5, duration: 0.07, ease: 'power2.in', yoyo: true, repeat: 1 }, 0)
      .fromTo(s.stamp, { opacity: 0, scale: 1.8, rotation: -14 }, { opacity: 0.92, scale: 1, rotation: -6, duration: 0.22, ease: 'power4.in' }, 0.08)
      .fromTo(s.chad, { opacity: 1, x: 0, y: 0, rotation: 0 }, { opacity: 0, x: 16, y: 120, rotation: 160, duration: 0.9, ease: 'power2.in' }, 0.06)
  }

  function showRestored(s, animate) {
    gsap.killTweensOf([s.paper, s.stamp, s.chad])
    const done = () => {
      s.el.classList.remove('is-collected')
      gsap.set([s.paper, s.stamp, s.chad], { clearProps: 'all' })
    }
    if (!animate || reduce) return done()
    gsap
      .timeline({ onComplete: done })
      .to(s.stamp, { opacity: 0, scale: 0.9, duration: 0.18 }, 0)
      .to(s.paper, { '--hole': '0px', duration: 0.18, ease: 'power2.in' }, 0)
  }

  collectBtn.addEventListener('click', () => {
    const s = visible()[cur]
    if (!s) return
    if (s.missing) return report()
    sfx.unlock()
    const on = collected.toggle(s.id)
    if (on) {
      // a click, and the little thud of the punch
      sfx.tick(1)
      setTimeout(() => sfx.pop(), 40)
      buzz([16, 24, 10])
      showPunched(s, true)
    } else {
      sfx.pop()
      buzz(8)
      showRestored(s, true)
    }
    paintCollect()
    // the hole that was just punched pops a little
    if (on && !reduce) gsap.fromTo(holes[real.indexOf(s)], { scale: 1.9 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', clearProps: 'transform' })
    ready()
  })

  /* ---------- Report a sighting (the missing cake) ---------- */
  // the big button on the cake's card. it files the report, and the answer is the same every time
  let reportTimer = 0
  function report() {
    sfx.unlock()
    sfx.tick(0.8)
    buzz([10, 40, 10])
    const line = fill(copy.cake.card.sightings, T)
    collectV.textContent = line
    statusEl.textContent = line
    if (!reduce) gsap.fromTo(collectBtn, { x: 0 }, { x: 4, duration: 0.05, yoyo: true, repeat: 5, ease: 'none', clearProps: 'x' })
    clearTimeout(reportTimer)
    reportTimer = setTimeout(paintCollect, 2600)
    ready()
  }

  // anything that changes the collection (this scene is the only one that does, but the ticket listens too)
  collected.subscribe(paintCollect)

  /* ---------- colours: filter the cards, tint the room ---------- */
  function tint(s) {
    if (!tintEl) return
    const dark = lum(s.hex) < 0.12
    const k = reduce ? 0.6 : 1
    tintEl.style.background = s.hex
    gsap.killTweensOf(tintEl)
    gsap
      .timeline()
      .fromTo(tintEl, { opacity: 0 }, { opacity: (dark ? 0.72 : 0.34) * k, duration: 0.28, ease: 'power2.out' })
      .to(tintEl, { opacity: 0, duration: reduce ? 0.5 : 1.1, ease: 'power2.inOut' }, '+=0.35')
  }

  function applyFilter(next, { instant = false } = {}) {
    const before = visible()[cur]
    const keep = (s) => !next || s.colours.includes(next)
    // stay on this card if it survives, otherwise go to the first one that does
    const target = before && keep(before) ? before : slides.find(keep)
    if (!target) return

    const animate = !reduce && !instant
    const state = animate ? Flip.getState(slides.map((s) => s.el)) : null
    slides.forEach((s) => (s.el.hidden = !keep(s)))
    filter = next
    const idx = visible().indexOf(target)

    driving = performance.now() + 900
    rail.scrollLeft = idx * rail.clientWidth
    cur = -1 // force a repaint
    setCur(idx)
    paintFilter()

    if (!animate) return
    freeze(true) // snap is off while the cards slide, or the browser fights the animation
    Flip.from(state, {
      duration: 0.65,
      ease: 'power3.inOut',
      absoluteOnLeave: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.45, clearProps: 'opacity' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.35, ease: 'power2.in' }),
      onComplete: () => {
        freeze(false)
        gsap.set(slides.map((s) => s.el), { clearProps: 'opacity,scale,transform' })
      },
    })
  }

  function pickColour(id) {
    const next = filter === id ? null : id
    sfx.unlock()
    sfx.tick(0.8)
    buzz(8)
    if (next) tint(sw[next])
    applyFilter(next)
    ready()
  }

  resetBtn.addEventListener('click', () => {
    sfx.unlock()
    sfx.tick(0.8)
    buzz(8)
    applyFilter(null)
  })

  /* ---------- the search sends you to a card ---------- */
  // by id. if a colour is hiding that card, the colour comes off first (no animation). it glides there if the guest is already
  // looking at this scene, otherwise it is already in place by the time the scene scrolls into view.
  function show(id) {
    const s = slides.find((x) => x.id === id)
    if (!s) return
    touched = true // he asked for a card: he knows they move, so the little peek hint is not needed
    if (s.el.hidden) applyFilter(null, { instant: true })
    goTo(visible().indexOf(s), { smooth: inView })
  }

  /* ---------- the drawings are buttons ---------- */
  // each tap moves the card to its next state: a new line (or two), a little animation, a sound. after the last state it
  // goes back to the card as printed. a swipe that starts on a drawing is a swipe: the browser never sends a click for it.
  const HINT_KEY = 'yuv-tapped'
  const hintDone = () => {
    try {
      return !!localStorage.getItem(HINT_KEY)
    } catch {
      return false
    }
  }
  let hintTimer = 0
  let tappedArt = false
  function hideHint() {
    clearTimeout(hintTimer)
    real[0].el.classList.remove('is-hinting')
  }
  // "tap the object", once, on the first card. it goes at the first tap on any drawing, or after a few seconds
  function showHint() {
    if (tappedArt || cur !== 0 || !real[0].hint || hintDone()) return
    if (document.documentElement.classList.contains('is-sheet')) return
    // it sits in the empty paper under his name. on a very small phone his name takes that space: then there is no hint
    const h = real[0].hint.getBoundingClientRect()
    if (!h.width) return // not drawn at all at this size
    const crowded = [...real[0].el.querySelectorAll('.obj__title, .obj__sub, .obj__plate')].some((e) => {
      const r = e.getBoundingClientRect()
      return h.left < r.right && h.right > r.left && h.top < r.bottom && h.bottom > r.top
    })
    if (crowded) return
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {}
    real[0].el.classList.add('is-hinting')
    hintTimer = setTimeout(hideHint, 7000)
  }

  function tapArt(s) {
    sfx.unlock()
    touched = true
    tappedArt = true
    hideHint()
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {}
    const act = ACT[s.art]
    const from = s.k
    const to = s.nStates ? (s.k + 1) % (s.nStates + 1) : 0
    // a quick second tap: finish the first animation where it is going, then go on from there
    if (s.tl) {
      s.tl.kill()
      s.tl = null
      if (act) act.rest(s.svg, from)
    }
    s.k = to
    s.show(to)
    const line = s.sayFor(to)
    if (line) statusEl.textContent = line
    if (reduce) {
      if (act) act.rest(s.svg, to)
      sfx.tick(0.8)
      buzz(8)
    } else if (act) {
      s.tl = act.play(s.svg, to, from, { sfx, sparks, buzz })
    }
    ready()
  }

  /* ---------- Shuffle ---------- */
  // (never to the missing cake: it is not one of the things)
  shuffleBtn.addEventListener('click', () => {
    const vis = visible()
    const pool = vis.filter((x) => !x.missing)
    if (pool.length < 2) return
    sfx.unlock()
    let j
    do j = vis.indexOf(pool[Math.floor(Math.random() * pool.length)])
    while (j === cur)
    // a riffle of clicks
    ;[0, 70, 140].forEach((d, k) => setTimeout(() => sfx.tick(0.9 - k * 0.25), d))
    buzz([8, 30, 8])
    if (!reduce) gsap.fromTo($('svg', shuffleBtn), { rotation: 0 }, { rotation: 180, duration: 0.5, ease: 'back.out(2)' })
    goTo(j)
  })

  /* ---------- a hint that the cards move ---------- */
  // the first time the scene is seen, the rail slides a little sideways and back, so the second card peeks in.
  // any touch, key or wheel in the scene cancels it.
  let touched = false
  const touch = () => (touched = true)
  scene.addEventListener('pointerdown', touch, { passive: true, capture: true })
  scene.addEventListener('touchstart', touch, { passive: true, capture: true })
  scene.addEventListener('wheel', touch, { passive: true, capture: true })
  scene.addEventListener('keydown', touch, { capture: true })
  function nudge() {
    if (reduce || touched || cur !== 0 || visible().length < 2) return
    // a sheet (the search, the credits) is open on top of the cards: nobody is looking, so leave them alone
    if (document.documentElement.classList.contains('is-sheet')) return
    freeze(true) // snapping is off while it moves
    rail.scrollTo({ left: 36, behavior: 'smooth' })
    setTimeout(() => {
      // bring it back only if nothing else has moved it meanwhile (a finger, the arrows, or the search sending him to a card)
      if (!touched && cur === 0) rail.scrollTo({ left: 0, behavior: 'smooth' })
      setTimeout(() => freeze(false), 600)
    }, 700)
  }

  /* ---------- the arrow to the next scene ---------- */
  let readied = false
  function ready() {
    if (readied) return
    readied = true
    $('.next', scene)?.classList.add('is-ready')
  }

  /* ---------- go ---------- */
  slides.forEach((s) => collected.has(s.id) && showPunched(s, false))
  paintFilter()
  cur = -1
  setCur(0)

  return {
    show,
    // called the first time the scene is on screen
    enter() {
      setTimeout(showHint, reduce ? 1500 : 3900)
      if (reduce) return
      const first = slides[0]
      gsap.from(first.paper, { y: 70, rotation: 2.5, opacity: 0, duration: 1.2, ease: 'power4.out', clearProps: 'transform,opacity' })
      gsap.from([$('.col__head', scene), $('.col__ctrl', scene), chipsEl], { opacity: 0, y: 20, duration: 0.8, stagger: 0.1, delay: 0.3, ease: 'power3.out', clearProps: 'transform,opacity' })
      setTimeout(nudge, 2300)
      setTimeout(ready, 4500)
    },
  }
}
