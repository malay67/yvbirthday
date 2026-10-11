import { copy } from '../copy.js'
import { fill } from '../lib/party.js'

/*
  The sound button in the top bar.
  On small screens it is just the little equaliser icon (the words are still there for screen readers).
*/
export function initSound(sfx, T) {
  const btn = document.querySelector('#soundBtn')
  const txt = document.querySelector('#soundTxt')
  const paint = () => {
    btn.setAttribute('aria-pressed', String(sfx.enabled))
    txt.textContent = fill(sfx.enabled ? copy.bar.soundOn : copy.bar.soundOff, T)
  }
  paint()
  btn.addEventListener('click', () => {
    sfx.unlock()
    sfx.setEnabled(!sfx.enabled)
    paint()
    if (sfx.enabled) sfx.tick(1)
  })
}
