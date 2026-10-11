/*
  Sparks and embers, drawn on a 2D canvas above everything.
  Sparks are fast, short and bright (flint, stamp, ignition).
  Embers are slow, warm and drift upward (the page is never quite still).
*/

const TAU = Math.PI * 2
const rand = (a, b) => a + Math.random() * (b - a)

function makeGlow() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  r.addColorStop(0, 'rgba(255,236,190,1)')
  r.addColorStop(0.25, 'rgba(255,170,70,.55)')
  r.addColorStop(1, 'rgba(255,110,30,0)')
  g.fillStyle = r
  g.fillRect(0, 0, s, s)
  return c
}

/* a soft grey-bone haze, for puffs of smoke */
function makePuff() {
  const s = 96
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  r.addColorStop(0, 'rgba(226,214,196,.62)')
  r.addColorStop(0.45, 'rgba(204,192,176,.26)')
  r.addColorStop(1, 'rgba(190,178,160,0)')
  g.fillStyle = r
  g.fillRect(0, 0, s, s)
  return c
}

export class Sparks {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.list = []
    this.glow = makeGlow()
    this.haze = makePuff()
    this.running = false
    this.ambient = 0 // embers per second drifting up from the bottom
    this.acc = 0
    this.max = 520
    this.dpr = 1
    this.w = 0
    this.h = 0
    this._tick = this._tick.bind(this)
    this.resize()
  }

  resize() {
    // sparks and embers are soft light, they do not need a phone's full pixel density
    const coarse = window.matchMedia('(pointer: coarse)').matches
    this.dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /* one fast streak */
  spark(x, y, vx, vy, life = rand(0.35, 0.85), size = rand(1, 2.1)) {
    if (this.list.length >= this.max) this.list.shift()
    this.list.push({ k: 0, x, y, vx, vy, life, max: life, size })
    this.start()
  }

  /* a fan of sparks. angle is where the fan points, spread is its width in radians */
  burst(x, y, n = 20, { angle = -Math.PI / 2, spread = Math.PI * 2, speed = 420, jitter = 0.6 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = angle + rand(-spread / 2, spread / 2)
      const s = speed * rand(1 - jitter, 1 + jitter * 0.4)
      this.spark(x, y, Math.cos(a) * s, Math.sin(a) * s)
    }
  }

  /* flint sparks off the top of the wheel. dir is +1 or -1, strength 0..1 */
  flint(x, y, dir, strength) {
    const n = 1 + Math.floor(strength * 3 + Math.random() * 1.5)
    for (let i = 0; i < n; i++) {
      const sp = rand(220, 620) * (0.45 + strength)
      const lift = rand(0.1, 0.95)
      this.spark(x + rand(-10, 10), y + rand(-2, 4), dir * sp * rand(0.25, 1), -sp * lift, rand(0.28, 0.8), rand(1, 2.2))
    }
  }

  /* one slow glowing ember */
  ember(x, y, { rise = rand(18, 52), life = rand(2.2, 5.5), size = rand(1.2, 3.2) } = {}) {
    if (this.list.length >= this.max) this.list.shift()
    this.list.push({
      k: 1,
      x,
      y,
      vx: rand(-8, 8),
      vy: -rise,
      life,
      max: life,
      size,
      ph: rand(0, TAU),
      sway: rand(8, 26),
    })
    this.start()
  }

  /* a puff of smoke: soft, slow, grows as it thins out */
  puff(x, y, n = 8, { spread = 40, rise = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.max) this.list.shift()
      const life = rand(1.3, 2.3)
      this.list.push({
        k: 2,
        x: x + rand(-spread * 0.4, spread * 0.4),
        y: y + rand(-spread * 0.3, spread * 0.3),
        vx: rand(-spread, spread),
        vy: -rand(26, 70) * rise,
        life,
        max: life,
        size: rand(20, 40),
        grow: rand(1.4, 2.4),
        ph: rand(0, TAU),
      })
    }
    this.start()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    requestAnimationFrame(this._tick)
  }

  _tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now

    if (this.ambient > 0 && !document.hidden) {
      this.acc += dt * this.ambient
      while (this.acc >= 1) {
        this.acc -= 1
        this.ember(rand(0, this.w), this.h + 10, { rise: rand(26, 70), life: rand(4, 8) })
      }
    }

    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    ctx.globalCompositeOperation = 'lighter'

    const L = this.list
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]
      p.life -= dt
      if (p.life <= 0) {
        L.splice(i, 1)
        continue
      }
      const f = p.life / p.max // 1 -> 0

      if (p.k === 0) {
        // spark: gravity + drag, drawn as a streak along its velocity
        p.vy += 900 * dt
        const drag = Math.exp(-1.6 * dt)
        p.vx *= drag
        p.vy *= drag
        const px = p.x
        const py = p.y
        p.x += p.vx * dt
        p.y += p.vy * dt
        const tail = Math.min(0.04 + (1 - f) * 0.02, 0.07)
        const hot = f > 0.55
        ctx.strokeStyle = hot ? `rgba(255,${(235 * f + 60) | 0},${(170 * f) | 0},${Math.min(1, f * 1.6)})` : `rgba(255,${(120 + 130 * f) | 0},40,${f * 1.4})`
        ctx.lineWidth = p.size * (0.5 + f)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(px - p.vx * tail, py - p.vy * tail)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      } else if (p.k === 2) {
        // smoke puff: drifts, slows, swells, thins
        p.ph += dt * 1.6
        p.vx *= Math.exp(-0.9 * dt)
        p.x += (p.vx + Math.sin(p.ph) * 12) * dt
        p.y += p.vy * dt
        const e = 1 - f
        const r = p.size * (1 + e * p.grow)
        ctx.globalAlpha = Math.min(1, f * 1.6) * Math.min(1, e * 7) * 0.7
        ctx.drawImage(this.haze, p.x - r, p.y - r, r * 2, r * 2)
      } else {
        // ember: drifts up, sways, flickers, fades
        p.ph += dt * 2.2
        p.x += (p.vx + Math.sin(p.ph) * p.sway) * dt
        p.y += p.vy * dt
        const flick = 0.72 + 0.28 * Math.sin(p.ph * 3.1 + p.size)
        const a = Math.min(1, f * 2.2) * Math.min(1, (1 - f) * 8) * flick
        const r = p.size * 5.5
        ctx.globalAlpha = a * 0.9
        ctx.drawImage(this.glow, p.x - r, p.y - r, r * 2, r * 2)
      }
    }
    ctx.globalAlpha = 1

    if (L.length || this.ambient > 0) requestAnimationFrame(this._tick)
    else this.running = false
  }
}
