import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

gsap.registerPlugin(Draggable, InertiaPlugin)

/*
  The flint wheel.
  Drag it and it keeps spinning when you let go. Speed makes sparks and clicks;
  a proper flick lights the flame. Click or press Enter and it flicks for you.
*/
export function createWheel({ wheel, grip, rig, sparks, sfx, onIgnite, onWeak, onVibrate = () => {} }) {
  const TOOTH = 12 // degrees between clicks
  const NEED = 130 // deg/s that counts as a proper flick (about 800px/s at the rim)

  let ignited = false
  let dragging = false
  let last = 0
  let lastT = performance.now()
  let vel = 0
  let tickAcc = 0
  let hot = 0
  let energy = 0
  let peak = 0
  let weak = 0
  let auto = null
  let weakCall = null

  // where the rim meets the flame, in screen px
  function contact() {
    const r = rig.getBoundingClientRect()
    const R = (r.width / 2) * (297 / 300)
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 - R }
  }

  function light() {
    if (ignited) return
    ignited = true
    onVibrate()
    onIgnite(contact())
  }

  function step() {
    const now = performance.now()
    const dt = Math.max(0.001, (now - lastT) / 1000)
    lastT = now
    const rot = gsap.getProperty(wheel, 'rotation')
    const delta = rot - last
    last = rot

    vel += (delta / dt - vel) * Math.min(1, dt * 14)
    // Draggable also tracks velocity from the pointer events themselves, which stays honest
    // when frames are slow. take whichever is higher.
    const tracked = InertiaPlugin.getVelocity(wheel, 'rotation') || 0
    const speed = Math.max(Math.abs(vel), Math.abs(tracked))
    peak = Math.max(peak, speed)

    // one click per tooth passed, capped so a fast spin stays a rattle and not a buzz
    tickAcc += Math.abs(delta)
    let n = 0
    while (tickAcc >= TOOTH && n < 3) {
      tickAcc -= TOOTH
      n++
      sfx.tick(speed / 700)
    }
    if (tickAcc > TOOTH * 3) tickAcc = 0

    // sparks, in proportion to how hard it is being spun
    if (speed > 70 && Math.random() < Math.min(0.95, speed / 520)) {
      const c = contact()
      sparks.flint(c.x, c.y, vel >= 0 ? 1 : -1, Math.min(1, speed / 800))
    }

    // lights on either: three quick frames in a row, or enough travel at speed.
    // the second rule keeps it fair on slow devices where frames are few.
    if (!ignited) {
      if (speed >= NEED) {
        hot++
        energy += Math.abs(delta)
      } else {
        hot = Math.max(0, hot - 1)
        energy = Math.max(0, energy - Math.abs(delta) * 0.5)
      }
      if (hot >= 3 || energy >= 30) light()
    }
  }

  function autoFlick() {
    if (ignited || auto) return
    sfx.unlock()
    gsap.killTweensOf(wheel)
    hot = 0
    energy = 0
    last = gsap.getProperty(wheel, 'rotation')
    lastT = performance.now()
    auto = gsap.to(wheel, {
      rotation: '+=900',
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: step,
      onComplete: () => (auto = null),
    })
    gsap.delayedCall(0.24, light)
  }

  // the wheel turns, but fingers land on the grip: a strip that stops short of the screen edges,
  // because that is where the phone's own back-swipe starts
  const drag = Draggable.create(wheel, {
    trigger: grip || wheel,
    type: 'rotation',
    inertia: true,
    throwResistance: 650,
    minimumMovement: 3,
    allowContextMenu: true,
    onPress() {
      sfx.unlock()
      if (auto) {
        auto.kill()
        auto = null
      }
      dragging = true
      if (weakCall) weakCall.kill()
      last = gsap.getProperty(wheel, 'rotation')
      lastT = performance.now()
      vel = 0
      peak = 0
      hot = 0
      energy = 0
    },
    onDrag: step,
    onThrowUpdate: step,
    onRelease() {
      dragging = false
      if (ignited) return
      // if nothing lit within a moment, it was a weak one
      if (weakCall) weakCall.kill()
      weakCall = gsap.delayedCall(0.8, () => {
        if (ignited || dragging || auto) return
        if (peak > 25) {
          weak++
          onWeak(weak)
          if (weak >= 3) autoFlick() // be kind after three tries
        }
        peak = 0
      })
    },
    onClick: autoFlick,
  })[0]

  wheel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      autoFlick()
    }
  })

  return {
    autoFlick,
    contact,
    get ignited() {
      return ignited
    },
    destroy() {
      drag.kill()
      if (auto) auto.kill()
      if (weakCall) weakCall.kill()
      gsap.killTweensOf(wheel)
    },
  }
}
