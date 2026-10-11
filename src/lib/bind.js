import { copy } from '../copy.js'
import { fill } from './party.js'

// copy.hero.hello -> the string at that path in copy.js
export const lookup = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), copy)

/*
  Any element with data-copy="hero.hello" gets that line from copy.js, with {tokens} filled in.
  Keeps every word out of the HTML, so copy.js really is the one place to edit them.
*/
export function bindCopy(root, T) {
  root.querySelectorAll('[data-copy]').forEach((el) => {
    const v = lookup(el.dataset.copy)
    if (typeof v === 'string') el.textContent = fill(v, T)
  })
  root.querySelectorAll('[data-copy-label]').forEach((el) => {
    const v = lookup(el.dataset.copyLabel)
    if (typeof v === 'string') el.setAttribute('aria-label', fill(v, T))
  })
}
