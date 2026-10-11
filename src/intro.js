import { gsap } from 'gsap'
import { createWheel } from './ui/wheel.js'
import { copy } from './copy.js'
import { fill } from './lib/party.js'
import { buzz } from './fx/haptics.js'
import { setDisclaimer } from './ui/disclaimer.js'

/*
  The opening, in four beats.
    gate    a dark room and a flint wheel. spin it.
    flame   sparks, then the flame catches and lifts off the wheel.
    wish    "make a wish." click and you blow it out.
    reveal  the plume rises, the light comes on, the name steps out of the smoke.
  Skip jumps straight to reveal.
*/
export function createIntro({ smoke, sparks, sfx, hero, T, onDone }) {
  const $ = (s) => document.querySelector(s)
  const html = document.documentElement
  const u = smoke.u

  const gate = $('#gate')
  const grip = $('#wheelGrip')
  const main = $('#main')
  const gateDark = $('#gateDark')
  const gateHint = $('#gateHint')
  const wish = $('#wish')
  const wishLine = $('#wishLine')
  const wishHint = $('#wishHint')
  const rig = $('#wheelRig')
  const wheel = $('#wheel')
  const skipBtn = $('#skip')

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const say = (s) => fill(s, T)
  const HINT_SPIN = say(coarse ? copy.intro.swipe : copy.intro.spin)

  // while the gate is up nothing on it may scroll, pull to refresh, or drag the page.
  // touch-action and overscroll-behavior in the CSS do most of it; this is the belt to those braces
  // (iPhone Safari honours touch-action only from iOS 13).
  const holdStill = (e) => {
    if (e.cancelable) e.preventDefault()
  }
  const lockTouch = () => gate.addEventListener('touchmove', holdStill, { passive: false })
  const unlockTouch = () => gate.removeEventListener('touchmove', holdStill)

  let phase = 'idle'
  let wheelApi = null
  let nudgeCall = null
  let nudgeTween = null
  let idleBlow = null
  let disarm = null
  let fizzling = false // the first breath fails; while it does, the flame ignores the pointer
  const live = new Set()
  const track = (t) => {
    live.add(t)
    return t
  }

  /* ---------- gate ---------- */
  function start() {
    phase = 'gate'
    html.classList.add('is-locked')
    Object.assign(u, { density: 1, lift: 0.14, flame: 0, plume: 0, top: 0, flash: 0, lean: 0, hush: 0, pointerGlow: coarse ? 0 : 0.3 })
    gateHint.textContent = HINT_SPIN
    wishHint.textContent = say(coarse ? copy.intro.blowTap : copy.intro.blowClick)

    gsap.set([gateDark, gateHint], { opacity: 0, y: 14 })
    gsap.set(rig, { opacity: 0, y: 60 })
    gsap.set(skipBtn, { opacity: 0 })
    hero.prepare()
    lockTouch()

    wheelApi = createWheel({ wheel, grip, rig, sparks, sfx, onIgnite: ignite, onWeak: weak, onVibrate: () => buzz(30) })

    const stopNudge = () => {
      if (nudgeCall) nudgeCall.kill()
      if (nudgeTween) nudgeTween.kill()
    }
    grip.addEventListener('pointerdown', stopNudge, { capture: true })
    wheel.addEventListener('keydown', stopNudge, { capture: true })

    track(gsap.timeline({ delay: 0.25 }))
      .to(rig, { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out' }, 0)
      .to(gateDark, { opacity: 0.86, y: 0, duration: 1.3, ease: 'power3.out' }, 0.5)
      .to(gateHint, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.2)
      .to(skipBtn, { opacity: 1, duration: 0.8 }, 1.9)

    nudgeCall = gsap.delayedCall(4.4, nudge)
  }

  // a little demo of what the wheel wants, repeated until you touch it
  function nudge() {
    if (phase !== 'gate') return
    const c = wheelApi.contact()
    nudgeTween = gsap.to(wheel, { rotation: '+=26', duration: 0.42, ease: 'power2.inOut', yoyo: true, repeat: 1 })
    sparks.flint(c.x, c.y, 1, 0.3)
    nudgeCall = gsap.delayedCall(4.6, nudge)
  }

  function weak(n) {
    if (phase !== 'gate') return
    gateHint.textContent = say(n >= 2 ? copy.intro.harderStill : copy.intro.harder)
    gsap.fromTo(gateHint, { opacity: 0.15 }, { opacity: 1, duration: 0.5 })
    gsap.delayedCall(2.4, () => {
      if (phase === 'gate') gateHint.textContent = HINT_SPIN
    })
  }

  /* ---------- flame ---------- */
  function ignite(pt) {
    if (phase !== 'gate') return
    phase = 'flame'
    gate.classList.add('is-lit') // the wheel stops listening; from here on a tap means "blow"
    if (nudgeCall) nudgeCall.kill()
    if (nudgeTween) nudgeTween.kill()
    sfx.unlock()
    sfx.ignite()
    setDisclaimer(say(copy.disclaimer.lit)) // like the line before a film

    const W = window.innerWidth
    const H = window.innerHeight
    u.flameX = pt.x / W
    u.flameY = 1 - (pt.y + 8) / H
    u.flameSize = 0.03
    u.lean = 0
    u.hush = 0

    sparks.burst(pt.x, pt.y, 34, { angle: -Math.PI / 2, spread: Math.PI * 0.95, speed: 540 })

    track(gsap.timeline())
      .to(u, { flame: 1, duration: 0.1, ease: 'power2.out' }, 0)
      .to(u, { flameSize: 0.17, duration: 0.65, ease: 'back.out(2)' }, 0)
      .fromTo(u, { flash: 0.9 }, { flash: 0, duration: 0.8, ease: 'power2.out' }, 0)
      .to(u, { lift: 0.24, duration: 1.8, ease: 'power2.out' }, 0)
      .to(rig, { '--lit': 1, duration: 0.7, ease: 'power2.out' }, 0)
      .to([gateDark, gateHint], { opacity: 0, y: -10, duration: 0.5, ease: 'power2.in' }, 0)
      .add(rise, 1.25)
  }

  function rise() {
    if (phase !== 'flame') return
    phase = 'wish'
    const d = rig.offsetWidth

    track(gsap.timeline())
      .to(u, { flameX: 0.5, flameY: 0.37, flameSize: 0.26, duration: 1.6, ease: 'power3.inOut' }, 0)
      .to(rig, { y: d * 0.3, opacity: 0, duration: 1.3, ease: 'power3.in' }, 0)
      .to(u, { lift: 0.3, density: 1.15, duration: 1.6, ease: 'power2.out' }, 0)
      .set(wish, { visibility: 'visible' }, 0.9)
      .fromTo(wishLine, { opacity: 0, y: 18, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'power3.out' }, 0.9)
      .fromTo(wishHint, { opacity: 0 }, { opacity: 1, duration: 0.9 }, 2)
      .add(arm, 1.7)

    // while the wish is open the flame leans toward wherever you are
    smoke.onFrame = (dt) => {
      if (phase !== 'wish' || fizzling) return
      const target = (smoke.pointer.x - 0.5) * 0.8
      u.lean += (target - u.lean) * (1 - Math.exp(-dt * 3))
    }
  }

  /* ---------- wish ---------- */
  // it is a trick candle: the first breath never puts it out. "Harder." The second one does.
  function arm() {
    if (phase !== 'wish') return
    let tricked = false
    let cooling = false // a double tap on the first try should not skip the joke

    const giveUp = () => {
      off()
      blow(null)
    }
    const attempt = (clientX) => {
      if (cooling) return
      if (!tricked) {
        tricked = true
        cooling = true
        setTimeout(() => (cooling = false), 650)
        fizzle(clientX)
        // a fresh nine seconds, so the flame cannot give up in the middle of the joke
        if (idleBlow) idleBlow.kill()
        idleBlow = gsap.delayedCall(9, giveUp)
        return
      }
      off()
      blow(clientX)
    }
    const onDown = (e) => {
      if (e.target.closest && e.target.closest('.bar, .skip')) return
      attempt(e.clientX)
    }
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        attempt(null)
      }
    }
    const off = () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      if (idleBlow) idleBlow.kill()
      disarm = null
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    disarm = off
    // nobody should get stuck here. if you do nothing, the flame gives up on its own
    idleBlow = gsap.delayedCall(9, giveUp)
  }

  // the first breath: the flame ducks, nearly goes, and comes straight back
  function fizzle(clientX) {
    fizzling = true
    sfx.unlock()
    sfx.blow(true)
    buzz(18)
    const side = clientX == null ? (Math.random() < 0.5 ? -1 : 1) : clientX < window.innerWidth / 2 ? 1 : -1

    wishHint.textContent = say(copy.intro.blowAgain)
    gsap.fromTo(wishHint, { opacity: 0.1, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })

    track(gsap.timeline({ onComplete: () => (fizzling = false) }))
      .to(u, { lean: side * 1.6, flame: 0.3, flameSize: 0.16, duration: 0.28, ease: 'power2.in' }, 0)
      .to(u, { lean: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }, 0.3)
      .to(u, { flame: 1, duration: 0.45, ease: 'power3.out' }, 0.3)
      .to(u, { flameSize: 0.26, duration: 0.7, ease: 'back.out(2.2)' }, 0.3)

    // a few embers for the effort
    const fx = u.flameX * window.innerWidth
    const fy = (1 - u.flameY) * window.innerHeight
    for (let i = 0; i < 4; i++) sparks.ember(fx + (Math.random() - 0.5) * 30, fy - Math.random() * 40, { rise: 40 + Math.random() * 50, life: 1.4 + Math.random() * 1.4 })
  }

  function blow(clientX) {
    if (phase !== 'wish') return
    phase = 'out'
    smoke.onFrame = null
    sfx.unlock()
    sfx.blow()

    // the flame bends away from whichever side the breath came from
    const side = clientX == null ? (Math.random() < 0.5 ? -1 : 1) : clientX < window.innerWidth / 2 ? 1 : -1

    track(gsap.timeline())
      .to(u, { lean: side * 1.9, flameSize: 0.2, duration: 0.42, ease: 'power2.in' }, 0)
      .to(u, { flame: 0, duration: 0.3, ease: 'power3.in' }, 0.3)
      .to(wish, { opacity: 0, duration: 0.5, ease: 'power1.in' }, 0)
      .to(skipBtn, { opacity: 0, duration: 0.4 }, 0)
      .add(() => {
        u.plumeX = u.flameX
        u.plumeY = u.flameY
        u.plumeAge = 0
        const r = window.innerHeight
        for (let i = 0; i < 7; i++) sparks.ember(u.flameX * window.innerWidth + (Math.random() - 0.5) * 26, (1 - u.flameY) * r - Math.random() * 30, { rise: 40 + Math.random() * 60, life: 2 + Math.random() * 2 })
      }, 0.5)
      .to(u, { plume: 1, duration: 0.5, ease: 'power1.out' }, 0.5)
      .to(u, { plumeAge: 6, duration: 6, ease: 'none' }, 0.5)
      .to(u, { lift: 0.06, duration: 1.4, ease: 'power2.inOut' }, 0.4)
      .add(() => reveal(false), 1.45)
  }

  /* ---------- reveal ---------- */
  function reveal(fast) {
    if (phase === 'reveal' || phase === 'done') return
    phase = 'reveal'
    unlockTouch()
    html.classList.remove('is-locked')
    html.classList.add('is-frozen')
    main.removeAttribute('inert')
    if (wheelApi) wheelApi.destroy()
    wish.style.visibility = 'hidden'
    sparks.ambient = 3.5

    const k = fast ? 0.45 : 1
    const tl = track(gsap.timeline({ onComplete: finish }))
    tl.to(u, { top: 1, duration: 2.8 * k, ease: 'power2.out' }, 0)
      .to(u, { lift: 0.2, density: 1, pointerGlow: coarse ? 0 : 0.32, duration: 2 * k }, 0)
      .fromTo(u, { flash: 0 }, { flash: 0.22, duration: 0.25 * k, yoyo: true, repeat: 1, ease: 'power2.out' }, 0.5 * k)
      .to(u, { plume: 0, duration: 3 * k, ease: 'power1.inOut' }, 1.2 * k)
    hero.reveal(tl, 0.35 * k, k)
    tl.add(() => html.classList.add('is-live'), 1.4 * k)
  }

  function finish() {
    phase = 'done'
    html.classList.remove('is-frozen')
    onDone()
  }

  /* instant: no film, straight to the finished room (reduced motion, no WebGL, ?skip) */
  function instant() {
    phase = 'out'
    html.classList.remove('is-locked')
    main.removeAttribute('inert')
    Object.assign(u, { flame: 0, plume: 0, density: 1, lift: 0.2, top: 1, pointerGlow: coarse ? 0 : 0.32 })
    hero.final()
    html.classList.add('is-live')
    phase = 'done'
    onDone()
  }

  function skip() {
    if (phase === 'idle' || phase === 'reveal' || phase === 'done') return
    live.forEach((t) => t.kill())
    live.clear()
    if (nudgeCall) nudgeCall.kill()
    if (nudgeTween) nudgeTween.kill()
    if (idleBlow) idleBlow.kill()
    if (disarm) disarm()
    smoke.onFrame = null
    gsap.killTweensOf([u, rig, wish, wishLine, wishHint, gateDark, gateHint, skipBtn])
    Object.assign(u, { flame: 0, plume: 0, lean: 0, flash: 0 })
    phase = 'out'
    reveal(true)
  }

  skipBtn.addEventListener('click', skip)

  return {
    start,
    skip,
    instant,
    get phase() {
      return phase
    },
  }
}
