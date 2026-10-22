/*
  Sound, synthesised. No files.
  Every call is wrapped so audio can never break the page.
*/

const KEY = 'yuv-sound'

function stored() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export class Sfx {
  constructor() {
    this.ctx = null
    this.master = null
    this.noise = null
    this.enabled = stored()
    this.flameNode = null
  }

  /* must run inside a user gesture the first time */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return
        this.ctx = new AC()
        this.master = this.ctx.createGain()
        this.master.gain.value = this.enabled ? 0.6 : 0
        const comp = this.ctx.createDynamicsCompressor()
        this.master.connect(comp)
        comp.connect(this.ctx.destination)
        // two seconds of white noise, reused for everything
        const n = this.ctx.sampleRate * 2
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
        this.noise = buf
      }
      if (this.ctx.state === 'suspended') this.ctx.resume()
    } catch {}
  }

  setEnabled(v) {
    this.enabled = v
    try {
      localStorage.setItem(KEY, v ? 'on' : 'off')
    } catch {}
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.6 : 0, this.ctx.currentTime, 0.05)
  }

  get ready() {
    return !!(this.ctx && this.enabled && this.ctx.state === 'running')
  }

  /* a filtered burst of noise */
  _burst({ type = 'bandpass', f = 1200, f2 = null, q = 1, gain = 0.2, attack = 0.004, dur = 0.12, rate = 1, delay = 0 }) {
    if (!this.ready) return
    try {
      const c = this.ctx
      const t0 = c.currentTime + delay
      const src = c.createBufferSource()
      src.buffer = this.noise
      src.playbackRate.value = rate
      const flt = c.createBiquadFilter()
      flt.type = type
      flt.Q.value = q
      flt.frequency.setValueAtTime(f, t0)
      if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      src.connect(flt)
      flt.connect(g)
      g.connect(this.master)
      src.start(t0, Math.random() * 1.5)
      src.stop(t0 + dur + 0.05)
    } catch {}
  }

  _tone({ f = 440, f2 = null, type = 'sine', gain = 0.2, dur = 0.3, delay = 0 }) {
    if (!this.ready) return
    try {
      const c = this.ctx
      const t0 = c.currentTime + delay
      const o = c.createOscillator()
      o.type = type
      o.frequency.setValueAtTime(f, t0)
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      o.connect(g)
      g.connect(this.master)
      o.start(t0)
      o.stop(t0 + dur + 0.05)
    } catch {}
  }

  /* one tooth of the flint wheel */
  tick(v = 1) {
    const k = Math.max(0.25, Math.min(1, v))
    this._burst({ f: 2600 + Math.random() * 1800, q: 2.4, gain: 0.07 * k + 0.02, attack: 0.0012, dur: 0.018, rate: 0.8 + Math.random() * 0.8 })
  }

  /* the flame catches */
  ignite() {
    this._burst({ type: 'lowpass', f: 380, f2: 2400, q: 0.7, gain: 0.34, attack: 0.03, dur: 0.55 })
    this._burst({ f: 5200, q: 1.2, gain: 0.1, attack: 0.002, dur: 0.05 })
    this.flameOn()
  }

  flameOn() {
    if (!this.ready || this.flameNode) return
    try {
      const c = this.ctx
      const src = c.createBufferSource()
      src.buffer = this.noise
      src.loop = true
      const hp = c.createBiquadFilter()
      hp.type = 'bandpass'
      hp.frequency.value = 1100
      hp.Q.value = 0.5
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, c.currentTime)
      g.gain.linearRampToValueAtTime(0.026, c.currentTime + 0.8)
      src.connect(hp)
      hp.connect(g)
      g.connect(this.master)
      src.start()
      this.flameNode = { src, g }
    } catch {}
  }

  flameOff(t = 0.3) {
    const n = this.flameNode
    if (!n) return
    this.flameNode = null
    try {
      n.g.gain.cancelScheduledValues(this.ctx.currentTime)
      n.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, t / 3)
      n.src.stop(this.ctx.currentTime + t + 0.2)
    } catch {}
  }

  /* breath on a candle. `soft` is the first, failed attempt: the flame keeps hissing */
  blow(soft = false) {
    if (soft) {
      this._burst({ f: 1300, f2: 520, q: 0.7, gain: 0.16, attack: 0.08, dur: 0.45 })
      return
    }
    this.flameOff(0.35)
    this._burst({ f: 1500, f2: 420, q: 0.7, gain: 0.3, attack: 0.12, dur: 0.85 })
  }

  /* a smoker's cough: two rough, low bursts */
  cough() {
    ;[0, 0.19].forEach((d, i) => {
      this._burst({ f: 640 - i * 140, f2: 230, q: 0.8, gain: 0.34 - i * 0.07, attack: 0.012, dur: 0.15, rate: 0.7, delay: d })
      this._tone({ type: 'sawtooth', f: 132 - i * 16, f2: 76, gain: 0.09, dur: 0.13, delay: d })
    })
  }

  /* a small dry click, for buttons that dodge */
  pop() {
    this._tone({ f: 520, f2: 180, type: 'triangle', gain: 0.14, dur: 0.09 })
  }

  /* ink on paper */
  stamp() {
    this._tone({ f: 150, f2: 46, gain: 0.7, dur: 0.28 })
    this._burst({ type: 'lowpass', f: 1800, q: 0.7, gain: 0.32, attack: 0.002, dur: 0.07 })
  }

  /* a borrowed lighter that will not catch: one dry, flat "chk" */
  chk() {
    this._burst({ type: 'highpass', f: 2600, q: 0.9, gain: 0.2, attack: 0.001, dur: 0.04 })
    this._burst({ f: 950, q: 2, gain: 0.1, attack: 0.001, dur: 0.05, delay: 0.012 })
    this._tone({ f: 180, f2: 80, type: 'square', gain: 0.04, dur: 0.05 })
  }

  /* something small and hard dropping into a bottle */
  plink() {
    this._tone({ f: 2350, f2: 1850, gain: 0.09, dur: 0.24 })
    this._tone({ f: 3520, gain: 0.03, dur: 0.12, delay: 0.004 })
    this._burst({ f: 5200, q: 3, gain: 0.05, attack: 0.001, dur: 0.02 })
  }

  /* a screen cracking: a few dry snaps */
  crack() {
    ;[0, 0.045, 0.1].forEach((d, i) => this._burst({ type: 'highpass', f: 3200 + i * 900, q: 1.2, gain: 0.2 - i * 0.04, attack: 0.001, dur: 0.03 + i * 0.01, delay: d }))
    this._tone({ f: 1300, f2: 620, type: 'triangle', gain: 0.04, dur: 0.08 })
  }

  /* a phone ringing: two short double beeps */
  ring() {
    ;[0, 0.17].forEach((d) => {
      this._tone({ f: 1040, type: 'triangle', gain: 0.06, dur: 0.1, delay: d })
      this._tone({ f: 1320, type: 'triangle', gain: 0.05, dur: 0.1, delay: d })
    })
  }

  /* two glasses */
  clink() {
    ;[2093, 3136, 4186, 5230].forEach((f, i) => this._tone({ f, gain: 0.05 / (1 + i * 0.5), dur: 0.9 - i * 0.12, delay: 0.02 }))
    this._burst({ f: 6200, q: 2, gain: 0.07, attack: 0.001, dur: 0.03 })
  }
}
