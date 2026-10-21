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
src/scenes/             name.js quiz.js count.js rsvp.js, collection.js (+ collection-art.js), print.js (+ posters.js), end.js, archive.js (search), colophon.js (Fonts in use)
src/ui/                 wheel.js cigarette.js disclaimer.js sound.js sheet.js (shared full-screen sheets)
src/fx/                 audio.js (Sfx) haptics.js (buzz) sparks.js
src/gl/smoke.js         WebGL smoke shader
src/lib/                party.js (config check, tokens, WhatsApp, calendar) bind.js clock.js open.js config-error.js after.js (the copy.after block, laid over the lines once the party is over) collected.js
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
   Built: the search and Fonts in use. Not built, on purpose: photographs (there is no `public/archive/` folder, so nothing to show) and room labels on the scenes (the old scenes are not to be touched; "Room 03" style labels only appear in the search results). Notes for both are at the end of the stage 3 section.

## The Collection (stage 1, live)

- Objects, colours and every line on the cards: `copy.collection` in `src/copy.js` (see the comment above it). To add an object, copy a `{ ... }` block in `objects`, give it a new `id`, pick 2 or 3 colour ids from `swatches`, and pick a drawing name for `art`.
- The drawings are hand-made SVG line art in `src/scenes/collection-art.js` (`man lighter phone ashtray glass cab voice course`). A new `art` name needs a new drawing there, or it falls back to nothing.
- Acc. no. is built by `accession(P, n)` in `src/lib/party.js` from the birthday in the config and the card's place in the list. Never type one.
- What the guest collected lives in `localStorage['yuv-collected']` (ids). `src/lib/collected.js` wraps it (try/catch, works without storage). It feeds the stub punch card (`rsvp.js`) and the extra WhatsApp line (`whatsapp.collected` / `whatsapp.more` in copy.js, at most three names).
- Rail = native sideways scroll-snap (`#colRail`), no library. Colour filter uses GSAP Flip, plus the `#tint` overlay. Reduced motion: no Flip, no hint nudge, tint toned down.
- Scene light moods are keyed by scene id in `src/scenes/index.js`, so inserting a scene never shifts the others.

## The Print Room and the end card (stage 2, live)

- Where the guest gets there: a small "Make a poster" link under the ticket buttons (`#posterLink`, copy `rsvp.poster`) and the scene order. The ticket scene has no arrow; that link is its way on.
- All text is in `copy.print` and `copy.end`. Poster lines: `copy.print.lines` (18 now, first one is always the first poster, the rest come shuffled; keep each under 40 characters after `{name}` `{weekday}` `{time}` are filled in). Add a line by adding a string to the array.
- The three looks are drawn by `src/scenes/posters.js` (`subway`, `swiss`, `scan`) onto ONE canvas, `#posterCanvas`, 1080x1350. The picture for a given line and look is always the same (seeded by a hash of the two), so a re-tap draws the same poster. The fonts are forced to load first (`loadFonts()`), then the poster is redrawn.
- NEVER call `getImageData` on `#posterCanvas` (it switches the canvas to software rendering and changes the pixels). Read it with `toDataURL`/`toBlob`. Offscreen canvases (the scan look's type mask) are fine to read.
- `src/scenes/print.js` holds the state: look, line index, own line (max 40, never stored), designed-by name (max 24, remembered in `localStorage['yuv-designer']`, in try/catch). A PNG blob is made 450 ms after any change, so Share is instant; if the tap comes sooner, a synchronous `toDataURL` copy is used inside the tap.
- Share: `navigator.share({ files, title, text })` called straight from the tap (iOS drops the user activation after any `await`). Used only if `navigator.canShare({ files })` says yes; otherwise, or on any error other than AbortError/InvalidStateError (guest closed the share sheet, silent), the Save sheet opens with the poster as an `<img>` (press and hold) and a Download link. File name `yuvraj-birthday-<look>.png`.
- The two sheets (`#writeSheet`, `#saveSheet`) are full-screen and fixed, kept in step with the part of the screen the phone really shows (`visualViewport` into `--vvh` and `--vvt`), fields at the top so the keyboard never hides them. While one is open: `html.is-sheet`, `inert` on `#main` and `#bar`, Escape closes, focus is trapped and goes back to the button that opened it.
- End card: `end.js`. The button `#againBtn` ("Light it again") drops `?skip` and reloads, so the guest is back in the dark at the top. It used to live in `rsvp.js`.
- The cigarette burns by scroll progress over all 7 scenes and stubs out at the end card.

## The search and Fonts in use (stage 3, live)

- A magnifier (`#searchBtn`) sits in the top bar between the date and RSVP. It is disabled until `initArchive` has run and fades in with the RSVP link once the intro is over. It opens `#archiveSheet`: a box (`#archiveQ`), a count line (`#archiveStatus`), four little suggestion buttons (`#archiveTry`) and up to 6 results (`#archiveList`).
- `src/scenes/archive.js` builds its index from `copy.js` when the page starts, so it follows the text. It looks in: each object (title 5, `tags` 4, its colour ids and each colour's `words` 3, `sub` 3, the row values 2, the note 1), each room (`copy.rooms`: name, `words`, line), the extras (`copy.archive.extras`, today just "Fonts in use") and the answers (`copy.archive.answers`). A typed word matches the start of a word; a word of 5+ letters may match inside one; a query of several words also matches with the spaces removed ("3 am" finds "3am"). Ties keep the order of the list. Typed text only ever goes into the page with `textContent`.
- A result does one of three things: an object calls `collection.show(id)` and scrolls to the Collection (a colour filter that hides the card comes off first, without animation; if the guest is already on that scene it glides, otherwise the card is already in place when the scene arrives; it also marks the peek hint as done so it cannot pull the cards back); a room scrolls to its scene and focuses it; the credits open `#coloSheet`.
- Where to edit, all in `src/copy.js`: `archive` (placeholder, hint, the `suggest` buttons, `none`, `answers`, `extras`), `rooms` (name, line, `words` for each scene, keyed by scene id), `tags` on each object, `words` on each colour. To add an answer, copy one `{ words: [...], line: '...' }` line into `archive.answers`; `{date} {dateLong} {time} {ends} {place} {name}` work in it.
- "Fonts in use": a small link on the last screen (`#fontsBtn`, `copy.colophon.link`) and a search result open `#coloSheet`. `src/scenes/colophon.js` draws one bone-paper label per typeface from `copy.colophon.fonts`, the name set in that typeface, the rows reusing `.obj__meta`. The names came from each font's own project page (the address is in a comment beside each font in copy.js): League Gothic (Caroline Hadilaksono, Micah Rich, Tyler Finck; The League of Moveable Type; after Alternate Gothic No. 1 by Morris Fuller Benton, ATF, 1903), Instrument Serif (Rodrigo Fuenzalida; direction Jordan Egstad, JD Hooge, Jack De Caluwe; Instrument; 2022), DM Mono (Colophon Foundry for DeepMind; 2020). Keep them accurate if the fonts ever change.
- `src/ui/sheet.js` is the one place that makes a full-screen sheet behave: `openSheet(el, focusEl, returnTo)`, `closeSheet(el, { restore })`, `trapSheet(el, close)`. The visual viewport sync, `html.is-sheet`, `inert` on `#main` and `#bar`, Escape, the Tab trap and putting the focus back all live there. The Print Room's two sheets, the search and the credits use it. A new sheet should too.
- `initColophon` and `initArchive` run inside `soft()` in `src/scenes/index.js`: if either one throws, it is logged as a warning and the page carries on without it.
- The Collection's peek hint (`nudge()` in collection.js) skips itself while a sheet is open and only brings the rail back if the guest is still on card 1.

Not built, with the plan if it is wanted later:
- Photographs. There is no `public/archive/` folder, so there is nothing to show. If photos arrive: re-save each as a JPEG at most 1200 px on its long side and under 250 KB with the location data removed (drawing it onto a canvas and exporting does that), put them in `public/archive/`, add an optional `photo: 'name.jpg'` to an object in `copy.collection.objects`, and in `buildSlide` (collection.js) put an `<img>` in the same box as the drawing (`.obj__plate`) so the card height does not change. Test the card at 320x568, 360x640 and 390x844 with and without a photo. Use `base: './'` paths (`archive/name.jpg`).
- Gallery room labels on the scenes. The old scenes have their own small headings and are not to be touched, so "Room 03" labels exist only in the search results (`kind.room` in `copy.archive`).

## Round 2 (after the three stages above)

Rollback point for round 2 is the tag `live-v2` (commit 25b792f, the site as it was before round 2): `git revert --no-commit live-v2..HEAD`, commit "Back to live-v2", push. `live-v1` is still the older one.

### The day after the party (round 2, stage 1, live)

- The page asks the clock at start-up (`main.js`: `phaseOf(P, clock.now()).state === 'after'`, so `?now=` previews it, e.g. `?now=2026-10-21T14:00`). If the party is over it calls `useAfter(copy)` (`src/lib/after.js`), which lays the `after` block at the end of `src/copy.js` over the normal lines, adds `html.is-after`, and passes `after` to the scenes. Everything that reads copy.js (scenes, search, WhatsApp message) follows without knowing. Before the end of the party nothing is touched (checked: every scene reads exactly as the old live site).
- The build (`vite.config.js`: tab title, preview card, party.ics) never calls it, so those stay as they were. Never change them.
- Editing: only the words in `copy.after`. A plain value replaces the line, an object is laid over the object with the same name, a list written as a list replaces the whole list, and an object like `{ 14: '...' }` or `{ man: { note: '...' } }` patches single items of a list (key = the item's `id` or its place counting from 0). The search answers (4, 5, 6) and the poster line (14) are patched by place, so check them if those lists are reordered. All weekdays and dates are tokens.
- What changes: name scene joke, film line, top bar link ("ticket"), his card note and YUV 101 "Met", the countdown (whole days after 48 hours: `count.daysLabel`, `count.js` `inDays`), the ticket (Were you there? / Obviously / Don't remember, three guilt lines, "No option left. You were there.", fine print, WAS THERE stamp on two lines via the `is-long` class on `#stamp`, Add to calendar and Open map hidden, WhatsApp "I was there ..."), the end card (EXHIBITION / CLOSED., `is-long` on `.end__big` for any word over 8 letters, phones in portrait only), `rooms` lines for the ticket and end card, three search answers, one poster line.
- Also in stage 1: the film line sits `max(24px, safe-area + 16px)` from the bottom with a soft three-layer shadow (landscape phones: the wish moves to 65% so the hint never touches it, the arrow rises to `max(38px, ...)`, and the film line is hidden when a phone on its side is under 400px tall); the name reveal is a ghost of the whole word (0.3, soft) that sharpens letter by letter in random order (`GHOST` in `name.js`), so YUVRAJ is readable in every frame; the Collect button's "n / 8" became a punch card of eight holes (`#colCollectN`, four across, `aria-label` "Collected 3 of 8", `copy.collection.tally`) so the card position is the only "x / 8" in the scene.

### Round 2 test notes

- `%TEMP%\yuv-shots\verify-r2.mjs [url] [--only=film,reveal,tally,after,days,ticket,end,before,sizes,reduced,throttle] [--sizes=s390,l1536]` holds the round 2 checks (one section per thing; more are added each stage). `shoot-all.mjs` takes every scene at some sizes and moments, `sheet.mjs` puts pictures side by side, `lib.mjs` now has `l1366 l1536 l1280` (laptops) and `sel` (667x375, an iPhone SE on its side). Run the suites one at a time.
- Moments for `?now=`: birthday `2026-10-11T12:00`, before `2026-10-12T19:00`, party on `2026-10-12T21:30`, 1 AM `2026-10-13T01:00`, after `2026-10-21T14:00`. The party ends 13 Oct 02:00, so 48 hours later is `2026-10-15T02:00`.
- The machine clock is past the party, so a plain `walk-live.mjs` run shows the after state; add `?now=2026-10-12T19:00` to the address to walk the old one (the walk skips the calendar when the button is hidden). `verify-s1.mjs` reads the Collect count from the tally's `aria-label`.
- Known and left alone: the Collection card is about 37px too tall at 667x375 on its side (and 39px at 320x568), see stage 4.

## Status

Update this after every stage so a new chat can pick up.

- [x] Handover done. Tag `live-v1` pushed to origin (rollback point, commit 63643af).
- [x] Stage 1: Collection. LIVE since commit e7308fc. Verified locally and on live (96 checks: cards, collect, reload, stub, WhatsApp line, 5 colours, Show all, shuffle, keys, real touch swipes, reduced motion, no storage, 4x CPU, cigarette, old flows at 390x844 and 360x640). Bundle before/after (gzip): JS 70.4 KB to 83.5 KB, CSS 6.6 KB to 8.6 KB, HTML 3.4 KB to 4.1 KB.
- [x] Stage 2: Print room and end card. LIVE since commit 2a88846. Verified locally and on live: 162 checks (structure, 3 looks x 18 lines, own line and name, 40/24 caps, emoji and 34-letter word, share stub, canShare false, no share at all, refusal paths, fake keyboard 390x420 and an iPhone-style visual viewport, reduced motion, storage that throws, 4x CPU, end card and Light it again from a real intro, cigarette, 8 sizes) plus the stage 1 suite (95 of 96 on the new build, the one miss is the scene order that changed on purpose) and the old-scene walk. Contact sheets of all 54 posters were looked at. Bundle (gzip): JS 83.5 KB to 90.3 KB, CSS 8.6 KB to 9.5 KB, HTML 4.1 KB to 5.1 KB. Not tested: a real iPhone or a real Android share sheet (the share call is stubbed).
- [x] Stage 3: search and Fonts in use. LIVE since commit f43f42c. Verified locally and on the live site: 159 checks for the new things (magnifier timing and position at 9 sizes, results and ranking, answers, no results, typed HTML stays text, going to a card or a room or the credits, a colour filter being cleared, keyboard up at 390x420 and an iPhone-style visual viewport, Escape and the Tab trap, reduced motion, 4x CPU, the peek hint racing a jump from the search at five different moments, the end card link and the credits sheet at 9 sizes), plus the stage 2 suite (162 of 162, it covers the sheet code that moved to `ui/sheet.js`), the stage 1 suite (96 of 96) and the old-scene walk (0 console problems). Bundle (gzip): JS 90.3 KB to 91.8 KB, CSS 9.5 KB to 9.9 KB, HTML 5.1 KB to 5.5 KB. Not tested: a real iPhone or Android keyboard and share sheet. Not built: photographs and scene room labels (see above).
- [x] Round 2, stage 1: film line, name ghost reveal, Collect tally, the day after the party. LIVE since commit f35709b. Verified locally and on live: round 2 checks (film line at 13 sizes and in the intro at 5, 4 reveal runs with every frame sampled, tally, every after-party line, days countdown at 7 moments, ticket flow at 3 sizes, end card at 13 sizes, 2 x 13 sizes x 7 scenes for overflow, reduced motion, 4x CPU), plus the old suites on the new build (96, 162 and 159 of them pass; the only expectation changed is how the Collect count is read) and the old-scene walk before and after the party (0 console problems). Bundle (gzip): JS 93.9 KB to 94.9 KB, CSS 10.1 KB to 10.3 KB, HTML 5.7 KB. Not tested: a real phone.
- Test notes: the suites are `verify-s1.mjs`, `verify-s2.mjs`, `verify-s3.mjs` in the harness folder (`node verify-s3.mjs [url] [--only=bar,search,go,credits,keyboard,reduced,throttle,race,sizes]`). Run them one at a time: two at once starve each other and the 4x CPU frame-gap checks then fail. A fixed sleep after a tap is a guess on a busy machine; wait for the rail to stop moving instead (`settle()` in verify-s1).
