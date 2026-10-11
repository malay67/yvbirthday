/*
  The room.
  One full-screen fragment shader draws everything that is "light":
    - slow domain-warped smoke that your pointer pushes around
    - a single flame (teardrop, flicker, lean) that lights the smoke around it
    - the thin plume that rises when the flame is blown out
    - a soft top light that comes on for the page
  Everything is driven by the plain numbers in `smoke.u`, so GSAP can tween them directly.
*/

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0., 1.); }
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#ifndef OCT
#define OCT 5
#endif

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointer;
uniform vec2  uPointerV;
uniform float uPointerGlow;
uniform float uDensity;
uniform float uLift;
uniform vec4  uFlame;     // x, y, size, intensity
uniform vec2  uFlameMod;  // lean, hush
uniform vec4  uPlume;     // x, y, strength, age
uniform vec4  uTop;       // x, y, strength, radius
uniform float uFlash;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  float a = hash12(i);
  float b = hash12(i + vec2(1., 0.));
  float c = hash12(i + vec2(0., 1.));
  float d = hash12(i + vec2(1., 1.));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p){
  float v = 0., a = .5;
  mat2 R = mat2(.8, -.6, .6, .8);
  for (int i = 0; i < OCT; i++){
    v += a * vnoise(p);
    p = R * p * 2.03 + 17.1;
    a *= .5;
  }
  return v;
}

/* ---------- smoke ---------- */
float smokeField(vec2 uv, float t){
  vec2 p = uv * vec2(1.25, 1.0);
  p.y -= t * .05;

  vec2 dp = uv - uPointer;
  float m = exp(-dot(dp, dp) * 8.);
  p -= uPointerV * m * 1.7;

  vec2 q = vec2(fbm(p + vec2(0., t * .04)),
                fbm(p + vec2(5.2, 1.3) - vec2(0., t * .03)));
  vec2 r = vec2(fbm(p + 2.3 * q + vec2(1.7, 9.2) + t * .05),
                fbm(p + 2.3 * q + vec2(8.3, 2.8) - t * .04));
  float n = fbm(p + 2.2 * r);

  // thin bright filaments where the field crosses its midline, sitting inside sparse patches
  float ridge = 1. - abs(2. * n - 1.);
  float fil   = pow(ridge, 5.);
  float patch = smoothstep(.42, .86, fbm(p * .55 + r * .9 + vec2(3.3, t * .02)));
  float body  = smoothstep(.52, .95, n) * .45;
  return (fil * .9 + body) * (.16 + .84 * patch);
}

/* ---------- the plume left by a blown-out flame ---------- */
float plume(vec2 uv, float t){
  if (uPlume.z <= 0.001) return 0.;
  vec2 p = uv - uPlume.xy;
  float y = p.y;
  if (y < 0.) return 0.;
  float front = uPlume.w * .30 + .02;
  float h = y / front;
  // laminar and thin at the wick, turbulent and wide higher up
  float turb = smoothstep(.06, .55, y);
  float wob = sin(y * 11. - t * 2.4) * .006 * (1. + y * 6.)
            + (fbm(vec2(y * 2.6 - t * .5, 3.1)) - .5) * (.03 + y * .55) * turb;
  float w = .0035 + y * .028 + turb * y * .05;
  float x = (p.x - wob) / w;
  float core = exp(-x * x * .9);
  // soft strands break the ribbon up as it rises (low frequency, so it never looks like rope)
  float strands = fbm(vec2((p.x - wob) * 9., y * 3.4 - t * .9));
  float body = core * (.18 + .9 * smoothstep(.25, .85, strands));
  float fade = smoothstep(1.0, .25, h) * smoothstep(0., .03, y) * (1. - smoothstep(.45, 1.0, y) * .75);
  return body * fade * uPlume.z * .55;
}

/* ---------- the flame ---------- */
void flame(vec2 uv, out vec3 fc, out float fa, out float glow){
  fc = vec3(0.); fa = 0.; glow = 0.;
  float inten = uFlame.w;
  if (inten <= 0.002) return;

  float size = uFlame.z;
  vec2 p = (uv - uFlame.xy) / size;
  float t = uTime;

  p.x -= uFlameMod.x * (p.y * p.y) * .6;

  float k  = smoothstep(.05, 1., p.y);
  float n1 = vnoise(vec2(p.y * 2.4 - t * 2.9, t * 1.1 + 4.7)) - .5;
  float n2 = vnoise(vec2(p.y * 6.0 - t * 5.4, t * 2.3 + 1.9)) - .5;
  p.x += (n1 * .34 + n2 * .11) * k * (1. - uFlameMod.y * .7);

  float H = 1. + .05 * sin(t * 8.3) + .08 * (vnoise(vec2(t * 3.1, 2.2)) - .5);
  float y  = p.y / H;
  float yy = clamp(y, 0., 1.);

  // round belly, long taper: width grows like a circle near the base, then narrows to the tip
  float belly = sqrt(clamp(y / .26, 0., 1.));
  float hw = .235 * pow(1. - yy, .78) * belly;
  float d  = abs(p.x) / max(hw, .0005);

  float body = (1. - smoothstep(.2, 1.05, d)) * step(0., y) * (1. - smoothstep(.86, 1., y));
  float heat = body * (1. - .5 * yy) * (1. - .35 * d * d);
  float core = (1. - smoothstep(0., .66, d)) * (1. - smoothstep(0., .52, yy)) * step(0., y);
  heat = clamp(max(heat, core * .95), 0., 1.);

  vec3 c = mix(vec3(.62, .09, .02), vec3(1., .42, .07), smoothstep(.04, .42, heat));
  c = mix(c, vec3(1., .78, .32), smoothstep(.36, .72, heat));
  c = mix(c, vec3(1., .97, .86), smoothstep(.7, .99, heat));

  float blue = (1. - smoothstep(0., .26, yy)) * (1. - smoothstep(.15, .8, d)) * step(0., y);
  c = mix(c, vec3(.22, .42, 1.), blue * .75);

  fc = c;
  fa = smoothstep(.02, .6, heat) * inten;
  glow = exp(-length(vec2(p.x, (p.y - .38) * .8)) * 1.7) * inten;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float t = uTime;

  vec3 bg = vec3(.039, .031, .027);

  float s = smokeField(uv, t) * uDensity;
  s += plume(uv, t);

  /* light on the smoke */
  vec3 warm = vec3(1., .6, .24);
  vec3 lamp = vec3(1., .84, .6);
  vec3 cool = vec3(.62, .6, .58);

  vec2 fp = uFlame.xy + vec2(0., uFlame.z * .38);
  float fd = length(uv - fp);
  float R  = uFlame.z * 3.1 + .05;
  float fl = uFlame.w * exp(-pow(fd / R, 1.6) * 2.7);

  vec2 tv = (uv - uTop.xy) * vec2(1., .72);
  float tl = uTop.z * exp(-pow(length(tv) / uTop.w, 1.5) * 2.1);

  vec2 dp = uv - uPointer;
  float pl = uPointerGlow * exp(-dot(dp, dp) * 22.);

  vec3 litCol = cool * (.07 + .30 * uLift)
              + warm * (fl * 1.35 + pl * .9)
              + lamp * tl * 1.0;

  vec3 col = bg;
  col += warm * fl * .045 + lamp * tl * .03;
  col += clamp(s, 0., 1.4) * litCol;

  vec3 fc; float fa; float glow;
  flame(uv, fc, fa, glow);
  col += warm * glow * .42;
  col = mix(col, fc, fa);
  col += uFlash * vec3(1., .66, .36) * .30;

  col += (hash12(gl_FragCoord.xy + fract(t) * 91.7) - .5) / 220.;
  gl_FragColor = vec4(col, 1.);
}
`

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error('shader: ' + log)
  }
  return sh
}

export class Smoke {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.ok = false
    this.running = false
    this.time = 0
    this.last = 0
    this.raf = 0
    this.slow = 0
    this.fixed = !!opts.fixed
    this.minDt = 0
    this.coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760
    this.scale = opts.scale || (this.coarse ? 0.55 : 0.75)
    this.minScale = 0.34

    // plain numbers. tween them.
    this.u = {
      density: 0.4, // how much smoke there is
      lift: 0, // ambient light on the smoke
      flame: 0, // flame intensity 0..1
      flameX: 0.5, // viewport fraction, from the left
      flameY: 0.3, // viewport fraction, from the bottom
      flameSize: 0.17, // flame height as a fraction of viewport height
      lean: 0,
      hush: 0,
      plume: 0,
      plumeX: 0.5,
      plumeY: 0.5,
      plumeAge: 0,
      top: 0,
      topX: 0.5,
      topY: 1.1,
      topR: 0.9,
      flash: 0,
      pointerGlow: 0,
      speed: 1,
    }

    this.pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 }
    this.onFrame = null

    try {
      this._init()
      this.ok = true
    } catch (e) {
      console.warn('[smoke] WebGL unavailable, using CSS fallback.', e)
      document.documentElement.classList.add('no-gl')
    }

    this._tick = this._tick.bind(this)
    this._onVis = () => (document.hidden ? this.stop() : this.start())
    document.addEventListener('visibilitychange', this._onVis)
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.stop()
    })
    canvas.addEventListener('webglcontextrestored', () => {
      try {
        this._init()
        this.resize()
        this.start()
      } catch {}
    })
  }

  _init() {
    const gl = this.canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
    if (!gl) throw new Error('no webgl')
    this.gl = gl

    const oct = this.coarse ? 4 : 5
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, `#define OCT ${oct}\n` + FRAG))
    gl.bindAttribLocation(prog, 0, 'aPos')
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog))
    gl.useProgram(prog)
    this.prog = prog

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const names = [
      'uRes', 'uTime', 'uPointer', 'uPointerV', 'uPointerGlow', 'uDensity', 'uLift',
      'uFlame', 'uFlameMod', 'uPlume', 'uTop', 'uFlash',
    ]
    this.loc = {}
    for (const n of names) this.loc[n] = gl.getUniformLocation(prog, n)
  }

  resize() {
    if (!this.ok) return
    const w = Math.max(2, Math.round(window.innerWidth * this.scale))
    const h = Math.max(2, Math.round(window.innerHeight * this.scale))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    this.gl.viewport(0, 0, w, h)
    this.aspect = w / h
  }

  /* pointer in CSS pixels */
  setPointer(cx, cy) {
    this.pointer.tx = cx / window.innerWidth
    this.pointer.ty = 1 - cy / window.innerHeight
  }

  start() {
    if (!this.ok || this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this._tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  /*
    After the intro the smoke only drifts, so on a phone 30 frames a second looks the same
    and costs the GPU half as much. 0 turns the cap off.
  */
  capFps(fps) {
    this.minDt = fps > 0 ? 1000 / fps : 0
  }

  _tick(now) {
    if (!this.running) return
    // capped: this screen refresh is too soon after the last frame, wait for the next one
    if (this.minDt && now - this.last < this.minDt - 2) {
      this.raf = requestAnimationFrame(this._tick)
      return
    }
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.time += dt * this.u.speed

    // pointer easing and velocity
    const p = this.pointer
    const k = 1 - Math.exp(-dt * 7)
    const px = p.x
    const py = p.y
    p.x += (p.tx - p.x) * k
    p.y += (p.ty - p.y) * k
    const inv = dt > 0 ? 1 / dt : 0
    const asp = this.aspect || 1.6
    const vx = (p.x - px) * asp * inv * 0.06
    const vy = (p.y - py) * inv * 0.06
    p.vx += (vx - p.vx) * (1 - Math.exp(-dt * 5))
    p.vy += (vy - p.vy) * (1 - Math.exp(-dt * 5))

    this.render()
    if (this.onFrame) this.onFrame(dt)

    // adaptive resolution: if the GPU is struggling, render fewer pixels
    if (!this.fixed) {
      const ft = performance.now() - now
      // "slow" means slower than we asked for, so a capped 30 fps is not counted against us
      const limit = this.minDt ? this.minDt / 1000 + 0.012 : 0.03
      if (dt > limit) this.slow++
      else this.slow = Math.max(0, this.slow - 1)
      if (this.slow > 40 && this.scale > this.minScale) {
        this.scale = Math.max(this.minScale, this.scale * 0.85)
        this.slow = 0
        this.resize()
      }
      void ft
    }

    this.raf = requestAnimationFrame(this._tick)
  }

  render() {
    if (!this.ok) return
    const gl = this.gl
    const u = this.u
    const L = this.loc
    const asp = this.aspect || this.canvas.width / this.canvas.height
    const p = this.pointer

    gl.uniform2f(L.uRes, this.canvas.width, this.canvas.height)
    gl.uniform1f(L.uTime, this.time)
    gl.uniform2f(L.uPointer, p.x * asp, p.y)
    gl.uniform2f(L.uPointerV, p.vx, p.vy)
    gl.uniform1f(L.uPointerGlow, u.pointerGlow)
    gl.uniform1f(L.uDensity, u.density)
    gl.uniform1f(L.uLift, u.lift)
    gl.uniform4f(L.uFlame, u.flameX * asp, u.flameY, u.flameSize, u.flame)
    gl.uniform2f(L.uFlameMod, u.lean, u.hush)
    gl.uniform4f(L.uPlume, u.plumeX * asp, u.plumeY, u.plume, u.plumeAge)
    gl.uniform4f(L.uTop, u.topX * asp, u.topY, u.top, u.topR)
    gl.uniform1f(L.uFlash, u.flash)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    this.stop()
    document.removeEventListener('visibilitychange', this._onVis)
  }
}
