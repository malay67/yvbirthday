/*
  The page after the party.

  copy.js has an `after` block: the lines that change once the party is over. main.js asks the clock at start-up,
  and if the party has ended it calls useAfter(copy). That lays the block over the normal lines, so everything that
  reads copy.js (the scenes, the search, the WhatsApp message) says the after version without knowing anything about it.
  Before the end of the party nothing is touched, and the build (page title, preview card, calendar file) never calls this.

  How a line in `after` is laid over the one with the same name:
    - a plain value replaces it
    - an object is laid over the object with the same name, key by key
    - for a list, an object works like a set of patches: each key is an `id` (a room, an object) or a position in the list
      (0 is the first), and its value is laid over that item. A list written as a list replaces the whole list.
*/
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function lay(base, over, path) {
  for (const key of Object.keys(over)) {
    const o = over[key]
    const b = base[key]
    const here = `${path}.${key}`
    if (Array.isArray(b) && plain(o)) {
      for (const k of Object.keys(o)) {
        let i = b.findIndex((item) => plain(item) && item.id === k)
        if (i < 0 && /^\d+$/.test(k) && +k < b.length) i = +k
        if (i < 0) {
          console.warn('[after] nothing to change at', `${here}.${k}`)
          continue
        }
        if (plain(b[i]) && plain(o[k])) lay(b[i], o[k], `${here}.${k}`)
        else b[i] = o[k]
      }
    } else if (plain(b) && plain(o)) {
      lay(b, o, here)
    } else {
      base[key] = o
    }
  }
}

export function useAfter(copy) {
  if (copy && copy.after) lay(copy, copy.after, 'copy')
}
