import { gsap } from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { copy } from '../copy.js'
import { fill } from '../lib/party.js'
import { buzz } from '../fx/haptics.js'

gsap.registerPlugin(ScrambleTextPlugin)

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/*
  Scene 2. Three questions, one at a time. Whatever you tap turns into his name,
  then the punchline, then the next question.
*/
export function initQuiz({ T, sfx, onDone }) {
  const qEl = $('#quizQ')
  const aEl = $('#quizA')
  const okEl = $('#quizOk')
  const pEl = $('#quizP')
  const optsEl = $('#quizOpts')
  const stage = $('#quizStage')
  const pips = $$('#quizPips li')

  const Q = copy.quiz.questions.map((q) => ({
    q: fill(q.q, T),
    options: q.options.map((o) => fill(o, T)),
    punch: fill(q.punch, T),
  }))

  let idx = -1
  let locked = true
  let started = false
  let finished = false
  let hold = null
  let enterTl = null // the question and answers sliding in
  let canSkip = false // only once the punchline is actually on screen
  let state = 'idle' // idle | asking | answered | moving | done

  function show(i) {
    idx = i
    state = 'asking'
    locked = true
    canSkip = false
    qEl.textContent = Q[i].q
    pEl.textContent = ''
    okEl.textContent = ''
    gsap.set(aEl, { opacity: 0, y: 0 })
    gsap.set(optsEl, { opacity: 1, y: 0 })

    optsEl.textContent = ''
    Q[i].options.forEach((label) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'opt'
      b.innerHTML = '<span class="opt__t"></span><span class="opt__a" aria-hidden="true">→</span>'
      b.firstChild.textContent = label
      b.addEventListener('click', () => pick(b, label))
      optsEl.append(b)
    })
    pips.forEach((p, k) => p.classList.toggle('is-on', k <= i))

    gsap.set(qEl, { opacity: 0, y: 16 })
    gsap.set(optsEl.children, { opacity: 0, y: 18 })
    const d = reduce ? 0 : 1
    // a tap counts as soon as the first answer is clearly there (0.5s), not when the last one has finished sliding in.
    // a thumb that lands on a visible button and gets nothing back feels broken.
    if (enterTl) enterTl.kill()
    enterTl = gsap
      .timeline()
      .to(qEl, { opacity: 1, y: 0, duration: 0.6 * d, ease: 'power3.out' })
      .to(optsEl.children, { opacity: 1, y: 0, duration: 0.5 * d, stagger: 0.09 * d, ease: 'power3.out' }, '-=0.25')
      .add(() => (locked = false), 0.5 * d)
  }

  function pick(btn, label) {
    if (locked || state !== 'asking') return
    locked = true
    state = 'answered'
    // the answers may still be sliding in: stop that so it can't fight the fade-out below, and show the one you tapped in full
    if (enterTl) enterTl.kill()
    enterTl = null
    gsap.to(btn, { opacity: 1, y: 0, duration: 0.12 })
    const right = label === T.name
    sfx.unlock()
    if (right) sfx.clink()
    else sfx.tick(1)
    buzz(right ? [18, 40, 18] : 16)

    // everything else steps back; the one you tapped becomes him
    $$('.opt', optsEl).forEach((o) => {
      if (o === btn) return
      o.classList.add('is-gone')
      gsap.to(o, { opacity: 0, duration: 0.3 })
    })
    btn.classList.add('is-picked')
    const t = $('.opt__t', btn)

    const tl = gsap.timeline()
    if (reduce) t.textContent = T.NAME
    else tl.to(t, { duration: right ? 0.55 : 0.95, scrambleText: { text: T.NAME, chars: 'upperCase', speed: 0.55, revealDelay: 0.12 } })

    // the question gives way to the punchline
    tl.to(qEl, { opacity: 0, y: -10, duration: reduce ? 0 : 0.3, ease: 'power2.in' }, reduce ? 0 : '>-0.15')
      .add(() => {
        okEl.textContent = right ? fill(copy.quiz.right, T) : ''
        okEl.hidden = !right
        pEl.textContent = Q[idx].punch
        gsap.set(aEl, { y: 14 })
      })
      .to(aEl, { opacity: 1, y: 0, duration: reduce ? 0 : 0.55, ease: 'power3.out' })
      .add(() => {
        // a beat to read it. tap the stage to go faster.
        canSkip = true
        hold = gsap.delayedCall(2.7, advance)
      })
  }

  function advance() {
    if (state !== 'answered') return
    if (hold) hold.kill()
    state = 'moving'
    if (idx >= Q.length - 1) {
      finished = true
      state = 'done'
      onDone?.()
      return
    }
    gsap
      .timeline()
      .to([aEl, optsEl], { opacity: 0, y: -12, duration: reduce ? 0 : 0.35, ease: 'power2.in' })
      .add(() => show(idx + 1))
  }

  stage.addEventListener('click', () => {
    if (state === 'answered' && canSkip && !finished) advance()
  })

  return {
    // called the first time the scene is on screen
    enter() {
      if (started) return
      started = true
      show(0)
    },
  }
}
