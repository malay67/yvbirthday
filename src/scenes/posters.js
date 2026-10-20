/*
  The three posters of the Print Room, drawn on a canvas, 1080 x 1350 (4:5, what Instagram and WhatsApp like).

    subway   a black enamel sign: an amber line bullet, white type, an arrow to the place
    swiss    bone paper, a big ember circle, flush-left type on a grid, a row of facts
    scan     a photocopy that went through a scanner crooked: halftone, toner dust, a label-maker tape

  Each one gets the same small bag of facts and draws it its own way:
    c = { line, lineUp, initial, name, NAME, title, date, dateLong, dots, time, place, no, host, by, byLine }
  Nothing here knows a name, a date or a venue. It is all handed in from party.config.js and copy.js.
  The colours are the room's own, copied as plain values (a canvas cannot read CSS variables).
  The type is the room's own too: League Gothic, Instrument Serif, DM Mono. No other font.
*/

export const W = 1080
export const H = 1350

const BLACK = '#0a0807'
const BONE = '#ece3d3'
const ASH = '#a39a8d'
const AMBER = '#e9a23b'
const AMBER_HI = '#f7c36f'
const EMBER = '#ff6a2b'
const PAPER = '#e8dec9'
const INK = '#14100d'

const FAM = {
  display: '"League Gothic","Arial Narrow",Impact,sans-serif',
  serif: '"Instrument Serif",Georgia,"Times New Roman",serif',
  mono: '"DM Mono",ui-monospace,Menlo,Consolas,monospace',
}
const f = (fam, size, { weight = 400, italic = false } = {}) => `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px ${FAM[fam]}`

/* the canvas draws with whatever type is loaded RIGHT NOW, so make sure it is */
export function loadFonts() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve()
  const loads = Promise.all([
    document.fonts.load(f('display', 100)),
    document.fonts.load(f('serif', 60)),
    document.fonts.load(f('serif', 60, { italic: true })),
    document.fonts.load(f('mono', 30)),
    document.fonts.load(f('mono', 30, { weight: 500 })),
  ])
  // never hold the page hostage to the type
  return Promise.race([loads, new Promise((r) => setTimeout(r, 3000))]).catch(() => {})
}

/* ---------- small tools ---------- */

// a seeded random number generator, so the same poster always has the same dust on it
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const capOf = (ctx) => {
  const m = ctx.measureText('H')
  return m.actualBoundingBoxAscent || m.width
}

// text split into lines no wider than maxW (a word wider than that stays whole, hardBreak deals with it)
function wrapWords(ctx, text, maxW) {
  const words = text.split(' ').filter(Boolean)
  const lines = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (!cur || ctx.measureText(t).width <= maxW) cur = t
    else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// last resort for a single long word: break it between letters
function hardBreak(ctx, lines, maxW) {
  const out = []
  for (const l of lines) {
    if (ctx.measureText(l).width <= maxW) {
      out.push(l)
      continue
    }
    let cur = ''
    for (const ch of l) {
      if (cur && ctx.measureText(cur + ch).width > maxW) {
        out.push(cur)
        cur = ch
      } else cur += ch
    }
    if (cur) out.push(cur)
  }
  return out
}

/*
  The biggest type that fits the box. Tries sizes from `max` down to `min` in steps of 4.
  Returns the size and the lines. The height counts from the top of the capitals to the last baseline.
*/
function fitBlock(ctx, text, { fam = 'display', weight = 400, italic = false, maxW, maxH, max, min, lh = 0.9 }) {
  for (let s = max; s >= min; s -= 4) {
    ctx.font = f(fam, s, { weight, italic })
    const lines = wrapWords(ctx, text, maxW)
    if (!lines.every((l) => ctx.measureText(l).width <= maxW)) continue
    if (capOf(ctx) + (lines.length - 1) * s * lh <= maxH) return { size: s, lines, lh, fam, weight, italic }
  }
  ctx.font = f(fam, min, { weight, italic })
  return { size: min, lines: hardBreak(ctx, wrapWords(ctx, text, maxW), maxW), lh, fam, weight, italic }
}

// draws a block from fitBlock with the top of its capitals at y. returns the height it used.
function drawBlock(ctx, b, x, y, dx = 0, dy = 0) {
  ctx.font = f(b.fam, b.size, { weight: b.weight, italic: b.italic })
  const cap = capOf(ctx)
  b.lines.forEach((l, i) => {
    ctx.fillText(l, x + dx, y + cap + i * b.size * b.lh + dy)
  })
  return cap + (b.lines.length - 1) * b.size * b.lh
}

// letter-spaced text without ctx.letterSpacing (older Safari does not have it). returns the width.
function trackedWidth(ctx, text, track) {
  let w = 0
  const chars = [...text]
  for (const ch of chars) w += ctx.measureText(ch).width
  return w + track * Math.max(0, chars.length - 1)
}
function tracked(ctx, text, x, y, track, align = 'left') {
  const chars = [...text]
  const total = trackedWidth(ctx, text, track)
  let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x
  ctx.textAlign = 'left'
  for (const ch of chars) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + track
  }
  return total
}
// the same, shrunk until it fits maxW
function trackedFit(ctx, text, x, y, maxW, size, track, opt, align = 'left') {
  let s = size
  for (; s > 16; s -= 1) {
    ctx.font = f('mono', s, opt)
    if (trackedWidth(ctx, text, track * (s / size)) <= maxW) break
  }
  return tracked(ctx, text, x, y, track * (s / size), align)
}
// one line of display type, shrunk until it fits maxW
function lineFit(ctx, text, maxW, size, min = 40) {
  let s = size
  for (; s > min; s -= 2) {
    ctx.font = f('display', s)
    if (ctx.measureText(text).width <= maxW) break
  }
  ctx.font = f('display', s)
  return s
}

/* film grain: one small tile of grey noise, made once, laid over the poster as a pattern */
let tile = null
function grainTile() {
  if (tile) return tile
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  const img = g.createImageData(s, s)
  const r = rng(9137)
  for (let i = 0; i < img.data.length; i += 4) {
    // eight grey levels, not 160: it looks the same once it is laid over at low alpha, and the PNG comes out far smaller
    const v = 96 + Math.floor(r() * 8) * 22
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  tile = c
  return c
}
function grain(ctx, alpha, mode = 'multiply', x = 0, y = 0, w = W, h = H) {
  const pat = ctx.createPattern(grainTile(), 'repeat')
  // the tile is blown up 2x: coarser grain looks more like film, and it compresses better as a PNG
  if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(2))
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = mode
  ctx.fillStyle = pat
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

// skip(x, y, rad): return true to drop that dot. Dots are dropped whole, never cut.
function halftone(ctx, cx, cy, R, pitch, angle, skip) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const n = Math.ceil(R / pitch) + 2
  ctx.beginPath()
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const ux = i * pitch
      const uy = j * pitch
      const x = cx + ux * cos - uy * sin
      const y = cy + ux * sin + uy * cos
      const d = Math.hypot(x - cx, y - cy)
      if (d > R) continue
      // big dots in the middle, none at the rim; a little more weight on the left, like light from the right
      const t = Math.max(0, 1 - d / R) * (0.82 + 0.18 * (1 - (x - cx) / R))
      const rad = pitch * 0.56 * Math.pow(t, 0.62)
      if (rad < 0.9) continue
      if (skip && skip(x, y, rad)) continue
      ctx.moveTo(x + rad, y)
      ctx.arc(x, y, rad, 0, Math.PI * 2)
    }
  }
  ctx.fill()
}

/* ============================================================
   SUBWAY
   ============================================================ */
function subway(ctx, c) {
  const M = 84
  ctx.fillStyle = BLACK
  ctx.fillRect(0, 0, W, H)
  // a thin frame, like the edge of an enamel sign
  ctx.strokeStyle = BONE
  ctx.lineWidth = 4
  ctx.strokeRect(34, 34, W - 68, H - 68)

  // the line bullet: his initial, in an amber circle
  const R = 68
  const bx = M + R
  const by = 192
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(bx, by, R, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = BLACK
  ctx.textAlign = 'center'
  ctx.font = f('display', 120)
  ctx.fillText(c.initial, bx, by + capOf(ctx) / 2)

  // who, and when
  const tx = bx + R + 38
  ctx.textAlign = 'left'
  ctx.fillStyle = BONE
  trackedFit(ctx, c.title.toUpperCase(), tx, by - 6, W - M - tx, 34, 5, { weight: 500 })
  ctx.fillStyle = ASH
  trackedFit(ctx, `${c.date} · ${c.time}`.toUpperCase(), tx, by + 42, W - M - tx, 30, 4)

  // the rule under the header
  ctx.fillStyle = BONE
  ctx.fillRect(M, 306, W - 2 * M, 5)

  // the line, as big as it can go
  const box = { x: M, y: 376, w: W - 2 * M, h: 640 }
  const b = fitBlock(ctx, c.line.toUpperCase(), { maxW: box.w, maxH: box.h, max: 560, min: 110, lh: 0.9 })
  ctx.fillStyle = BONE
  drawBlock(ctx, b, box.x, box.y)

  // an arrow to the place, like a sign that points the way
  const ay = 1100
  ctx.fillStyle = AMBER
  ctx.fillRect(M, ay - 9, 108, 18)
  ctx.beginPath()
  ctx.moveTo(M + 90, ay - 42)
  ctx.lineTo(M + 150, ay)
  ctx.lineTo(M + 90, ay + 42)
  ctx.closePath()
  ctx.fill()
  lineFit(ctx, c.place.toUpperCase(), W - M - (M + 196), 98, 52)
  ctx.fillStyle = BONE
  ctx.textAlign = 'left'
  ctx.fillText(c.place.toUpperCase(), M + 196, ay + capOf(ctx) / 2)

  // the small print
  ctx.fillStyle = 'rgba(236,227,211,.5)'
  ctx.fillRect(M, 1196, W - 2 * M, 2)
  ctx.fillStyle = ASH
  ctx.font = f('mono', 27)
  const left = (c.byLine || `No. ${c.no}`).toUpperCase()
  const w = trackedFit(ctx, left, M, 1256, (W - 2 * M) * 0.55, 27, 3)
  ctx.font = f('mono', 27)
  trackedFit(ctx, c.host, W - M, 1256, W - 2 * M - w - 40, 27, 1.5, {}, 'right')
}

/* ============================================================
   SWISS
   ============================================================ */
function swiss(ctx, c) {
  const M = 72
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // the ember: a big circle that runs off the edge, as a lit cigarette end would.
  // it sits right on the rule above the facts (its bottom is at FACTS_Y)
  const FACTS_Y = 1108
  ctx.fillStyle = EMBER
  ctx.beginPath()
  ctx.arc(W - 236, FACTS_Y - 336, 336, 0, Math.PI * 2)
  ctx.fill()

  // the grid: a heavy rule on top, hairlines for the facts
  ctx.fillStyle = INK
  ctx.fillRect(M, 100, W - 2 * M, 8)
  ctx.textAlign = 'left'
  ctx.font = f('mono', 26, { weight: 500 })
  tracked(ctx, `${c.NAME} / ${c.dots}`, M, 156, 5)
  tracked(ctx, `NO. ${c.no}`, W - M, 156, 5, 'right')

  // the line, flush left, in ink. it runs over the circle (multiply), so the two read as one print
  const b = fitBlock(ctx, c.line.toUpperCase(), { maxW: 720, maxH: 560, max: 520, min: 100, lh: 0.88 })
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = INK
  drawBlock(ctx, b, M, 214)
  ctx.restore()

  // the facts: date, time, place, in three columns
  const y0 = FACTS_Y
  ctx.fillStyle = INK
  ctx.fillRect(M, y0, W - 2 * M, 4)
  const inner = W - 2 * M
  const cols = [
    { k: 'DATE', v: c.date, w: inner * 0.34 },
    { k: 'TIME', v: c.time, w: inner * 0.2 },
    { k: 'PLACE', v: c.place, w: inner * 0.46 },
  ]
  let x = M
  for (const col of cols) {
    ctx.fillStyle = 'rgba(20,16,13,.62)'
    ctx.font = f('mono', 22)
    tracked(ctx, col.k, x, y0 + 50, 5)
    ctx.fillStyle = INK
    lineFit(ctx, col.v.toUpperCase(), col.w - 24, 78, 36)
    ctx.textAlign = 'left'
    ctx.fillText(col.v.toUpperCase(), x, y0 + 50 + 20 + capOf(ctx))
    x += col.w
  }

  // the small print
  ctx.fillStyle = 'rgba(20,16,13,.7)'
  ctx.font = f('mono', 24)
  const left = (c.byLine || c.title).toUpperCase()
  const w = trackedFit(ctx, left, M, 1298, inner * 0.56, 24, 3)
  ctx.font = f('mono', 24)
  trackedFit(ctx, c.host, W - M, 1298, inner - w - 40, 24, 1.5, {}, 'right')

  // crop marks in the corners: it is, after all, a print
  ctx.fillStyle = INK
  const m = 30
  const L = 26
  for (const [x1, y1, sx, sy] of [
    [m, m, 1, 1],
    [W - m, m, -1, 1],
    [m, H - m, 1, -1],
    [W - m, H - m, -1, -1],
  ]) {
    ctx.fillRect(Math.min(x1, x1 + sx * L), y1 - 1, L, 2)
    ctx.fillRect(x1 - 1, Math.min(y1, y1 + sy * L), 2, L)
  }

  grain(ctx, 0.12)
}

/* ============================================================
   SCAN
   ============================================================ */
function tape(ctx, text, x, y, size, rot) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.font = f('mono', size, { weight: 500 })
  const tw = trackedWidth(ctx, text, 4)
  const pad = 22
  const h = size * 1.95
  ctx.fillStyle = '#100d0a'
  ctx.fillRect(0, -h * 0.7, tw + pad * 2, h)
  ctx.fillStyle = '#efe7d6'
  tracked(ctx, text, pad, 0, 4)
  ctx.restore()
  return tw + pad * 2
}

function scan(ctx, c) {
  const r = rng(hash(`${c.line}|${c.by}|${c.host}`))

  // the scanner bed
  ctx.fillStyle = '#0c0a08'
  ctx.fillRect(0, 0, W, H)

  // the sheet went in crooked
  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.rotate(-0.0105)
  ctx.translate(-W / 2, -H / 2)
  const px = 16
  const py = 14
  const pw = W - 32
  const ph = H - 28
  ctx.fillStyle = '#e1d7c1'
  ctx.fillRect(px, py, pw, ph)

  ctx.save()
  ctx.beginPath()
  ctx.rect(px, py, pw, ph)
  ctx.clip()

  // paper fibre, and uneven light across the glass
  grain(ctx, 0.3, 'multiply', px, py, pw, ph)
  const lg = ctx.createLinearGradient(0, 0, W, H)
  lg.addColorStop(0, 'rgba(255,250,236,.3)')
  lg.addColorStop(0.5, 'rgba(255,250,236,0)')
  lg.addColorStop(1, 'rgba(70,46,20,.24)')
  ctx.fillStyle = lg
  ctx.fillRect(px, py, pw, ph)

  // the line, as big as it can go
  const b = fitBlock(ctx, c.line.toUpperCase(), { maxW: 900, maxH: 560, max: 520, min: 100, lh: 0.88 })

  // a halftone sun, in toner. No dot may touch the type (dots and letters in the same black melt
  // together): any dot that would is dropped, whole. Cutting a gap round the type instead slices
  // the dots in half and leaves a dashed outline. A half-size mask of the type, its ember plate
  // included, says where the letters are.
  const mw = W >> 1
  const mh = H >> 1
  const mask = document.createElement('canvas')
  mask.width = mw
  mask.height = mh
  const mc = mask.getContext('2d', { willReadFrequently: true })
  mc.scale(0.5, 0.5)
  mc.fillStyle = '#000'
  drawBlock(mc, b, 82, 214)
  drawBlock(mc, b, 82, 214, 9, 8)
  let ink = null
  try {
    ink = mc.getImageData(0, 0, mw, mh).data
  } catch {
    // a browser that will not let a page read its own canvas: the dots stay, the type still prints over them
  }
  mask.width = mask.height = 1 // give the memory back, Safari is stingy with canvases
  const hit = (qx, qy) => {
    const ix = Math.round(qx / 2)
    const iy = Math.round(qy / 2)
    return ix >= 0 && iy >= 0 && ix < mw && iy < mh && ink[(iy * mw + ix) * 4 + 3] > 24
  }
  const GAP = 12 // paper left bare between a dot and a letter
  const touchesType = (x, y, rad) => {
    if (!ink) return false
    if (hit(x, y)) return true
    const rr = rad + GAP
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8
      if (hit(x + Math.cos(a) * rr, y + Math.sin(a) * rr)) return true
    }
    return false
  }
  ctx.fillStyle = 'rgba(18,13,9,.92)'
  halftone(ctx, 800, 560, 300, 24, 0.28, touchesType)

  // the line: black toner with the ember plate printed slightly off
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = EMBER
  drawBlock(ctx, b, 82, 214, 9, 8)
  ctx.restore()
  ctx.save()
  ctx.fillStyle = '#15100c'
  ctx.shadowColor = 'rgba(20,14,8,.55)'
  ctx.shadowBlur = 3
  drawBlock(ctx, b, 82, 214)
  ctx.restore()

  // a label-maker tape with the title
  tape(ctx, c.title.toUpperCase(), 78, 150, 25, -0.018)

  // the facts, as if typed
  ctx.fillStyle = 'rgba(21,16,12,.92)'
  ctx.textAlign = 'left'
  ctx.font = f('serif', 66, { italic: true })
  ctx.fillText(`${c.dateLong}, ${c.time}.`, 84, 982)
  ctx.font = f('serif', 66)
  const pl = lineFit(ctx, c.place, pw - 168, 66, 34)
  ctx.font = f('serif', pl)
  ctx.fillText(c.place + '.', 84, 1056)

  // a heavy rule, and the small print on tape
  ctx.fillStyle = '#15100c'
  ctx.fillRect(78, 1128, pw - 124, 9)
  const w1 = tape(ctx, (c.byLine || `NO. ${c.no}`).toUpperCase(), 80, 1214, 24, 0.012)
  ctx.fillStyle = 'rgba(21,16,12,.88)'
  ctx.font = f('mono', 25)
  trackedFit(ctx, c.host, W - 76, 1218, pw - w1 - 170, 25, 1.5, {}, 'right')

  // dust and toner specks, hairs, a streak or two from the scanner
  ctx.fillStyle = 'rgba(14,10,6,.8)'
  ctx.beginPath()
  for (let i = 0; i < 560; i++) {
    const x = px + r() * pw
    const y = py + r() * ph
    const s = r() < 0.04 ? 2 + r() * 3.4 : 0.5 + r() * 1.5
    ctx.moveTo(x + s, y)
    ctx.arc(x, y, s, 0, Math.PI * 2)
  }
  ctx.fill()
  ctx.strokeStyle = 'rgba(24,16,8,.5)'
  ctx.lineWidth = 1.3
  for (let i = 0; i < 6; i++) {
    const x = px + r() * pw
    const y = py + r() * ph
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + r() * 60 - 30, y + r() * 40 - 20, x + r() * 90 - 45, y + r() * 60 - 30, x + r() * 110 - 55, y + r() * 70 - 35)
    ctx.stroke()
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'
    ctx.fillRect(px + r() * pw, py, 1.5 + r() * 3, ph)
  }

  // the sheet's edge against the glass is darker, and the corners fall away
  const sh = ctx.createLinearGradient(px, 0, px + 130, 0)
  sh.addColorStop(0, 'rgba(34,20,6,.38)')
  sh.addColorStop(1, 'rgba(34,20,6,0)')
  ctx.fillStyle = sh
  ctx.fillRect(px, py, 130, ph)
  const sb = ctx.createLinearGradient(0, py + ph, 0, py + ph - 130)
  sb.addColorStop(0, 'rgba(34,20,6,.34)')
  sb.addColorStop(1, 'rgba(34,20,6,0)')
  ctx.fillStyle = sb
  ctx.fillRect(px, py + ph - 130, pw, 130)
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.78)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(20,10,0,.26)')
  ctx.fillStyle = vg
  ctx.fillRect(px, py, pw, ph)

  ctx.restore() // the clip
  ctx.restore() // the tilt
  // a hair of toner noise over everything, scanner glass included
  grain(ctx, 0.06, 'overlay')
}

export const POSTERS = { subway, swiss, scan }

export function drawPoster(ctx, style, c) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ;(POSTERS[style] || subway)(ctx, c)
  ctx.restore()
}
