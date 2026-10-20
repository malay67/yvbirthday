import { gsap } from 'gsap'

const $ = (s, r = document) => r.querySelector(s)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/*
  Scene 7. Closing time. "See you Monday." and one button: Light it again, which starts the whole thing over from the dark.
*/
export function initEnd({ colophon } = {}) {
  const scene = $('#scene-end')

  $('#againBtn').addEventListener('click', () => {
    const u = new URL(window.location.href)
    u.searchParams.delete('skip') // light it again means the whole thing, from the dark
    u.hash = ''
    window.scrollTo(0, 0)
    if (u.href === window.location.href) window.location.reload()
    else window.location.href = u.href
  })

  // the credits for the type
  $('#fontsBtn')?.addEventListener('click', () => colophon && colophon.open())
  return {
    // called the first time the scene is on screen
    enter() {
      if (reduce) return
      gsap.from($('.end__big', scene).children, { yPercent: 40, opacity: 0, duration: 1, stagger: 0.14, ease: 'power4.out', clearProps: 'transform,opacity' })
      gsap.from([$('.end__note', scene), $('#againBtn')], { opacity: 0, y: 18, duration: 0.8, stagger: 0.14, delay: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' })
    },
  }
}
