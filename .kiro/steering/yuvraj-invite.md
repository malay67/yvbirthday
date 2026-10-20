# Yuvraj birthday invite: project brief

A birthday invite website for my friend Yuvraj.

- Live: https://yvbirthday.vercel.app/ . Already shared on WhatsApp, so it must never break.
- Code: github.com/malay67/yvbirthday, branch `main`. Vercel (free Hobby plan) publishes every push to main in about a minute. Only yvbirthday.vercel.app is public; preview links need a Vercel login.
- Keep the repo's git `user.name` / `user.email` as they are. On the free plan Vercel only deploys commits it can match to malay67.
- Dates are written DD/MM/YYYY. Birthday Sunday 11/10/2026. Party Monday 12/10/2026, 8:00 PM till 2:00 AM, India time (+05:30).
- Yuvraj: smokes a lot, drinks, the most reliable guy we know, sorts out everyone's problems, picks up at 3 AM, the most real person, no filter.

## Old folders next to this one

Birthday Gift Animation, Interactive Birthday Gift, Valentine Letter Animation, "Yuvraj Birthday Invite - backup", and a loose package-lock.json are old references. Never edit them. Never run npm or git in them.

## Rules that stay

- `party.config.js` (root) is the ONLY place for dates, times, venue, map link, WhatsApp number, age and siteUrl. Nothing else hard-codes a party date, time or weekday. Do not change any value in it.
- `src/copy.js` holds every line of text. `{tokens}` are filled from the config (list at the top of that file).
- `?skip` skips the intro. `?now=2026-10-12T19:30` previews any moment. `?q=0.35` lowers WebGL resolution (testing).
- Do not change: the intro, og:title, og:description, og:image.
- No new npm packages unless there is no other way (pin the exact version). No backend, database, accounts, analytics or paid services.
- Stack: Vite 6.4.4, vanilla JS, GSAP 3.15.0 (all plugins are free and installed), self-hosted League Gothic, Instrument Serif, DM Mono (fontsource 5.3.0), WebGL smoke shader, canvas sparks, WebAudio. There is no Lenis: scenes use native CSS scroll-snap. Exact pinned versions.

## Scene order

Intro > Name > Quiz > Collection > Countdown > Ticket and RSVP > Print room > End card (Light it again).
The RSVP stays before the print room so nobody leaves for WhatsApp before saying yes.

## The idea for the new things

The dark smoky room is "the museum after hours", open one night only. New things are bone-paper cards under the light (same paper as the ticket): hairline rules, DM Mono metadata, League Gothic titles, Instrument Serif italic notes, same palette, grain and smoke.
No new font families. No rounded app-style cards, gradients, glassmorphism or emoji icons. Icons are simple SVG lines drawn by hand. Use the existing sound engine (`Sfx`) and `buzz()` for small feedback, and respect the sound toggle.
Inspiration (ideas only, never their logos, images, text or layouts): fontsinuse.com (metadata is the design), archives.sva.edu (subway posters, course announcements), cooperhewitt.org (accession numbers, colour search, the Pen, wallpaper room), designreviewed.com (scanned print, halftone, credits).

## Copy voice

His best friend roasting him in the group chat. Short, dry, specific, loving. About 10 words a line, about 15 on screen at once. Never: celebrate, join us, unforgettable, vibes, epic, journey. No exclamation marks, no emojis in the design, nothing that sounds AI-written. A little Hinglish is fine if it is funnier. All new text lives in `src/copy.js` with comments.

## Mobile first (nearly everyone opens it from WhatsApp)

- Every screen fits 360x640 (svh/dvh). No sideways page scroll. Tap targets 48px+, main buttons in the lower half, respect notch and home bar, text 16px+, nothing hover-only.
- Sideways swipes must not fight vertical scroll; a vertical swipe that starts on a card still moves to the next scene.
- Smooth on a mid-range Android (test at 4x CPU throttle). Works in WhatsApp and Instagram in-app browsers, Android Chrome, iPhone Safari, landscape. New screens snap like the old ones. The cigarette still burns to the very end.
- Sound, vibration, Skip intro and reduced motion work everywhere (reduced motion: no Flip or fly-ins, just swaps).

## File map

```
index.html              all scene markup. data-copy="path.in.copy" fills text from copy.js
party.config.js         dates, times, venue, map, WhatsApp number, age, siteUrl (only place)
vite.config.js          Vite + "party" plugin: <title>, og tags, party.ics, build meta tag
src/copy.js             every line of text
src/main.js             boot: config check, smoke, sparks, sound, intro, scenes
src/intro.js            gate > flame > wish > reveal
src/style.css           all CSS
src/scenes/index.js     scene wiring, light moods per scene, IntersectionObserver "enter"
src/scenes/             name.js quiz.js count.js rsvp.js (+ new scenes)
src/ui/                 wheel.js cigarette.js disclaimer.js sound.js
src/fx/                 audio.js (Sfx) haptics.js (buzz) sparks.js
src/gl/smoke.js         WebGL smoke shader
src/lib/                party.js (config check, tokens, WhatsApp, calendar) bind.js clock.js open.js config-error.js
public/                 favicon.svg og.jpg
```

## Commands (run in this folder only)

```
npm run build      -> dist/   (always run before pushing)
npm run preview    -> serve dist/ (vite preview) to test the built site
npm run dev        -> dev server (long-running: ask the user to start it, do not run it from chat)
```

## Test harness (outside the project)

`%TEMP%\yuv-shots`: Node scripts using playwright-core 1.64.0 to drive the installed Microsoft Edge headless with SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`) so WebGL works. If the folder is gone, recreate it there, never inside the project. `lib.mjs` has the helpers, `flows.mjs` the old flows.

- WebGL is slow in headless Edge: add `?q=0.35` and use `?skip` unless testing the intro.
- To light the wheel: drag in about 10 small mouse steps about 15 ms apart, starting inside the wheel (about 84% down the screen on phones, 72% on desktop).
- Real touch swipes: CDP `Input.dispatchTouchEvent` (touchStart, a dozen touchMove 16 ms apart, touchEnd). `Input.synthesizeScrollGesture` with `gestureSourceType: 'touch'` does nothing in headless Edge, so do not use it.
- 4x CPU: CDP `Emulation.setCPUThrottlingRate`.
- The dev machine clock may not match the story date; use `?now=2026-10-11T12:00` to see the day the user describes.

## Verify before every push

Old flows (wheel, flame, blow twice, reveal, every scene, all quiz answers, countdown taps, "Can't make it" x5, "Obviously", stamp, WhatsApp, calendar, Light it again). Touch emulation at 320x640, 360x640, 390x844, 412x915, landscape 844x390, desktop 1440x900: screenshot every step and look at it (no overflow, no cut or wrapped labels, clean console). Real touch swipes. 4x CPU throttle. `npm run build` then test with `vite preview`. No hard-coded party dates, times or weekdays outside `party.config.js`. Report gzip size of JS and CSS before and after.

## Ship

- Commit as you go; local commits do not go live. Push `main` only after a stage passes VERIFY. Never force-push.
- The build adds `<meta name="build" content="...">` from `VERCEL_GIT_COMMIT_SHA` (fallback `local`). After a push, load `https://yvbirthday.vercel.app/?t=<timestamp>` until that tag shows the pushed commit (give up after 10 minutes and tell the user), then run the phone flows on the live site.
- Rollback point is the tag `live-v1` (the site as it was before this work). If live breaks and cannot be fixed in 10 minutes:
  `git revert --no-commit live-v1..HEAD`, commit "Back to live-v1", push, check the live site is back.

## Stages

1. The Yuvraj Collection (after the Quiz): swipeable object records, Collect (punch hole, saved in localStorage, shown on the ticket stub, one extra line in the WhatsApp RSVP), explore by colour (GSAP Flip), Shuffle.
2. Print room (after the RSVP): Subway, Swiss and Scan posters, 1080x1350 PNG on a canvas, fonts loaded first, Share via `navigator.share({ files })` called straight from the tap, fallback `<img>` + Download, typing in a fixed full-screen sheet. End card with Light it again.
3. Extras, only once 1 and 2 are live: archive search sheet, "Fonts in use" colophon (real designer and foundry names from the font packages), small gallery room labels (only if they fit at 320px), scanned photographs from `public/archive/` if any (re-encode to 1200px max, under 250 KB, strips GPS).

## The Collection (stage 1, live)

- Objects, colours and every line on the cards: `copy.collection` in `src/copy.js` (see the comment above it). To add an object, copy a `{ ... }` block in `objects`, give it a new `id`, pick 2 or 3 colour ids from `swatches`, and pick a drawing name for `art`.
- The drawings are hand-made SVG line art in `src/scenes/collection-art.js` (`man lighter phone ashtray glass cab voice course`). A new `art` name needs a new drawing there, or it falls back to nothing.
- Acc. no. is built by `accession(P, n)` in `src/lib/party.js` from the birthday in the config and the card's place in the list. Never type one.
- What the guest collected lives in `localStorage['yuv-collected']` (ids). `src/lib/collected.js` wraps it (try/catch, works without storage). It feeds the stub punch card (`rsvp.js`) and the extra WhatsApp line (`whatsapp.collected` / `whatsapp.more` in copy.js, at most three names).
- Rail = native sideways scroll-snap (`#colRail`), no library. Colour filter uses GSAP Flip, plus the `#tint` overlay. Reduced motion: no Flip, no hint nudge, tint toned down.
- Scene light moods are keyed by scene id in `src/scenes/index.js`, so inserting a scene never shifts the others.

## Status

Update this after every stage so a new chat can pick up.

- [x] Handover done. Tag `live-v1` pushed to origin (rollback point, commit 63643af).
- [x] Stage 1: Collection. LIVE since commit e7308fc. Verified locally and on live (96 checks: cards, collect, reload, stub, WhatsApp line, 5 colours, Show all, shuffle, keys, real touch swipes, reduced motion, no storage, 4x CPU, cigarette, old flows at 390x844 and 360x640). Bundle before/after (gzip): JS 70.4 KB to 83.5 KB, CSS 6.6 KB to 8.6 KB, HTML 3.4 KB to 4.1 KB.
- [ ] Stage 2: Print room. Not started.
- [ ] Stage 3: extras. Not started.
