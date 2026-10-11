/*
  The small white line at the bottom, like the one before a film.
  It fades out, changes its words, and fades back in. That is all it does.
*/
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let timer = 0

export function setDisclaimer(text) {
  const el = document.getElementById('disclaimer')
  if (!el || !text || el.textContent === text) return
  clearTimeout(timer)
  const show = () => {
    el.textContent = text
    el.classList.add('is-on')
  }
  if (!el.textContent || reduce) {
    show()
    return
  }
  el.classList.remove('is-on')
  timer = setTimeout(show, 520) // the fade-out in the CSS takes .5s
}
