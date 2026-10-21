/*
  The little line drawings on the Collection cards.
  Each one is drawn on a 96 x 96 grid with plain strokes (no fills, no emoji).
  Anything with class="acc" is drawn in the red stamp ink: the flame, the crack, the one funny detail.
  copy.js says which drawing a card uses (art: `lighter`).

  Anything with class="act" is hidden until the drawing is tapped. Its little animation lives in collection-act.js,
  which finds these parts by their class names (a-phone, lvl, bar ...), so keep the two files in step.
*/
const ART = {
  // head and shoulders, a squint, a cigarette. tapped, he picks up the phone
  man: `
    <circle cx="42" cy="33" r="15"/>
    <path d="M10 91c0-20 13-31 32-31s32 11 32 31"/>
    <path d="M34 31h5M46 31h5"/>
    <path d="M51 42h5"/>
    <path d="M56 42l22-6"/>
    <path class="acc" d="M78 36l4-1"/>
    <path class="acc smoke" d="M85 30c-5-5 4-8-1-13c-3-4 2-7 0-11"/>
    <g class="act a-phone"><rect x="15" y="21" width="11" height="22" rx="2.5" transform="rotate(-8 20 32)"/><path d="M18 25h5" transform="rotate(-8 20 32)"/></g>
    <path class="act a-ring acc" d="M11 25c-3 5-3 11 0 16"/>
    <path class="act a-ring2 acc" d="M6 21c-5 8-5 18 0 26"/>`,

  // a plain disposable lighter, flame up. tapped, it throws a few sparks
  lighter: `
    <rect x="30" y="40" width="30" height="50" rx="5"/>
    <path d="M30 54h30"/>
    <path d="M34 40v-8h22v8"/>
    <circle cx="45" cy="26" r="4.5"/>
    <path d="M36 66h18M36 74h11"/>
    <path class="acc flame" d="M45 21c-7-6-2-11 0-16c5 5 7 11 0 16z"/>
    <path class="act a-sparks acc" d="M33 13l-5-4M57 13l5-4M30 21h-6M60 21h6M37 6l-3-4M53 6l3-4"/>`,

  // a phone with a long crack. tapped, the crack spreads
  phone: `
    <rect x="27" y="6" width="42" height="84" rx="7"/>
    <path d="M43 12h10"/>
    <circle cx="48" cy="82" r="2"/>
    <path class="acc" d="M69 20L56 38l8 5-14 19 6 4-14 18"/>
    <path class="acc" d="M56 38L41 34M50 62l-12-3"/>
    <path class="act a-crack acc" d="M56 38l-3-14M64 43l5 11M50 62l9 6M44 66l-2 10M41 34l-8-4"/>`,

  // a plain bottle with a cap, half full of ash and butts. no label, no lettering. tapped, another butt drops in
  bottle: `
    <path d="M43 12v9c0 8-14 12-14 24v35c0 6 5 9 19 9s19-3 19-9V45c0-12-14-16-14-24v-9"/>
    <path d="M41 12h14V6H41z"/>
    <path class="lvl" d="M29 66c6-3 12 3 19 0s13-3 19 0"/>
    <path d="M35 74l10-4M50 78l11-4M37 82l7 1"/>
    <g class="act a-butt"><path d="M48 14v9"/><path class="acc" d="M48 23v3"/></g>`,

  // a tumbler, one ice cube, ml marks. tapped, it drains and fills again
  glass: `
    <path d="M22 18l6 68h36l6-68z"/>
    <g class="lvl"><path d="M25 42h43"/><path class="acc" d="M25 42h43"/></g>
    <g class="ice"><rect x="36" y="50" width="14" height="14" rx="2" transform="rotate(12 43 57)"/><rect x="49" y="64" width="11" height="11" rx="2" transform="rotate(-10 54 70)"/></g>
    <path d="M80 24h6M80 36h10M80 48h6M80 60h10M80 72h6"/>`,

  // a thermal receipt with a torn edge. tapped, another one prints
  cab: `
    <g class="rcpt">
      <path d="M24 6h48v80l-6 5-6-5-6 5-6-5-6 5-6-5-6 5-6-5z"/>
      <path class="ln" pathLength="1" d="M32 18h32M32 26h22M32 34h32"/>
      <path d="M32 50h32"/>
      <path class="ln" pathLength="1" d="M32 60v12M36 60v12M40 60v12M45 60v12M48 60v12M54 60v12M57 60v12M62 60v12"/>
      <path class="acc ln" pathLength="1" d="M32 43h18"/>
    </g>`,

  // a voice note: speech bubble, play, waveform. tapped, it plays
  voice: `
    <path d="M10 26h76a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H36L22 80V64H10a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z"/>
    <path class="play" d="M14 36v16l13-8z"/>
    <path class="bar" d="M36 40v10"/><path class="bar" d="M42 36v18"/><path class="bar" d="M48 41v8"/><path class="bar" d="M54 33v24"/>
    <path class="bar" d="M60 38v14"/><path class="bar" d="M66 43v6"/><path class="bar" d="M72 36v18"/><path class="bar" d="M78 41v8"/>
    <path class="acc bar" d="M54 33v24"/>`,

  // a notice pinned up, with tear-off tabs. tapped, it is FULL
  course: `
    <rect x="18" y="10" width="60" height="80"/>
    <circle class="acc" cx="48" cy="17" r="3"/>
    <rect x="26" y="26" width="44" height="14"/>
    <path d="M26 48h44M26 55h44M26 62h28"/>
    <path d="M18 70h60"/>
    <path d="M30 70v20M42 70v20M54 70v20M66 70v20"/>
    <g class="act a-full"><g transform="rotate(-11 48 56)"><rect class="acc" x="20" y="44" width="56" height="24" rx="2"/><text class="acc" x="48" y="62" text-anchor="middle" font-size="21">FULL</text></g></g>`,

  // the empty frame where the missing cake's picture should be. tapped, the dashes go round, looking
  missing: `
    <rect class="frame" x="12" y="12" width="72" height="72" rx="4" stroke-dasharray="5 5"/>`,
}

export function artSvg(name) {
  const body = ART[name] || ''
  return `<svg class="obj__art" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
}
