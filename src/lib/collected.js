import { copy } from '../copy.js'
import { fill } from './party.js'

/*
  What the guest has collected from the Yuvraj Collection.
  Saved on the phone (localStorage) so a reload, or "Light it again", keeps it.
  localStorage can throw (private tabs, some in-app browsers), so every touch of it is inside try/catch.
  If it fails, collecting still works until the page is closed.
*/
const KEY = 'yuv-collected'
const known = copy.collection.objects.map((o) => o.id)
const subs = new Set()

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((id) => known.includes(id)) : []
  } catch {
    return []
  }
}

let have = new Set(read())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...have]))
  } catch {}
}

const emit = () => subs.forEach((fn) => fn())

export const collected = {
  has: (id) => have.has(id),
  count: () => have.size,
  total: () => known.length,
  // ids in the order of the cards, not the order they were tapped
  list: () => known.filter((id) => have.has(id)),
  // returns true if it is now collected
  toggle(id) {
    if (!known.includes(id)) return false
    if (have.has(id)) have.delete(id)
    else have.add(id)
    save()
    emit()
    return have.has(id)
  },
  subscribe(fn) {
    subs.add(fn)
    return () => subs.delete(fn)
  },
}

/*
  The one extra line in the WhatsApp message: "Collected: the lighter (not his), the 3 AM phone."
  Three names at most, then "+N more", so the whole message stays short.
*/
export function collectedLine(T) {
  const ids = collected.list()
  if (!ids.length) return ''
  const names = copy.collection.objects.filter((o) => ids.includes(o.id)).map((o) => fill(o.short, T))
  const shown = names.slice(0, 3)
  const more = names.length - shown.length
  const list = shown.join(', ') + (more > 0 ? ' ' + fill(copy.whatsapp.more, { n: more }) : '')
  return fill(copy.whatsapp.collected, { list })
}
