/*
  Full-screen sheets: the typing sheet and the save sheet in the Print Room, the archive search, the font credits.

  A sheet fills the screen and keeps its fields at the top. A phone's keyboard shrinks the visible part of the page
  from the bottom, so nothing the guest needs is ever under it. (visualViewport tells us where the visible part is,
  because on some phones a fixed box does not follow it by itself.)

  While a sheet is open: the page behind it cannot scroll, be tabbed to or be tapped (html.is-sheet, and `inert` on
  #main and #bar), Escape closes it, Tab stays inside it, and focus goes back to where it came from.
*/
const $ = (s, r = document) => r.querySelector(s)

const vv = window.visualViewport
const open = new Set()
let lastFocus = null

const syncVV = () => {
  if (!vv) return
  open.forEach((el) => {
    el.style.setProperty('--vvh', Math.round(vv.height) + 'px')
    el.style.setProperty('--vvt', Math.round(vv.offsetTop) + 'px')
  })
}
if (vv) {
  vv.addEventListener('resize', syncVV)
  vv.addEventListener('scroll', syncVV)
}

const lock = (on) => {
  document.documentElement.classList.toggle('is-sheet', on)
  // nothing behind a sheet can be tabbed to or tapped
  for (const el of [$('#main'), $('#bar')]) if (el) el.inert = on
}

/*
  Opens a sheet and puts the focus in it. Call this from inside a tap: iPhone only raises the keyboard for a focus()
  that happens in the gesture.
    focusEl   what gets the focus (and, for a text field, its text selected)
    returnTo  where the focus goes when the sheet closes. Default: whatever had it when the sheet opened.
*/
export function openSheet(el, focusEl, returnTo) {
  lastFocus = returnTo || document.activeElement
  open.add(el)
  el.hidden = false
  lock(true)
  syncVV()
  if (focusEl) {
    focusEl.focus({ preventScroll: true })
    if (focusEl.select) focusEl.select()
  }
}

// restore: false when the caller is about to move the focus somewhere else itself
export function closeSheet(el, { restore = true } = {}) {
  el.hidden = true
  open.delete(el)
  el.style.removeProperty('--vvh')
  el.style.removeProperty('--vvt')
  if (!open.size) lock(false)
  if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true })
}

// Escape closes, Tab stays inside
export function trapSheet(el, close) {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key !== 'Tab') return
    const f = Array.from(el.querySelectorAll('input,button,a[href]')).filter((x) => !x.disabled && !x.hidden && x.offsetParent !== null)
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  })
}
