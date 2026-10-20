import { initName } from './name.js'
import { initQuiz } from './quiz.js'
import { initCollection } from './collection.js'
import { initCount } from './count.js'
import { initRsvp } from './rsvp.js'

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (s, r = document) => r.querySelector(s)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/*
  Everything that lives after the intro: the scenes, on native scroll-snap.
  Native scrolling is deliberate. It is the smoothest thing a phone can do, and it behaves
  inside the WhatsApp and Instagram browsers, where scroll-hijacking libraries do not.
*/
export function initScenes({ P, T, smoke, sparks, sfx, clock, extras = [] }) {
  const html = document.documentElement
  const u = smoke.u
  const scenes = [...document.querySelectorAll('.scene')]

  // the intro is over: from here the smoke only drifts, so a phone can draw it at half the rate
  smoke.capFps(smoke.coarse ? 30 : 0)
  const goto = (el) => el && el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })

  /* the bar gets a scrim once a scene slides under it */
  const syncScrolled = () => html.classList.toggle('is-scrolled', window.scrollY > 24)
  window.addEventListener('scroll', syncScrolled, { passive: true })
  syncScrolled()

  document.querySelectorAll('[data-to]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault()
      goto($(a.dataset.to))
    })
  )
  scenes.forEach((s, i) => {
    const b = $('.next', s)
    if (b) b.addEventListener('click', () => goto(scenes[i + 1]))
  })
  const ready = (id) => $('.next', $(id))?.classList.add('is-ready')

  /* ---- the scenes ---- */
  initName({ T, sparks, sfx })
  const quiz = initQuiz({ T, sfx, onDone: () => ready('#scene-quiz') })
  const collection = initCollection({ P, T, sfx })
  const count = initCount({ P, T, clock, sfx })
  const rsvp = initRsvp({ P, T, sparks, sfx })

  const enter = {
    'scene-quiz': () => quiz.enter(),
    'scene-collection': () => collection.enter(),
    'scene-count': () => {
      count.enter()
      setTimeout(() => ready('#scene-count'), 4500)
    },
    'scene-rsvp': () => rsvp.enter(),
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const need = Math.min(e.boundingClientRect.height * 0.5, window.innerHeight * 0.45)
        if (!e.isIntersecting || e.intersectionRect.height < need) continue
        enter[e.target.id]?.()
        delete enter[e.target.id]
        io.unobserve(e.target)
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  )
  scenes.forEach((s) => io.observe(s))

  /* ---- the light moves with you ---- */
  // one mood per scene, by id, so adding a scene never shifts the others
  const moods = {
    'scene-name': { top: 1, x: 0.5, y: 1.1, r: 0.95, lift: 0.2 }, // his name: light from above
    'scene-quiz': { top: 0.75, x: 0.22, y: 1.0, r: 0.85, lift: 0.15 }, // the quiz: dimmer, off to the side
    'scene-collection': { top: 0.9, x: 0.5, y: 1.05, r: 0.92, lift: 0.2 }, // the collection: a gallery light, straight on
    'scene-count': { top: 0.8, x: 0.8, y: 1.0, r: 0.9, lift: 0.18 }, // the countdown
    'scene-rsvp': { top: 1, x: 0.5, y: -0.1, r: 1.0, lift: 0.26 }, // the ticket: warm, from below
  }
  const fallbackMood = moods['scene-rsvp']
  let anchors = []
  const measure = () => {
    anchors = scenes.map((s) => ({ c: s.offsetTop + s.offsetHeight / 2, m: moods[s.id] || fallbackMood }))
  }
  const mood = (dt) => {
    if (!anchors.length) return
    const y = window.scrollY + window.innerHeight * 0.5
    const i = anchors.findIndex((a) => a.c > y)
    let a
    let b
    let t = 0
    if (i === -1) a = b = anchors[anchors.length - 1]
    else if (i === 0) a = b = anchors[0]
    else {
      a = anchors[i - 1]
      b = anchors[i]
      t = clamp((y - a.c) / (b.c - a.c), 0, 1)
    }
    const e = t * t * (3 - 2 * t)
    const mix = (p, q) => p + (q - p) * e
    const k = 1 - Math.exp(-dt * 2.6)
    u.top += (mix(a.m.top, b.m.top) - u.top) * k
    u.topX += (mix(a.m.x, b.m.x) - u.topX) * k
    u.topY += (mix(a.m.y, b.m.y) - u.topY) * k
    u.topR += (mix(a.m.r, b.m.r) - u.topR) * k
    u.lift += (mix(a.m.lift, b.m.lift) - u.lift) * k
  }
  measure()
  window.addEventListener('resize', measure)
  if (document.fonts) document.fonts.ready.then(measure)
  smoke.onFrame = mood

  // anything else that wants to start once the page is open (the cigarette, the disclaimer)
  extras.forEach((fn) => fn({ P, T, scenes }))
}
