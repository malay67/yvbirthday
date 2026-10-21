import './style.css'
import '@fontsource/league-gothic/latin-400.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'

import party from '../party.config.js'
import partyRaw from '../party.config.js?raw'
import { check, withLines, tokens, fill, phaseOf } from './lib/party.js'
import { showConfigError } from './lib/config-error.js'
import { bindCopy } from './lib/bind.js'
import { makeClock } from './lib/clock.js'
import { useAfter } from './lib/after.js'
import { copy } from './copy.js'

import { Smoke } from './gl/smoke.js'
import { Sparks } from './fx/sparks.js'
import { Sfx } from './fx/audio.js'
import { initSound } from './ui/sound.js'
import { createIntro } from './intro.js'
import { createHero } from './scenes/name.js'
import { initScenes } from './scenes/index.js'
import { setDisclaimer } from './ui/disclaimer.js'
import { initCigarette } from './ui/cigarette.js'

const $ = (s) => document.querySelector(s)
const qs = new URLSearchParams(location.search)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// a reload (or "light it again") should start at the top, in the dark, not wherever you left off
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// first: are the settings in party.config.js usable? if not, say which line to fix and stop.
const { P, errors } = check(party)
if (errors.length) showConfigError(withLines(partyRaw, errors))
else start(P)

function start(P) {
  const clock = makeClock(P)
  // the party is over: the lines in copy.after take the place of the others, before anything reads them
  const after = phaseOf(P, clock.now()).state === 'after'
  if (after) useAfter(copy)
  document.documentElement.classList.toggle('is-after', after)

  const T = tokens(P, copy)
  bindCopy(document, T)

  // the strip at the top: "for Yuvraj" while the intro plays, then "Yuvraj / dd.mm.yy"
  $('[data-bind="barA"]').textContent = fill(copy.bar.during, T)
  const barB = $('[data-bind="barB"]')
  const [left, right] = fill(copy.bar.after, T).split(' / ')
  const slash = document.createElement('i')
  slash.textContent = '/'
  barB.textContent = ''
  barB.append(left, slash, right)

  const hero = createHero(P)

  // ?hq renders the room at full resolution, ?q=0.4 at a fixed lower one (handy on slow machines)
  const q = parseFloat(qs.get('q'))
  const smoke = new Smoke($('#smoke'), qs.has('hq') ? { scale: 1, fixed: true } : q > 0 ? { scale: q, fixed: true } : {})
  const sparks = new Sparks($('#sparks'))
  const sfx = new Sfx()
  initSound(sfx, T)

  const onResize = () => {
    smoke.resize()
    sparks.resize()
  }
  window.addEventListener('resize', onResize)
  onResize()

  // the pointer is a faint light in the smoke
  window.addEventListener('pointermove', (e) => smoke.setPointer(e.clientX, e.clientY), { passive: true })

  const intro = createIntro({
    smoke,
    sparks,
    sfx,
    hero,
    T,
    onDone: () =>
      initScenes({
        P,
        T,
        smoke,
        sparks,
        sfx,
        clock,
        after,
        extras: [
          // the film line changes once his name is up, and the cigarette starts to burn
          ({ scenes }) => {
            setDisclaimer(fill(copy.disclaimer.done, T))
            initCigarette({ scenes, sfx })
          },
        ],
      }),
  })

  async function boot() {
    // wait for the type, but never hold the page hostage to it
    if (document.fonts && document.fonts.load) {
      const loads = Promise.all([
        document.fonts.load('1em "League Gothic"'),
        document.fonts.load('italic 1em "Instrument Serif"'),
        document.fonts.load('1em "Instrument Serif"'),
        document.fonts.load('1em "DM Mono"'),
      ])
      await Promise.race([loads, new Promise((r) => setTimeout(r, 2500))])
    }

    smoke.resize()
    smoke.start()

    if (!smoke.ok || reduce || qs.has('skip')) intro.instant()
    else intro.start()
  }

  boot()

  // handy for poking at it while developing; stripped from the production build
  if (import.meta.env.DEV) window.__yuv = { smoke, sparks, sfx, intro, clock }
}
