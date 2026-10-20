/*
  The little line drawings on the Collection cards.
  Each one is drawn on a 96 x 96 grid with plain strokes (no fills, no emoji).
  Anything with class="acc" is drawn in the red stamp ink: the flame, the crack, the one funny detail.
  copy.js says which drawing a card uses (art: `lighter`).
*/
const ART = {
  // head and shoulders, a squint, a cigarette
  man: `
    <circle cx="42" cy="33" r="15"/>
    <path d="M10 91c0-20 13-31 32-31s32 11 32 31"/>
    <path d="M34 31h5M46 31h5"/>
    <path d="M51 42h5"/>
    <path d="M56 42l22-6"/>
    <path class="acc" d="M78 36l4-1"/>
    <path class="acc" d="M85 30c-5-5 4-8-1-13c-3-4 2-7 0-11"/>`,

  // a plain disposable lighter, flame up
  lighter: `
    <rect x="30" y="40" width="30" height="50" rx="5"/>
    <path d="M30 54h30"/>
    <path d="M34 40v-8h22v8"/>
    <circle cx="45" cy="26" r="4.5"/>
    <path d="M36 66h18M36 74h11"/>
    <path class="acc" d="M45 21c-7-6-2-11 0-16c5 5 7 11 0 16z"/>`,

  // a phone with a long crack
  phone: `
    <rect x="27" y="6" width="42" height="84" rx="7"/>
    <path d="M43 12h10"/>
    <circle cx="48" cy="82" r="2"/>
    <path class="acc" d="M69 20L56 38l8 5-14 19 6 4-14 18"/>
    <path class="acc" d="M56 38L41 34M50 62l-12-3"/>`,

  // a dish, butts, smoke
  ashtray: `
    <ellipse cx="48" cy="56" rx="38" ry="13"/>
    <ellipse cx="48" cy="54" rx="29" ry="8.5"/>
    <path d="M10 56v10c0 8 17 14 38 14s38-6 38-14V56"/>
    <path d="M28 54l18-7M42 58l24-6M56 50l14 3"/>
    <path class="acc" d="M67 44c-4-5 3-8 0-13c-2-3 1-6 0-9"/>`,

  // a tumbler, one ice cube, ml marks
  glass: `
    <path d="M22 18l6 68h36l6-68z"/>
    <path d="M25 42h43"/>
    <rect x="36" y="50" width="14" height="14" rx="2" transform="rotate(12 43 57)"/>
    <rect x="49" y="64" width="11" height="11" rx="2" transform="rotate(-10 54 70)"/>
    <path d="M80 24h6M80 36h10M80 48h6M80 60h10M80 72h6"/>
    <path class="acc" d="M25 42h43"/>`,

  // a thermal receipt with a torn edge
  cab: `
    <path d="M24 6h48v80l-6 5-6-5-6 5-6-5-6 5-6-5-6 5-6-5z"/>
    <path d="M32 18h32M32 26h22M32 34h32"/>
    <path d="M32 50h32"/>
    <path d="M32 60v12M36 60v12M40 60v12M45 60v12M48 60v12M54 60v12M57 60v12M62 60v12"/>
    <path class="acc" d="M32 43h18"/>`,

  // a voice note: speech bubble, play, waveform
  voice: `
    <path d="M10 26h76a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H36L22 80V64H10a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z"/>
    <path d="M14 36v16l13-8z"/>
    <path d="M36 40v10M42 36v18M48 41v8M54 33v24M60 38v14M66 43v6M72 36v18M78 41v8"/>
    <path class="acc" d="M54 33v24"/>`,

  // a notice pinned up, with tear-off tabs
  course: `
    <rect x="18" y="10" width="60" height="80"/>
    <circle class="acc" cx="48" cy="17" r="3"/>
    <rect x="26" y="26" width="44" height="14"/>
    <path d="M26 48h44M26 55h44M26 62h28"/>
    <path d="M18 70h60"/>
    <path d="M30 70v20M42 70v20M54 70v20M66 70v20"/>`,
}

export function artSvg(name) {
  const body = ART[name] || ''
  return `<svg class="obj__art" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
}
