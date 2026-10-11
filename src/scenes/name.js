import { gsap } from 'gsap'
import { copy } from '../copy.js'
import { fill } from '../lib/party.js'
import { buzz } from '../fx/haptics.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

/* ============================================================
   the hero: letters, and how they arrive (called by the intro)
   ============================================================ */
export function createHero(P) {
  const name = P.NAME
  const mid = Math.ceil(name.length / 2)
  const wrap = $('#heroName')
  wrap.textContent = ''
  const chars = []
  ;[name.slice(0, mid), name.slice(mid)].forEach((w) => {
    if (!w) return
    const ws = document.createElement('span')
    ws.className = 'w'
    for (const c of w) {
      const s = document.createElement('span')
      s.className = 'ch'
      s.textContent = c
      ws.appendChild(s)
      chars.push(s)
    }
    wrap.appendChild(ws)
  })

  // only show the age line if there is an age
  const age = $('#heroAge')
  age.hidden = P.age == null

  const order = chars.slice().sort(() => Math.random() - 0.5)
  const hb = $('#heroHb')
  const foot = $$('#heroFoot > *').filter((el) => !el.hidden)
  const hint = $('#heroTap')
  const next = $('#scene-name .next')

  return {
    chars,
    prepare() {
      gsap.set(hb, { opacity: 0, y: 18, filter: 'blur(12px)' })
      gsap.set(chars, { opacity: 0, yPercent: 26, scale: 1.1, filter: 'blur(28px)', color: '#d99a45' })
      gsap.set(foot, { opacity: 0, y: 14 })
      gsap.set(hint, { opacity: 0 })
    },
    reveal(tl, at, k = 1) {
      tl.to(hb, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3 * k, ease: 'power3.out', clearProps: 'filter' }, at)
        .to(order, { opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', color: '#ece3d3', duration: 1.7 * k, ease: 'power3.out', stagger: 0.11 * k, clearProps: 'filter,color,scale' }, at + 0.12 * k)
        .to(foot, { opacity: 1, y: 0, duration: 1 * k, ease: 'power3.out', stagger: 0.14 * k }, at + 1.5 * k)
        .add(() => next.classList.add('is-ready'), at + 2.6 * k)
    },
    final() {
      gsap.set(hb, { clearProps: 'all' })
      gsap.set(chars, { clearProps: 'all' })
      gsap.set(foot, { clearProps: 'all' })
      gsap.set(hint, { opacity: 0 }) // it fades in a few seconds later, only for people who haven't tapped
      next.classList.add('is-ready')
    },
  }
}

/* ============================================================
   tap his name: he coughs, the letters go to smoke, and drift back
   ============================================================ */
export function initName({ T, sparks, sfx }) {
  const chars = $$('#heroName .ch')
  const hit = $('#heroCough')
  const hint = $('#heroTap')
  const nameEl = $('#heroName')
  const lines = copy.hero.coughs.map((s) => fill(s, T))

  let busy = false
  let coughing = false
  let taps = 0
  let hintTimer = null

  // a nudge for anyone who has not found the button yet
  const showHint = () => {
    if (taps || !hint) return
    gsap.to(hint, { opacity: 1, duration: 0.8 })
  }
  hintTimer = gsap.delayedCall(3.2, showHint)

  const say = (text) => {
    gsap.timeline().to(hint, { opacity: 0, duration: 0.18 }).add(() => (hint.textContent = text)).to(hint, { opacity: 1, duration: 0.4 })
  }

  function cough() {
    if (busy) return
    busy = true
    coughing = true
    hintTimer?.kill()
    sfx.unlock()
    sfx.cough()
    buzz([16, 70, 16])

    const r = nameEl.getBoundingClientRect()
    sparks.puff(r.left + r.width * 0.62, r.top + r.height * 0.34, 10, { spread: 46 })
    setTimeout(() => sparks.puff(r.left + r.width * 0.4, r.top + r.height * 0.2, 7, { spread: 38 }), 190)

    if (lines.length) {
      say(lines[taps % lines.length])
    }
    taps++

    if (reduce) {
      gsap.fromTo(chars, { opacity: 0.2 }, { opacity: 1, duration: 0.6, onComplete: () => (busy = coughing = false) })
      return
    }

    // no overwrite:'auto' on these. on a mouse the letters also have quickTo tweens (below) on the same x, y and rotation;
    // auto-overwrite strips those properties out of them, and after the first cough they warn on every mouse move and stop working.
    // the pointer handlers sit still while coughing, and these tweens render after the quickTo ones, so they win without it.
    const rnd = gsap.utils.random
    gsap
      .timeline({ onComplete: () => (busy = coughing = false) })
      // two rough jolts, like a real cough
      .to(chars, { y: -9, duration: 0.07, yoyo: true, repeat: 3, ease: 'power1.inOut', stagger: { each: 0.014, from: 'random' } })
      // then the name comes apart like smoke
      .to(chars, {
        x: () => rnd(-80, 80),
        y: () => rnd(-170, -60),
        rotation: () => rnd(-26, 26),
        opacity: 0,
        scale: 1.14,
        filter: 'blur(9px)',
        duration: 0.7,
        ease: 'power2.out',
        stagger: { each: 0.03, from: 'random' },
      })
      // and drifts back
      .to(chars, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out', stagger: { each: 0.06, from: 'random' }, clearProps: 'filter,scale' }, '>0.12')
  }

  hit.addEventListener('click', cough)

  /* on a mouse, the letters also step out of your way, like smoke. touch has no hover, so it skips this. */
  if (fine && !reduce) {
    const q = chars.map((c) => ({
      c,
      x: gsap.quickTo(c, 'x', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(c, 'y', { duration: 0.9, ease: 'power3.out' }),
      r: gsap.quickTo(c, 'rotation', { duration: 1.1, ease: 'power3.out' }),
    }))
    const scene = $('#scene-name')
    let visible = true
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(scene)
    const reset = () => {
      if (coughing) return
      q.forEach((o) => (o.x(0), o.y(0), o.r(0)))
    }
    window.addEventListener('pointermove', (e) => {
      if (!visible || coughing) return
      for (const o of q) {
        const b = o.c.getBoundingClientRect()
        const cx = b.left + b.width / 2 - gsap.getProperty(o.c, 'x')
        const cy = b.top + b.height / 2 - gsap.getProperty(o.c, 'y')
        const dx = cx - e.clientX
        const dy = cy - e.clientY
        const d = Math.hypot(dx, dy) || 1
        const f = Math.exp(-d / 240)
        o.x((dx / d) * f * 48)
        o.y((dy / d) * f * 30)
        o.r((dx > 0 ? 1 : -1) * f * 4)
      }
    })
    scene.addEventListener('pointerleave', reset)

    /* and a faint trail of embers when you move fast */
    let lx = 0
    let ly = 0
    let lt = performance.now()
    window.addEventListener('pointermove', (e) => {
      const now = performance.now()
      const dt = Math.max(1, now - lt)
      const sp = Math.hypot(e.clientX - lx, e.clientY - ly) / dt
      lx = e.clientX
      ly = e.clientY
      lt = now
      if (sp > 1.3 && Math.random() < 0.35) sparks.ember(e.clientX + (Math.random() - 0.5) * 8, e.clientY + (Math.random() - 0.5) * 8, { rise: 14 + Math.random() * 26, life: 0.9 + Math.random() * 1.1, size: 1 + Math.random() * 1.4 })
    })
  }
}
