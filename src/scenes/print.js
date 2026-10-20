import { gsap } from 'gsap'
import { copy } from '../copy.js'
import { fill } from '../lib/party.js'
import { buzz } from '../fx/haptics.js'
import { drawPoster, loadFonts } from './posters.js'
import { openSheet, closeSheet, trapSheet as trap } from '../ui/sheet.js'

const $ = (s, r = document) => r.querySelector(s)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pad2 = (n) => String(n).padStart(2, '0')
const make = (tag, cls, text) => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text != null) e.textContent = text
  return e
}

const MAX_LINE = 40 // characters in a line the guest types
const MAX_BY = 24 // characters in the "Designed by" name
const KEY_BY = 'yuv-designer' // the one thing remembered on the phone

// one line of plain text: no control characters, single spaces, trimmed, cut to length (by letters, not by code units)
const clean = (s, max) => Array.from(String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('')

// localStorage can throw (private tabs, some in-app browsers), so every touch of it is inside try/catch
const memory = {
  get() {
    try {
      return clean(localStorage.getItem(KEY_BY), MAX_BY)
    } catch {
      return ''
    }
  },
  set(v) {
    try {
      if (v) localStorage.setItem(KEY_BY, v)
      else localStorage.removeItem(KEY_BY)
    } catch {}
  },
}

function shuffle(a) {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/*
  Scene 6. The Print Room.
  A poster on a canvas (1080 x 1350). Three looks, a pile of lines, or your own.
  Share sends the picture itself to WhatsApp, Instagram, the gallery. If the phone cannot, the poster opens big to save.

  The one tricky part: a phone only lets a page open its share sheet from inside a tap. If the page waits for the
  picture to be made first, the tap is "used up" and the share is refused. So the picture is made ahead of time,
  a moment after each change, and the Share tap just hands it over. If someone taps faster than that, the picture
  is made right there in the tap (slower, but still inside it).
*/
export function initPrint({ P, T, sfx }) {
  const C = copy.print
  const scene = $('#scene-print')
  const stage = $('#printStage')
  const sheet = $('#printSheet')
  const canvas = $('#posterCanvas')
  const ctx = canvas.getContext('2d')
  const metaEl = $('#printMeta')
  const stylesEl = $('#printStyles')
  const anotherBtn = $('#printAnother')
  const shareBtn = $('#printShare')
  const shareV = $('#printShareV')
  const writeBtn = $('#printWrite')

  const styleName = (id) => (C.styles.find((s) => s.id === id) || { name: id }).name
  const lines = C.lines.map((l) => clean(fill(l, T), 80)).filter(Boolean)
  // the first line is always the first poster. the rest come round in a shuffled order.
  const order = [0, ...shuffle(lines.map((_, i) => i).slice(1))]
  const host = (() => {
    try {
      return P.siteUrl ? new URL(P.siteUrl).host : location.host
    } catch {
      return location.host
    }
  })()

  const state = { style: C.styles[0].id, pos: 0, custom: '', own: false, by: memory.get() }

  /* ---------- what goes on the poster ---------- */
  function content() {
    const line = state.own && state.custom ? state.custom : lines[order[state.pos]]
    const by = clean(state.by, MAX_BY)
    return {
      line,
      initial: Array.from(P.name)[0].toUpperCase(),
      name: P.name,
      NAME: P.NAME,
      title: fill(copy.rsvp.title, T),
      date: T.date,
      dateLong: T.dateLong,
      dots: T.dots,
      time: T.time,
      place: T.place,
      no: T.ticketNo,
      host,
      by,
      byLine: by ? fill(C.designedBy, { by }) : '',
    }
  }

  /* ---------- the picture, made ahead of the tap ---------- */
  let ver = 0 // goes up every time the poster is redrawn
  let ready = { ver: -1, file: null }
  let blobTimer = 0

  const fileName = () => {
    const n = fill(C.fileName, { name: P.name, style: state.style }).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return (n || 'poster') + '.png'
  }
  const toFile = (blob, name) => {
    try {
      return new File([blob], name, { type: 'image/png' })
    } catch {
      blob.name = name
      return blob
    }
  }
  function prepareFile() {
    clearTimeout(blobTimer)
    const v = ver
    blobTimer = setTimeout(() => {
      try {
        canvas.toBlob((blob) => {
          if (blob && v === ver) ready = { ver: v, file: toFile(blob, fileName()) }
        }, 'image/png')
      } catch {}
    }, 450)
  }
  // the slow way, for a tap that came before the picture was ready: all of it happens inside the tap
  function fileNow() {
    try {
      const b64 = canvas.toDataURL('image/png').split(',')[1]
      const bin = atob(b64)
      const u8 = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
      return toFile(new Blob([u8], { type: 'image/png' }), fileName())
    } catch {
      return null
    }
  }

  /* ---------- drawing ---------- */
  function paintMeta() {
    const style = styleName(state.style)
    metaEl.textContent = state.own && state.custom ? fill(C.metaOwn, { style }) : fill(C.meta, { style, n: pad2(state.pos + 1), total: pad2(lines.length) })
  }

  function render() {
    const c = content()
    drawPoster(ctx, state.style, c)
    ver++
    canvas.setAttribute('aria-label', fill(C.posterLabel, { style: styleName(state.style), line: c.line }))
    canvas.dataset.line = c.line
    canvas.dataset.by = c.by
    canvas.dataset.style = state.style
    paintMeta()
    prepareFile()
  }

  // the poster comes out of the printer: it is revealed from the top, with a few quick clicks
  function printIn() {
    if (!reduce) {
      gsap.killTweensOf(sheet)
      gsap.fromTo(sheet, { clipPath: 'inset(0 0 100% 0)', y: -12 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.55, ease: 'power2.out', clearProps: 'clipPath,transform' })
    }
    ;[0, 85, 170, 255].forEach((d, k) => setTimeout(() => sfx.tick(0.85 - k * 0.15), d))
  }

  // the sheet is as big as the stage allows, always 4:5
  function fit() {
    const w = stage.clientWidth
    const h = stage.clientHeight
    if (!w || !h) return
    const sw = Math.floor(Math.min(w, h * 0.8))
    sheet.style.setProperty('--sw', sw + 'px')
    sheet.style.setProperty('--sh', Math.floor(sw * 1.25) + 'px')
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage)
  window.addEventListener('resize', fit)
  fit()

  /* ---------- the three looks ---------- */
  C.styles.forEach((s) => {
    const b = make('button', 'prt__style mono', s.name)
    b.type = 'button'
    b.dataset.s = s.id
    b.setAttribute('aria-pressed', String(s.id === state.style))
    b.addEventListener('click', () => {
      if (s.id === state.style) return
      sfx.unlock()
      buzz(8)
      state.style = s.id
      paintStyles()
      render()
      printIn()
      used()
    })
    stylesEl.append(b)
  })
  const paintStyles = () => Array.from(stylesEl.children).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === state.style)))

  /* ---------- another line ---------- */
  function another() {
    sfx.unlock()
    buzz(8)
    state.own = false
    state.pos = (state.pos + 1) % order.length
    render()
    printIn()
    used()
  }
  anotherBtn.addEventListener('click', another)
  sheet.addEventListener('click', another)

  /* ---------- write your own ---------- */
  const writeSheet = $('#writeSheet')
  const writeForm = $('#writeForm')
  const inLine = $('#writeLine')
  const inBy = $('#writeBy')
  const countEl = $('#writeCount')
  inLine.placeholder = C.sheet.linePlaceholder
  inBy.placeholder = C.sheet.byPlaceholder
  inLine.maxLength = MAX_LINE
  inBy.maxLength = MAX_BY
  const paintCount = () => (countEl.textContent = fill(C.sheet.count, { n: Array.from(inLine.value).length, max: MAX_LINE }))
  inLine.addEventListener('input', paintCount)

  writeBtn.addEventListener('click', () => {
    sfx.unlock()
    inLine.value = state.custom
    inBy.value = state.by
    paintCount()
    openSheet(writeSheet, inLine)
  })
  const closeWrite = () => closeSheet(writeSheet)
  $('#writeCancel').addEventListener('click', closeWrite)
  trap(writeSheet, closeWrite)
  writeForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const line = clean(inLine.value, MAX_LINE)
    state.by = clean(inBy.value, MAX_BY)
    memory.set(state.by)
    if (line) {
      state.custom = line
      state.own = true
    }
    closeWrite()
    sfx.unlock()
    sfx.pop()
    buzz(10)
    render()
    printIn()
    used()
  })

  /* ---------- Share ---------- */
  const saveSheet = $('#saveSheet')
  const saveImg = $('#saveImg')
  const saveDl = $('#saveDownload')
  let saveUrl = ''
  const closeSave = () => closeSheet(saveSheet)
  $('#saveClose').addEventListener('click', closeSave)
  trap(saveSheet, closeSave)

  // the way out when the phone cannot share a picture: show it big, with a Download button
  function openSave(file) {
    if (saveUrl) URL.revokeObjectURL(saveUrl)
    saveUrl = URL.createObjectURL(file)
    saveImg.src = saveUrl
    saveImg.alt = canvas.getAttribute('aria-label') || ''
    saveDl.href = saveUrl
    saveDl.setAttribute('download', file.name || fileName())
    openSheet(saveSheet, $('#saveClose'))
  }

  const pageUrl = () => (P.siteUrl ? P.siteUrl + '/' : location.origin + location.pathname)
  let sharing = false
  shareBtn.addEventListener('click', () => {
    if (sharing) return
    sfx.unlock()
    buzz(10)
    // everything from here to navigator.share() is synchronous: the tap is still "fresh"
    const file = ready.ver === ver && ready.file ? ready.file : fileNow()
    if (!file) return
    used()
    let can = false
    try {
      can = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] }))
    } catch {}
    if (!can) {
      openSave(file)
      return
    }
    sharing = true
    shareV.textContent = C.sharing
    const done = () => {
      sharing = false
      shareV.textContent = fill(C.share, T)
    }
    const failsafe = setTimeout(done, 30000)
    let asked
    try {
      asked = navigator.share({ files: [file], title: fill(C.shareTitle, T), text: `${fill(C.shareText, T)} ${pageUrl()}` })
    } catch (err) {
      asked = Promise.reject(err) // a share() that throws instead of rejecting is handled the same way
    }
    asked
      .then(() => {
        sfx.stamp()
        buzz([20, 40, 20])
      })
      .catch((err) => {
        // closing the share sheet is an AbortError and is fine. anything else: show the poster to save by hand
        if (!err || (err.name !== 'AbortError' && err.name !== 'InvalidStateError')) openSave(file)
      })
      .finally(() => {
        clearTimeout(failsafe)
        done()
      })
  })

  /* ---------- the arrow to the next scene, and the hint ---------- */
  let usedOnce = false
  function used() {
    if (usedOnce) return
    usedOnce = true
    scene.classList.add('is-used')
    $('.next', scene)?.classList.add('is-ready')
  }

  /* ---------- go ---------- */
  render()
  // the type is already loaded by the time the page opens, but a canvas is not told when that changes: draw again once sure
  loadFonts().then(render)

  return {
    // called the first time the scene is on screen
    enter() {
      printIn()
      setTimeout(used, 7000)
    },
  }
}
