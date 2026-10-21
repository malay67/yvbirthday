import { gsap } from 'gsap'

/*
  What each drawing does when it is tapped. They find their parts by the class names in collection-art.js.
    rest(svg, to)               sets the drawing for a state without moving anything (reduced motion, and when a card is built).
                                `to` is the state: 0 is the card as printed, 1 after the first tap, 2 after the second ...
    play(svg, to, from, c)      the little animation, always under a second, returns the timeline so a quick second tap can cut it off.
                                `c` is { sfx, sparks, buzz }.
*/
const q = (svg, sel) => svg.querySelector(sel)
const qa = (svg, sel) => [...svg.querySelectorAll(sel)]
const shake = (el, px = 2) => gsap.fromTo(el, { x: 0 }, { x: px, duration: 0.04, yoyo: true, repeat: 5, ease: 'none', clearProps: 'x' })

// a point on the 96 x 96 drawing, in screen pixels (for the real sparks)
const at = (svg, x, y) => {
  const r = svg.getBoundingClientRect()
  return { x: r.left + (x / 96) * r.width, y: r.top + (y / 96) * r.height }
}

export const ACT = {
  // he picks up the phone: it slides to his ear, rings go out
  man: {
    rest(svg, to) {
      gsap.set(qa(svg, '.a-phone'), { opacity: to > 0 ? 1 : 0, x: 0 })
      gsap.set(qa(svg, '.a-ring, .a-ring2'), { opacity: 0 })
    },
    play(svg, to, from, c) {
      const phone = qa(svg, '.a-phone')
      const rings = qa(svg, '.a-ring, .a-ring2')
      const tl = gsap.timeline()
      if (to > 0) {
        tl.call(() => (c.sfx.ring(), c.buzz([24, 40, 24])), null, 0)
          .fromTo(phone, { x: -9, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, ease: 'power2.out' }, 0)
          .fromTo(rings, { opacity: 0 }, { opacity: 1, duration: 0.09, stagger: 0.08, repeat: 3, yoyo: true }, 0.15)
          .fromTo(qa(svg, '.smoke'), { x: 0 }, { x: 2, duration: 0.1, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.1)
      } else {
        tl.to(phone, { x: -9, opacity: 0, duration: 0.2, ease: 'power2.in' })
      }
      return tl
    },
  },

  // a flick: sparks, and the flame jumps
  lighter: {
    rest(svg) {
      gsap.set(qa(svg, '.a-sparks'), { opacity: 0, scale: 1 })
      gsap.set(qa(svg, '.flame'), { scaleY: 1 })
    },
    play(svg, to, from, c) {
      const p = at(svg, 45, 12)
      return gsap
        .timeline()
        .call(() => (c.sfx.tick(1), c.buzz([10, 20, 10])), null, 0)
        .call(() => c.sfx.tick(0.8), null, 0.07)
        .call(() => c.sfx.tick(0.9), null, 0.14)
        .call(() => c.sparks && c.sparks.burst(p.x, p.y, 16, { angle: -Math.PI / 2, spread: Math.PI * 0.9, speed: 300 }), null, 0.12)
        .fromTo(qa(svg, '.a-sparks'), { opacity: 0, scale: 0.6, svgOrigin: '45 20' }, { opacity: 1, scale: 1.1, duration: 0.16, ease: 'power2.out' }, 0.1)
        .to(qa(svg, '.a-sparks'), { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.3)
        .fromTo(qa(svg, '.flame'), { scaleY: 1, svgOrigin: '45 21' }, { scaleY: 1.3, duration: 0.12, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.1)
    },
  },

  // the crack spreads, the phone shudders
  phone: {
    rest(svg, to) {
      gsap.set(qa(svg, '.a-crack'), { opacity: to > 0 ? 1 : 0, strokeDasharray: 'none', strokeDashoffset: 0 })
      gsap.set(svg, { x: 0 })
    },
    play(svg, to, from, c) {
      const crack = q(svg, '.a-crack')
      const tl = gsap.timeline()
      if (to > 0) {
        const L = crack.getTotalLength()
        tl.call(() => (c.sfx.crack(), c.buzz([20, 30, 20])), null, 0)
          .set(crack, { opacity: 1, strokeDasharray: `${L} ${L + 2}`, strokeDashoffset: L }, 0)
          .to(crack, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, 0.06)
          .set(crack, { strokeDasharray: 'none', strokeDashoffset: 0 })
          .add(shake(svg), 0)
      } else {
        tl.to(crack, { opacity: 0, duration: 0.2 })
      }
      return tl
    },
  },

  // a butt drops into the bottle, the ash comes up a little
  bottle: {
    rest(svg, to) {
      gsap.set(qa(svg, '.lvl'), { y: -3 * to })
      gsap.set(qa(svg, '.a-butt'), { opacity: 0, y: 0 })
    },
    play(svg, to, from, c) {
      const butt = qa(svg, '.a-butt')
      const lvl = qa(svg, '.lvl')
      const tl = gsap.timeline()
      if (to > 0) {
        tl.fromTo(butt, { y: 0, opacity: 1 }, { y: 38, duration: 0.34, ease: 'power2.in' }, 0)
          .call(() => (c.sfx.plink(), c.buzz(10)), null, 0.34)
          .set(butt, { opacity: 0 }, 0.4)
          .to(lvl, { y: -3 * to, duration: 0.25, ease: 'back.out(3)' }, 0.34)
      } else {
        tl.call(() => c.sfx.pop(), null, 0).to(lvl, { y: 0, duration: 0.3, ease: 'power2.inOut' }, 0)
      }
      return tl
    },
  },

  // the drink goes down and comes back up, the ice rattles
  glass: {
    rest(svg) {
      gsap.set(qa(svg, '.lvl'), { y: 0, scaleX: 1 })
      gsap.set(qa(svg, '.ice'), { rotation: 0 })
    },
    play(svg, to, from, c) {
      return gsap
        .timeline()
        .to(qa(svg, '.lvl'), { y: 26, scaleX: 0.94, svgOrigin: '46 42', duration: 0.28, ease: 'power2.inOut' })
        .to(qa(svg, '.lvl'), { y: 0, scaleX: 1, svgOrigin: '46 42', duration: 0.45, ease: 'power2.out' }, '>0.04')
        .fromTo(qa(svg, '.ice'), { rotation: 0, svgOrigin: '50 60' }, { rotation: 7, duration: 0.09, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.3)
        .call(() => (c.sfx.clink(), c.buzz([10, 30, 10])), null, 0.4)
    },
  },

  // another receipt slides out of the slot at the top and prints
  cab: {
    rest(svg) {
      gsap.set(qa(svg, '.rcpt'), { y: 0 })
      gsap.set(qa(svg, '.ln'), { clearProps: 'strokeDasharray,strokeDashoffset' })
    },
    play(svg, to, from, c) {
      const tl = gsap.timeline()
      ;[0, 0.1, 0.2, 0.3, 0.4].forEach((t, i) => tl.call(() => c.sfx.tick(0.5 + i * 0.05), null, t))
      tl.call(() => c.buzz(10), null, 0)
        .fromTo(qa(svg, '.rcpt'), { y: -24 }, { y: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .fromTo(qa(svg, '.ln'), { strokeDasharray: '1 2', strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.25, stagger: 0.09, ease: 'none', clearProps: 'strokeDasharray,strokeDashoffset' }, 0.25)
      return tl
    },
  },

  // the waveform plays, left to right
  voice: {
    rest(svg) {
      gsap.set(qa(svg, '.bar'), { scaleY: 1 })
      gsap.set(qa(svg, '.play'), { scale: 1 })
    },
    play(svg, to, from, c) {
      const tl = gsap.timeline()
      for (let i = 0; i < 8; i++) tl.call(() => c.sfx.tick(0.3 + i * 0.08), null, i * 0.06)
      tl.call(() => c.buzz(8), null, 0)
        .fromTo(qa(svg, '.bar'), { scaleY: 0.15, transformOrigin: '50% 50%' }, { scaleY: 1, duration: 0.26, ease: 'back.out(2)', stagger: 0.06 }, 0)
        .fromTo(qa(svg, '.play'), { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.2, duration: 0.12, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
      return tl
    },
  },

  // FULL is stamped on the notice
  course: {
    rest(svg, to) {
      gsap.set(qa(svg, '.a-full'), { opacity: to > 0 ? 1 : 0, scale: 1 })
      gsap.set(svg, { x: 0 })
    },
    play(svg, to, from, c) {
      const full = qa(svg, '.a-full')
      const tl = gsap.timeline()
      if (to > 0) {
        tl.fromTo(full, { opacity: 0, scale: 2.4, svgOrigin: '48 56' }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power4.in' }, 0)
          .call(() => (c.sfx.stamp(), c.buzz([20, 30, 60])), null, 0.2)
          .add(shake(svg), 0.2)
      } else {
        tl.to(full, { opacity: 0, duration: 0.2 })
      }
      return tl
    },
  },

  // the empty frame: the dashes go round while it looks
  missing: {
    rest(svg) {
      gsap.set(qa(svg, '.frame'), { opacity: 1, strokeDashoffset: 0 })
    },
    play(svg, to, from, c) {
      const frame = q(svg, '.frame')
      const tl = gsap.timeline()
      ;[0, 0.12, 0.24].forEach((t, i) => tl.call(() => c.sfx.tick(0.4 + i * 0.1), null, t))
      tl.call(() => c.buzz(8), null, 0)
        .fromTo(frame, { strokeDashoffset: 0 }, { strokeDashoffset: -60, duration: 0.7, ease: 'none' }, 0)
        .fromTo(frame, { opacity: 1 }, { opacity: 0.2, duration: 0.07, yoyo: true, repeat: 5, ease: 'none' }, 0)
      return tl
    },
  },
}
