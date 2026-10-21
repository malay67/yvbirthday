/*
  The small white line at the bottom, like the one before a film.
  It fades out, changes its words, and fades back in. That is all it does.
*/
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let timer = 0
let want = '' // the words it is heading for (it may still be fading out the old ones)

export function setDisclaimer(text) {
  const el = document.getElementById('disclaimer')
  if (!el || !text || text === want) return
  want = text
  clearTimeout(timer)
  const show = () => {
    el.textContent = text
    el.classList.add('is-on')
  }
  if (!el.textContent || reduce) {
    show()
    return
  }
  // asked for the words that are still on screen (it was going to change, and changed its mind): just keep them
  if (el.textContent === text) {
    el.classList.add('is-on')
    return
  }
  el.classList.remove('is-on')
  timer = setTimeout(show, 520) // the fade-out in the CSS takes .5s
}
