/*
  The microphone, for "Blow for real (mic)" at the wish. It is only asked for when the guest taps that button.
  Nothing is recorded, stored or sent: the sound goes into an analyser, we read how loud it is, and that is all.
  It is not connected to the speakers. Every track is stopped by whoever called this (the candle going out, Skip, the tab being
  hidden, twenty seconds without a breath).

  A blow is the level going well above the room's own noise (measured for half a second first) and staying there for a moment.
*/
const CALIBRATE = 500 // ms of listening to the room before anything counts
const HOLD = 200 // ms above the line makes a blow
const AGAIN = 1200 // ms after a blow before the next one can count (the sound the page makes itself must not count as a breath)
const TICK = 33 // ms between readings
const MIN_LINE = 0.035 // the quietest line, however silent the room (level is 0 to 1)

export const micAvailable = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'

/*
  ctx       the page's AudioContext (the same one the sounds use)
  onLevel   called every reading with 0..1: how hard it is blowing right now (for the flame)
  onBlow    called once for every breath that counts
  resolves with { stop() }, or rejects if there is no microphone, it was refused, or anything else went wrong
*/
export async function listenMic({ ctx, onLevel, onBlow }) {
  if (!ctx) throw new Error('no audio')
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
  let src = null
  let an = null
  let timer = 0
  let stopped = false

  const stop = () => {
    if (stopped) return
    stopped = true
    clearInterval(timer)
    try {
      if (src) src.disconnect()
    } catch {}
    try {
      stream.getTracks().forEach((t) => t.stop())
    } catch {}
    src = an = null
  }

  try {
    if (ctx.state === 'suspended') await ctx.resume()
    src = ctx.createMediaStreamSource(stream)
    an = ctx.createAnalyser()
    an.fftSize = 1024
    an.smoothingTimeConstant = 0
    src.connect(an) // and nothing after the analyser: no speakers
  } catch (err) {
    stop()
    throw err
  }

  const floats = an.getFloatTimeDomainData ? new Float32Array(an.fftSize) : null
  const bytes = floats ? null : new Uint8Array(an.fftSize)
  const read = () => {
    let s = 0
    if (floats) {
      an.getFloatTimeDomainData(floats)
      for (let i = 0; i < floats.length; i++) s += floats[i] * floats[i]
      return Math.sqrt(s / floats.length)
    }
    an.getByteTimeDomainData(bytes)
    for (let i = 0; i < bytes.length; i++) {
      const v = (bytes[i] - 128) / 128
      s += v * v
    }
    return Math.sqrt(s / bytes.length)
  }

  const t0 = performance.now()
  let sum = 0
  let n = 0
  let line = MIN_LINE
  let floor = 0
  let since = 0 // when the level went above the line
  let ready = true // below half the line since the last blow
  let until = 0 // no blow counts before this
  timer = setInterval(() => {
    if (stopped) return
    const level = read()
    const now = performance.now()
    if (now - t0 < CALIBRATE) {
      sum += level
      n++
      floor = sum / n
      line = Math.max(floor * 3, MIN_LINE)
      onLevel(0)
      return
    }
    onLevel(Math.min(1, Math.max(0, (level - floor) / (line * 1.6))))
    if (now < until) {
      since = 0
      return
    }
    if (level > line) {
      if (!since) since = now
      if (ready && now - since >= HOLD) {
        ready = false
        until = now + AGAIN
        since = 0
        onBlow()
      }
    } else {
      since = 0
      if (level < line * 0.5) ready = true
    }
  }, TICK)

  return { stop }
}
