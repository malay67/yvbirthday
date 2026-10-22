/*
  "Borrowed lighter": the very first strong flick of the wheel, on a phone that has never seen the intro, does not light it.
  This remembers that it already happened, on this phone (localStorage), so it is once per device and never again.
  The end card's "Light it again" marks it too, so starting over never plays the joke.
  localStorage can throw (private tabs, some in-app browsers): then it is remembered until the page is closed, and no longer.
*/
const KEY = 'yuv-borrowed'
let mem = false

export function hasBorrowed() {
  if (mem) return true
  try {
    return !!localStorage.getItem(KEY)
  } catch {
    return false
  }
}

export function markBorrowed() {
  mem = true
  try {
    localStorage.setItem(KEY, '1')
  } catch {}
}
