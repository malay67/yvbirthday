import { gsap } from 'gsap'
import { copy } from '../copy.js'
import { fill, whatsappUrl, whatsappMessage, googleCalUrl, calendarParts } from '../lib/party.js'
import { collected, collectedLine } from '../lib/collected.js'
import { buzz } from '../fx/haptics.js'
import { goTo } from '../lib/open.js'

const $ = (s, r = document) => r.querySelector(s)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

/* a believable barcode, drawn once, same every time */
function barcode(el, seed) {
  let s = seed % 2147483647 || 1
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const W = 100
  let y = 0
  let rects = ''
  while (y < 300) {
    const bar = 1 + Math.floor(rnd() * 4) * 1.4
    const gap = 1 + Math.floor(rnd() * 3) * 1.2
    rects += `<rect x="0" y="${y.toFixed(1)}" width="${W}" height="${bar.toFixed(1)}"/>`
    y += bar + gap
  }
  el.innerHTML = `<svg viewBox="0 0 ${W} ${y.toFixed(0)}" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">${rects}</svg>`
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isAndroid = () => /Android/i.test(navigator.userAgent)

/*
  Scene 4. A ticket, and a question with only one answer.
  "Can't make it" shrinks and runs. "Obviously" grows. Say Obviously and the stamp comes down.
*/
export function initRsvp({ P, T, sparks, sfx }) {
  const wrap = $('#ticketWrap')
  const stamp = $('#stamp')
  const stage = $('#askStage')
  const yes = $('#yesBtn')
  const no = $('#noBtn')
  const noV = $('#noV')
  const askQ = $('#askQ')
  const guilt = $('#guilt')
  const waLink = $('#waLink')
  const ask = $('#ask')

  barcode($('#barcode'), P.party.y * 10000 + P.party.m * 100 + P.party.d)
  $('#ticket').setAttribute('aria-label', `${fill(copy.rsvp.title, T)}. ${fill(copy.rsvp.dateVal, T)}, ${fill(copy.rsvp.timeVal, T)}, ${fill(copy.rsvp.placeVal, T)}`)

  /* ---------- the punch card on the stub: one hole per thing collected ---------- */
  const holes = $('#punchHoles')
  const punchN = $('#punchN')
  const ids = copy.collection.objects.map((o) => o.id)
  ids.forEach(() => holes.append(document.createElement('i')))
  const paintPunch = () => {
    Array.from(holes.children).forEach((h, i) => h.classList.toggle('is-on', collected.has(ids[i])))
    punchN.textContent = fill(copy.collection.stubCount, { n: collected.count(), total: collected.total() })
  }
  paintPunch()
  collected.subscribe(paintPunch)

  /* ---------- WhatsApp ---------- */
  // the message is rebuilt whenever the collection changes, so it can carry one extra line: what he collected
  let waUrl = ''
  const buildWa = () => {
    waUrl = whatsappUrl(P, whatsappMessage(P, copy, collectedLine(T)))
    waLink.href = waUrl
  }
  buildWa()
  collected.subscribe(buildWa)

  // a new tab keeps this page alive. if the phone refuses, go in this tab instead.
  const openWhatsApp = () => goTo(waUrl)

  /* ---------- the guilt line ---------- */
  // "Coming?" and the guilt trip share one slot. the first guilt line pushes the question out,
  // after that each line replaces the one before.
  let spoken = false
  function swapGuilt(text) {
    const leaving = spoken ? guilt : askQ
    spoken = true
    if (reduce) {
      gsap.set(askQ, { opacity: 0 })
      guilt.textContent = text
      gsap.set(guilt, { opacity: 1 })
      return
    }
    gsap
      .timeline()
      .to(leaving, { opacity: 0, y: -6, duration: 0.16 })
      .add(() => (guilt.textContent = text))
      .fromTo(guilt, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' })
  }

  /* ---------- Can't make it ---------- */
  // after each tap: how big Obviously gets, and how small (and where) the other button goes
  // (the heights stay under the 64px the stage keeps free above the 48px dodger)
  const YES = [
    { w: 54, h: 56, fs: 14 },
    { w: 64, h: 58, fs: 15 },
    { w: 76, h: 60, fs: 16.5 },
    { w: 100, h: 62, fs: 18 },
  ]
  const SHRINK = [1, 0.8, 0.6, 0.42]
  let noTaps = 0
  let done = false
  let busy = false

  function tapNo() {
    if (done || busy) return
    busy = true
    noTaps++
    const k = noTaps
    sfx.unlock()
    sfx.pop()
    buzz(14)

    // Obviously grows with every refusal
    const y = YES[Math.min(k, 3)]
    gsap.to(yes, { width: y.w + '%', height: y.h, fontSize: y.fs, duration: reduce ? 0 : 0.45, ease: 'back.out(1.5)' })

    if (k <= 3) {
      swapGuilt(fill(copy.rsvp.guilt[k - 1] || '', T))
      // the other button gets smaller and runs. its tap area never drops under 48px.
      const W = stage.clientWidth
      const H = stage.clientHeight
      const s = SHRINK[k]
      const bw = Math.max(48, Math.round(W * 0.44 * s))
      const slots = [-(W - bw), 0, -(W - bw) / 2] // bottom-left, bottom-right, bottom-centre
      gsap.to(noV, { scale: s, duration: reduce ? 0 : 0.3 })
      // the tap area sits 3px below the stage (the gap to the links under it is 10px+).
      // a tilted box reaches a little above its top edge; shrink the tilt until that stays clear of Obviously.
      const top = H - 48 + 3
      const room = top - y.h - 1
      const reach = (deg) => (48 * Math.cos((Math.abs(deg) * Math.PI) / 180) + bw * Math.sin((Math.abs(deg) * Math.PI) / 180) - 48) / 2
      let tilt = gsap.utils.random(-7, 7)
      while (Math.abs(tilt) > 0.5 && reach(tilt) > room) tilt *= 0.8
      gsap.to(no, {
        width: bw,
        height: 48,
        x: slots[k - 1],
        y: top,
        rotation: reduce ? 0 : tilt,
        duration: reduce ? 0 : 0.5,
        ease: 'back.out(1.4)',
        onComplete: () => (busy = false),
      })
    } else {
      // no option left
      const r = no.getBoundingClientRect()
      sparks.puff(r.left + r.width / 2, r.top + r.height / 2, 6, { spread: 24 })
      swapGuilt(fill(copy.rsvp.noOption, T))
      gsap.to(no, {
        opacity: 0,
        scale: 0.2,
        duration: reduce ? 0 : 0.3,
        onComplete: () => {
          no.hidden = true
          busy = false
        },
      })
    }
  }

  /* ---------- Obviously ---------- */
  function sayYes() {
    if (done) return
    done = true
    sfx.unlock()
    yes.disabled = true
    yes.classList.add('is-done')
    if (!no.hidden) gsap.to(no, { opacity: 0, duration: 0.2, onComplete: () => (no.hidden = true) })

    const slam = () => {
      const r = stamp.getBoundingClientRect()
      sparks.burst(r.left + r.width / 2, r.top + r.height / 2, 32, { spread: Math.PI * 2, speed: 400 })
      for (let i = 0; i < 6; i++) sparks.ember(r.left + r.width / 2 + (Math.random() - 0.5) * r.width, r.top + r.height / 2 + (Math.random() - 0.5) * r.height * 0.6, { rise: 30 + Math.random() * 50, life: 2 + Math.random() * 2 })
      sfx.stamp()
      setTimeout(() => sfx.clink(), 240)
      buzz([30, 50, 80])
    }

    const tl = gsap.timeline()
    if (reduce) {
      tl.set(stamp, { opacity: 0.92, scale: 1, rotation: -14 }).add(slam)
    } else {
      tl.set(stamp, { opacity: 0, scale: 2.8, rotation: -30 })
        .to(stamp, { opacity: 0.92, scale: 1, rotation: -14, duration: 0.2, ease: 'power4.in' })
        .add(slam)
        .fromTo(wrap, { x: 0 }, { x: 6, duration: 0.05, yoyo: true, repeat: 5, ease: 'sine.inOut' }, '<')
        .to(wrap, { x: 0, duration: 0.1 })
    }
    tl.add(() => {
      swapGuilt(fill(copy.rsvp.done, T))
      // the WhatsApp button takes the place of the yes button, so the page does not grow
      gsap.to(yes, { opacity: 0, duration: reduce ? 0 : 0.25, onComplete: () => (yes.hidden = true) })
      waLink.hidden = false
      gsap.fromTo(waLink, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: reduce ? 0 : 0.5 })
    }, '+=0.1')

    // let the stamp land, then hand over to WhatsApp
    setTimeout(openWhatsApp, reduce ? 400 : 1150)
  }

  yes.addEventListener('click', sayYes)
  no.addEventListener('click', tapNo)

  /* ---------- the small links ---------- */
  const parts = calendarParts(P, copy)
  const gUrl = googleCalUrl(P, parts)
  const icsUrl = new URL('./party.ics', location.href).href
  const icsName = `${P.name.toLowerCase()}-birthday.ics`
  $('#calGoogle').href = gUrl
  $('#calFile').href = icsUrl
  $('#calFile').setAttribute('download', icsName)

  // the "nothing happened?" row takes the place of the small links, then hands it back
  const more = $('#more')
  const calAlt = $('#calAlt')
  let altTimer = 0
  const hideAlt = () => {
    clearTimeout(altTimer)
    more.classList.remove('is-alt')
    calAlt.hidden = true
  }
  const showAlt = () => {
    more.classList.add('is-alt')
    calAlt.hidden = false
    clearTimeout(altTimer)
    altTimer = setTimeout(hideAlt, 9000)
  }

  $('#calBtn').addEventListener('click', () => {
    if (isAndroid()) {
      // Android Chrome and the in-app browsers all open a Google Calendar link
      goTo(gUrl)
    } else if (isIOS()) {
      // Safari shows its own "Add to Calendar" sheet for a real .ics address
      window.location.href = icsUrl
    } else {
      const a = document.createElement('a')
      a.href = icsUrl
      a.download = icsName
      document.body.append(a)
      a.click()
      a.remove()
    }
    // if nothing seemed to happen (this page is still in front), the other routes show up for a few seconds
    clearTimeout(altTimer)
    altTimer = setTimeout(() => {
      if (document.visibilityState === 'visible') showAlt()
    }, 1400)
  })
  calAlt.addEventListener('click', (e) => {
    if (e.target.closest('a')) setTimeout(hideAlt, 700)
  })

  const map = $('#mapLink')
  if (P.mapLink) {
    map.href = P.mapLink
    map.hidden = false
  }

  $('#againBtn').addEventListener('click', () => {
    const u = new URL(window.location.href)
    u.searchParams.delete('skip') // light it again means the whole thing, from the dark
    u.hash = ''
    window.scrollTo(0, 0)
    if (u.href === window.location.href) window.location.reload()
    else window.location.href = u.href
  })

  /* ---------- a little life ---------- */
  gsap.set(wrap, { rotation: -1.4, transformPerspective: 1200 })
  if (fine && !reduce) {
    const rx = gsap.quickTo(wrap, 'rotationX', { duration: 0.8, ease: 'power3.out' })
    const ry = gsap.quickTo(wrap, 'rotationY', { duration: 0.8, ease: 'power3.out' })
    wrap.addEventListener('pointermove', (e) => {
      const b = wrap.getBoundingClientRect()
      ry(((e.clientX - b.left) / b.width - 0.5) * 9)
      rx(-((e.clientY - b.top) / b.height - 0.5) * 9)
    })
    wrap.addEventListener('pointerleave', () => {
      rx(0)
      ry(0)
    })
  }

  return {
    // called the first time the scene is on screen
    enter() {
      if (reduce) return
      gsap.from(wrap, { y: 130, rotation: 5, opacity: 0, duration: 1.4, ease: 'power4.out' })
      gsap.from([ask, $('.links')], { opacity: 0, y: 22, duration: 0.9, stagger: 0.12, delay: 0.5, ease: 'power3.out' })
    },
  }
}
