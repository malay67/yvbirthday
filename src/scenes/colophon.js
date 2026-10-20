import { copy } from '../copy.js'
import { openSheet, closeSheet, trapSheet } from '../ui/sheet.js'

const $ = (s, r = document) => r.querySelector(s)
const make = (tag, cls, text) => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text != null) e.textContent = text
  return e
}

/*
  "Fonts in use": who made the type on this page. A small link on the last screen opens it, and so does the search.
  One bone-paper label per typeface, the name set in the typeface itself. The words are in copy.colophon.
*/
export function initColophon() {
  const C = copy.colophon
  const sheet = $('#coloSheet')
  const list = $('#coloList')
  if (!sheet || !list) return { open() {} }

  for (const f of C.fonts) {
    const item = make('li', 'colo__item')
    item.append(make('h3', `colo__name colo__name--${f.face || 'display'}`, f.family))
    const dl = make('dl', 'obj__meta')
    for (const [k, v] of f.rows || []) {
      const row = make('div')
      row.append(make('dt', null, k), make('dd', null, v))
      dl.append(row)
    }
    item.append(dl)
    list.append(item)
  }

  const close = () => closeSheet(sheet)
  $('#coloClose').addEventListener('click', close)
  $('#coloDone').addEventListener('click', close)
  trapSheet(sheet, close)

  return {
    // returnTo: where the focus goes when it closes (default: whatever opened it)
    open(returnTo) {
      openSheet(sheet, $('#coloClose'), returnTo)
      sheet.scrollTop = 0
    },
  }
}
