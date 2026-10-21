/*
  Scroll progress, as a cigarette on the right edge. It burns down as you go,
  the ash grows and drops, and at the end it is stubbed out.
  The look is all CSS (#cig). This only feeds it two numbers: --burn and --ash.
*/
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const FILTER = 14 // px of filter that never burns (matches .cig__filter)
const STUB = 12 // px of paper left at the end, like a real butt
const ASH_MAX = 15

export function initCigarette({ scenes, sfx }) {
  const cig = document.getElementById('cig')
  if (!cig) return
  const bottle = document.getElementById('cigBottle')

  let H = 0
  let frame = 0
  let out = false
  let lastPlink = -1e9

  const measure = () => {
    H = cig.clientHeight
    paint()
  }

  function paint() {
    frame = 0
    const room = document.documentElement.scrollHeight - window.innerHeight
    const p = room > 0 ? clamp(window.scrollY / room, 0, 1) : 0
    const burnable = Math.max(0, H - FILTER - STUB)
    const burn = p * burnable

    // ash builds up while you scroll through a scene, then falls at the next one
    const seg = p * Math.max(1, scenes.length - 1)
    const ash = p >= 0.985 ? 0 : clamp((seg % 1) * (ASH_MAX * 1.35), 0, ASH_MAX)

    cig.style.setProperty('--burn', burn.toFixed(1) + 'px')
    cig.style.setProperty('--ash', ash.toFixed(1) + 'px')

    const isOut = p >= 0.985
    if (isOut !== out) {
      out = isOut
      cig.classList.toggle('is-out', out)
      // at the very end it is stubbed out in a little bottle, with a plink (not again within a few seconds, if he wobbles at the edge)
      if (bottle) bottle.classList.toggle('is-on', out)
      if (out && sfx && performance.now() - lastPlink > 4000) {
        lastPlink = performance.now()
        sfx.plink()
      }
    }
  }

  const queue = () => {
    if (!frame) frame = requestAnimationFrame(paint)
  }

  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', measure)
  if (document.fonts) document.fonts.ready.then(measure)
  measure()
}
