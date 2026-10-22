/*
  ====================================================================
   ALL THE WORDS
   Every line you can read on the site lives in this file.
  ====================================================================

   HOW TO EDIT
     - Change the words between the `backticks`. Keep the backticks.
       Apostrophes and "quote marks" are fine inside them.
     - Save, then run  npm run build  and upload the "dist" folder again.
       (npm run dev shows changes straight away.)
     - Words in {curly brackets} are filled in from party.config.js, so the
       date, weekday and time are always right. Leave them as they are.

   WHAT YOU CAN PUT IN {CURLY BRACKETS}   (all worked out from party.config.js)
     {name}  {NAME}            his name, normal and CAPITALS
     {weekday}                 the day of the week of the party
     {nextWeekday}             the day after the party
     {date}                    short date: day name, number, month
     {dateLong}                the same, in full
     {time}                    when it starts
     {ends}                    when it ends
     {dots}                    the date as dd.mm.yy
     {place}                   the venue, or "Pin on WhatsApp" if none yet
     {age}                     his age (only if you set one)
     {birthday}                the day he was born, like "11 October" (the year shows only if you set an age)
     {partyDay}                the party day in full, like "Monday 12 October"
     {accession}               an Acc. no. built from his birthday, like 2026.10.11.001 (used on the Collection cards)
     {tonight}                 Tonight (or Today for a daytime party)
     {cakeGuy}                 the friend who promised the cake, see `cakeGuy` just below
     {dayJoke}                 the day-of-the-week joke. It switches itself to
                               the weekend version when the party is on one.

   Keep jokes short. The page shows very few words at a time on purpose.
*/

export const copy = {
  // THE CAKE. One friend promised a cake and the cake never arrived. His name is written here, once, and every cake joke on the
  // site uses it (they are all in `cake`, further down). Change `Baba` to another name, or to `a friend`: it reads fine both ways.
  // Leave it empty (``) and every cake joke goes away: the small white line at the wish, the missing card in the Collection,
  // and the small white line on the ticket and on the last screen.
  cakeGuy: `Baba`,

  // shown wherever the venue goes, until you add one in party.config.js
  place: { empty: `Pin on WhatsApp` },

  // the strip at the top
  bar: {
    during: `for {name}`, // while the intro plays
    after: `{name} / {dots}`, // once the page opens
    rsvp: `rsvp`,
    sound: `Sound`, // what a screen reader calls the button
    soundOn: `Sound on`, // shown beside the icon on bigger screens
    soundOff: `Sound off`,
  },

  nav: { next: `Next` }, // the arrow at the bottom of a scene (screen readers only)

  // the opening: a wheel, a flame, a wish
  intro: {
    dark: `It's dark in here.`,
    spin: `spin the wheel`,
    swipe: `swipe across the wheel`,
    harder: `harder.`,
    harderStill: `a bit harder.`,
    wish: `Make a wish.`,
    blowTap: `tap anywhere to blow it out`,
    blowClick: `click anywhere to blow it out`,
    blowAgain: `Harder.`, // the first blow never works. that's the joke.
    borrowed: `Borrowed lighter. Again.`, // the very first flick on a phone never catches. once, ever
    mic: `Blow for real (mic)`, // a small button under the blow line, only if the browser can listen
    blowMic: `Blow at the screen.`, // while the microphone is listening
    skip: `Skip intro`,
  },

  // small white text at the bottom, like before a film
  disclaimer: {
    lit: `Smoking is injurious to health.`,
    done: `Skipping this party is worse.`,
  },

  // scene 1: his name
  hero: {
    hello: `Happy birthday,`,
    party: `Party · {date} · {time}`,
    joke: `{dayJoke}`, // the day-of-the-week joke, see the top of this file
    weekdayLine: `Yes, a {weekday}. {nextWeekday} is your problem.`, // used when the next day is a working day
    weekendLine: `{weekday} night. Zero excuses.`, // used on the weekend nights
    age: `Aged {age} years.`, // only if you set an age
    tap: `Tap his name.`,
    coughs: [`Quitting tomorrow.`, `Lungs filed a complaint.`, `Clearing his throat.`], // one per tap, in order
  },

  // scene 2: who do you call?
  // In every list of answers, the one that says {name} is the right one (it also gets "Correct." above its line).
  // Every answer has its own line: `t` is the button, `line` is what the page says back.
  quiz: {
    title: `Who do you call?`,
    right: `Correct.`,
    questions: [
      {
        q: `3 AM. Car's dead. You call...`,
        options: [
          { t: `Mom`, line: `Mom asks questions. {name} brings cables.` },
          { t: `Insurance`, line: `On hold, 45 minutes. {name}'s already there.` },
          { t: `{name}`, line: `Even Mom would call {name}.` },
        ],
      },
      {
        q: `Group chat war. 200 unread. Who fixes it?`,
        options: [
          { t: `Admin`, line: `Admin muted the group. {name} sent a voice note.` },
          { t: `Time`, line: `Time made it 400 unread. One voice note. Ceasefire.` },
          { t: `{name}`, line: `One voice note. Ceasefire.` },
        ],
      },
      {
        q: `Need a lighter?`,
        options: [
          { t: `Shop`, line: `Shop's shut. He has four. None are his.` },
          { t: `{name}`, line: `He has four. None are his.` },
        ],
      },
    ],
  },

  // scene 3: the Yuvraj Collection. The museum after hours, open one night only.
  // One object per card. Swipe, or use the arrows. "Collect" punches a hole in the card.
  //
  // TO CHANGE AN OBJECT  edit its lines inside `objects`.
  // TO ADD ONE           copy a whole { ... } block, give it a new `id` (any lowercase word nobody used yet),
  //                      and pick 2 or 3 colour ids from `swatches`.
  // Acc. no. (the accession number) is made from his birthday and the card's place in the list, so you never type it.
  // In `rows`, each pair is [label, text]. Keep it to two or three short rows.
  // `short` is the little name used in the WhatsApp message ("Collected: the lighter (not his), ...").
  // `art` is the name of the drawing (they live in src/scenes/collection-art.js).
  // `tags` are extra words that find the object in the search (the magnifier in the top bar). Plain lowercase words.
  // `tap` (optional) turns the drawing into a button. `label` is what a screen reader calls it. Each tap moves to the next of `states`
  //       and after the last one it goes back to the start. A state can change the `note`, the `sub` line, or single rows:
  //       `rows: { 1: 'new text' }` (the second row; counting from 0). Whatever a state does not mention stays as it was.
  //       Keep a state about as long as the line it replaces, so the card never changes size. The little animation for each
  //       drawing is in src/scenes/collection-act.js.
  collection: {
    title: `The {name} Collection`, // the small line above the cards
    acc: `Acc. no. {accession}`, // top of every card. the number is worked out for you
    tapHint: `tap the object`, // a small hint on the first card, shown once, until he taps a drawing
    prev: `Previous object`, // what a screen reader calls the arrows
    next: `Next object`,
    collect: `Collect`, // the big button
    uncollect: `Put back`, // the same button, once that object is collected
    stamp: `Collected`, // the red stamp on a collected card
    tally: `Collected {n} of {total}`, // screen readers: the little punch card of eight holes on the big button
    shuffle: `Shuffle`, // screen readers only, the button is a drawing of two arrows
    showAll: `Show all`, // puts every card back after you pick a colour
    byColour: `by colour`, // beside the five colour squares
    colourLabel: `Explore by colour`, // screen readers
    colourPicked: `{colour} {hex}`, // replaces the title while a colour is picked
    slide: `{title}, {n} of {total}`, // screen readers, when the card changes
    stubCount: `{n}/{total}`, // on the ticket stub, under the little punch card

    // five colours. the hex codes are real: they paint the squares and tint the room. `words` are other names for it in the search.
    swatches: [
      { id: `amber`, name: `Last Peg Amber`, hex: `#E9A23B`, words: [`gold`] },
      { id: `black`, name: `3 AM Black`, hex: `#0A0807`, words: [`dark`, `night`] },
      { id: `ash`, name: `Ash`, hex: `#A39A8D`, words: [`grey`, `gray`] },
      { id: `ember`, name: `Ember`, hex: `#FF6A2B`, words: [`red`, `orange`, `fire`, `glow`] },
      { id: `yellow`, name: `Kaali-Peeli Yellow`, hex: `#F4C20D`, words: [`taxi`, `kaali`, `peeli`] },
    ],

    // card 1 is the wall label for the man himself. then the things from his life.
    objects: [
      {
        id: `man`,
        short: `the man himself`,
        title: `{name}`,
        sub: `Indian, b. {birthday}`,
        rows: [
          [`Medium`, `Human; smoke, whisky, loyalty`],
          [`Credit line`, `Gift of his parents`],
          [`Condition`, `Good, considering`],
        ],
        note: `On view {partyDay}, {time}. Do not touch the lighter.`,
        colours: [`ash`, `amber`, `black`],
        art: `man`,
        tags: [`him`, `human`, `portrait`, `loyalty`, `birthday`], // extra words that find it in the search
        tap: { label: `Answer the phone`, states: [{ note: `Picked up. It's 3 AM somewhere.` }] },
      },
      {
        id: `lighter`,
        short: `the lighter (not his)`,
        title: `Lighter (not his)`,
        sub: ``,
        rows: [
          [`Medium`, `Plastic, butane, borrowed`],
          [`Credit line`, `Involuntary gift of at least four friends`],
        ],
        note: `He has four. Still asks for yours.`,
        colours: [`ember`, `yellow`],
        art: `lighter`,
        tags: [`flame`, `fire`, `light`, `zippo`, `match`, `borrowed`], // extra words that find it in the search
        tap: { label: `Flick the lighter`, states: [{ note: `Update: he now has five. Check your pockets.` }] },
      },
      {
        id: `phone`,
        short: `the 3 AM phone`,
        title: `Phone, cracked`,
        sub: ``,
        rows: [
          [`Medium`, `Glass, aluminium, no case`],
          [`Condition`, `Cracked, still picks up at 3 AM`],
        ],
        note: `Battery 4%. Answered anyway.`,
        colours: [`black`, `ash`],
        art: `phone`,
        tags: [`call`, `mobile`, `battery`, `3am`, `cracked`], // extra words that find it in the search
        tap: { label: `Tap the cracked screen`, states: [{ note: `Battery 1%. Still on the call.` }] },
      },
      {
        id: `ashtray`,
        short: `the ashtray`,
        title: `Ashtray (Diet Coke bottle)`,
        sub: ``,
        rows: [
          [`Medium`, `Readymade; Diet Coke bottle, ash`],
          [`Credit line`, `Converted by the artist, on site`],
        ],
        note: `Zero sugar. Full of ash.`,
        colours: [`ash`, `ember`],
        art: `bottle`,
        tags: [`ashtray`, `diet`, `coke`, `bottle`, `soda`, `readymade`, `smoke`, `smoking`, `cigarette`, `cigarettes`, `ash`, `quit`], // extra words that find it in the search
        tap: { label: `Stub one out`, states: [{ note: `Zero sugar. Fuller of ash.` }, { note: `He'll find another bottle.` }] },
      },
      {
        id: `glass`,
        short: `bas ek last`,
        title: `Glass`,
        sub: `"Bas ek last"`,
        rows: [
          [`Dimensions`, `60 ml, repeating`],
          [`Medium`, `Whisky, neat, again`],
        ],
        note: `A unit of measurement, not a promise.`,
        colours: [`amber`, `black`],
        art: `glass`,
        tags: [`whisky`, `whiskey`, `drink`, `peg`, `pegs`, `rum`, `beer`, `bar`], // extra words that find it in the search
        tap: { label: `Pour another`, states: [{ sub: `"Bas ek last" (refill 2)` }, { sub: `"Bas ek last" (refill 3)` }] },
      },
      {
        id: `cab`,
        short: `the cab receipt`,
        title: `Cab receipt`,
        sub: ``,
        rows: [
          [`Medium`, `Thermal paper, crumpled`],
          [`Provenance`, `Booked for someone else. Again.`],
        ],
        note: `Passenger: someone else. Payer: him.`,
        colours: [`yellow`, `black`],
        art: `cab`,
        tags: [`taxi`, `uber`, `ola`, `ride`, `car`, `kaali`, `peeli`], // extra words that find it in the search
        tap: { label: `Print another receipt`, states: [{ note: `Another one. Not for him.` }] },
      },
      {
        id: `voice`,
        short: `the 0:47 voice note`,
        title: `Voice note, 0:47`,
        sub: ``,
        rows: [
          [`Medium`, `Audio, 0:47`],
          [`Provenance`, `Group chat, 200 unread`],
          [`Condition`, `Ended a war`],
        ],
        note: `Admin was still typing. War over.`,
        colours: [`ember`, `black`],
        art: `voice`,
        tags: [`audio`, `whatsapp`, `group`, `chat`, `war`, `ceasefire`], // extra words that find it in the search
        tap: { label: `Play the voice note`, states: [{ rows: { 1: `Group chat, 0 unread` } }] },
      },
      {
        id: `course`,
        short: `YUV 101`,
        title: `YUV 101`,
        sub: `Fixing Other People's Problems`,
        rows: [
          [`Prerequisite`, `A dead car`],
          [`Meets`, `{partyDay}, {time} till late`],
        ],
        note: `Walk-ins welcome. 3 AM preferred.`,
        colours: [`amber`, `yellow`],
        art: `course`,
        tags: [`course`, `class`, `lesson`, `school`, `problems`, `fix`, `help`, `sorted`], // extra words that find it in the search
        tap: { label: `Sign up`, states: [{ note: `Waitlist: everyone.` }] },
      },
    ],
  },

  // THE CAKE JOKES. All of them are here, and all of them use {cakeGuy} (set at the very top of this file). If `cakeGuy` is
  // empty none of this is used.
  //   wish    the small white line at the bottom while "Make a wish." is on screen
  //   ticket  the same small line when the ticket is on screen, before the party
  //   end     the same small line on the last screen, after the party
  //   card    one more card at the end of the Collection: the missing object. It is card 09 of 08 on purpose. It is not in the
  //           count of things to collect, not in Shuffle, not in the colours, and not in the WhatsApp message.
  cake: {
    wish: `The cake in this scene is fictitious. Story by {cakeGuy}.`,
    ticket: `Unlike a certain cake, this party is real.`,
    end: `The party happened. The cake, allegedly.`,
    card: {
      id: `cake`,
      title: `Cake, {cakeGuy}'s`,
      sub: `Missing object`,
      rows: [
        [`Reported`, `{birthday}, by {cakeGuy}`],
        [`Medium`, `Unconfirmed`],
        [`Condition`, `Not located`],
        [`Credit line`, `Promised by {cakeGuy}`],
      ],
      note: `Bought, says {cakeGuy}. You'd just left, says {cakeGuy}.`,
      caption: `Image not available`, // in the dashed outline, where the picture would be
      tags: [`cake`, `birthday`, `candles`, `dessert`, `sweet`, `missing`, `promised`, `bought`, `lost`], // extra words that find it in the search (his name is found without any help: it is in the title)
      tap: { label: `Search for the cake`, states: [{ note: `Searching... 0 results.` }] },
      report: `Report a sighting`, // the big button on this card, in the place of Collect
      sightings: `0 sightings.`, // what the big button says for a moment after a tap
    },
  },

  // scene 4: the countdown, in Yuvraj time
  // perHour = how many of that thing he gets through in an hour. change it and the numbers change.
  count: {
    eyebrow: { to: `{name} time · to go`, late: `{name} time · late by`, over: `{name} time · since last call` },
    hint: `tap the number`,
    units: [
      { label: `hours`, perHour: 1, clock: true },
      { label: `cigarettes, at his pace`, perHour: 2 },
      { label: `pegs`, perHour: 3 },
      { label: `times he'll say "bas ek last"`, perHour: 4 },
    ],
    // the line under the number changes with the date
    line: {
      before: `Birthday in {n} days. Party {rel}.`,
      beforeTomorrow: `Birthday tomorrow. Party {rel}.`,
      birthday: `A year older today. Party's {when}.`,
      between: `Birthday was {ago}. Party's {when}.`,
      partyday: `{tonight}, {time}. Hydrate.`,
      running: `It's on. You're late.`,
      after: `You missed it. Or you were there and don't remember.`,
    },
    // the little pieces the lines above are built from
    rel: { same: `the same night`, next: `the day after`, after: `{n} days after`, prev: `the day before`, before: `{n} days before` },
    when: { tomorrow: `tomorrow`, inDays: `in {n} days` },
    ago: { yesterday: `yesterday`, daysAgo: `{n} days ago` },
    daysLabel: `days`, // more than two days after the party, the first unit counts days instead of hours
    map: `Open map`, // appears once the party is on, if you added a map link
  },

  // scene 5: the ticket
  rsvp: {
    admit: `Admit one`,
    no: `No. {ticketNo}`,
    title: `{name}'s Birthday`,
    date: `Date`,
    time: `Time`,
    place: `Place`,
    dateVal: `{date}`,
    timeVal: `{time}`,
    placeVal: `{place}`,
    stub: `Stub`,
    fine: `Statutory warning: may cause a {nextWeekday} hangover. Guard your lighter. Nobody drives home.`,
    ask: `Coming?`,
    yes: `Obviously`,
    nope: `Can't make it`, // this button never works
    guilt: [`He came at 3 AM when your car died.`, `He helped you shift. Fourth floor. No lift.`, `He's already booked your cab home.`],
    noOption: `No option left. See you {weekday}.`,
    stampTop: `counted`,
    stampBig: `IN`,
    stampBottom: `{dots}`,
    done: `Knew it. Now tell him.`,
    whatsapp: `Open WhatsApp`,
    calendar: `Add to calendar`,
    calendarFail: `Nothing happened?`, // shows for a few seconds after "Add to calendar", in the same row as the small links
    calendarGoogle: `Google`,
    calendarGoogleLabel: `Add to Google Calendar`,
    calendarFile: `File`,
    calendarFileLabel: `Download the calendar file`,
    map: `Open map`,
    poster: `Make a poster`, // the small link under the buttons that goes to the Print Room
  },

  // scene 6 (after the ticket): the Print Room. Pick a style, pick a line, send the poster round.
  //
  // TO CHANGE A POSTER LINE  edit `lines`. Keep each one under 40 characters AFTER the {words} are filled in
  //                          (the box where guests type their own stops at 40 too). {name} {weekday} {time} work here.
  // TO ADD ONE               add a new line inside the square brackets. More is fine. They come round in a shuffled order.
  // The three looks (Subway, Swiss, Scan) are drawn in src/scenes/posters.js. `styles` only holds their names.
  print: {
    title: `The Print Room`, // the small line above the poster
    hint: `tap the poster for another line`,
    styleLabel: `Poster style`, // screen readers, for the three buttons
    styles: [
      { id: `subway`, name: `Subway` },
      { id: `swiss`, name: `Swiss` },
      { id: `scan`, name: `Scan` },
    ],
    meta: `{style} · {n}/{total}`, // top right: which look, which line
    metaOwn: `{style} · yours`, // the same, once the guest has typed their own line
    another: `Another line`, // what a screen reader calls the round arrows
    write: `Write your own`, // the pencil. also the title of the typing sheet
    share: `Share`,
    sharing: `Sharing…`, // on the Share button while the phone's share sheet is open
    posterLabel: `{style} poster. {line}`, // read out by screen readers
    shareTitle: `{name}'s birthday`, // goes with the picture into WhatsApp, Instagram and the rest
    shareText: `{name}'s birthday. {date}, {time}.`,
    fileName: `{name}-birthday-{style}`, // the saved file: yuvraj-birthday-swiss.png (lowercase, no spaces)
    designedBy: `Designed by {by}`, // printed on the poster, only if the guest adds a name

    sheet: {
      line: `Your line`,
      linePlaceholder: `Up to 40 characters`,
      count: `{n}/{max}`,
      by: `Designed by`,
      byPlaceholder: `Your name, optional`,
      done: `Print it`,
      cancel: `Cancel`,
    },

    // if the phone cannot share a picture (some in-app browsers cannot), the poster opens big instead
    save: {
      title: `Save your poster`,
      note: `Press and hold the poster, then save it.`,
      download: `Download`,
      close: `Close`,
    },

    // the lines. the first one is always the first poster, the rest come in a shuffled order.
    lines: [
      `Bas ek last.`,
      `Picks up at 3 AM.`,
      `Nobody drives home.`,
      `Admit one. Bring your own lighter.`,
      `Warning: contains {name}.`,
      `No filter. Unlike his cigarettes.`,
      `Last peg. Allegedly.`,
      `Your problem is now his.`,
      `Sorted. Ask {name}.`,
      `Location bhej.`,
      `Hydrate. Then don't.`,
      `Cab already booked. By him.`,
      `Carries everyone. Borrows your lighter.`,
      `He'll fix it. Then ask for a light.`,
      `{weekday}, {time}. Show up.`,
      `Kal se pakka band.`,
      `Ceasefire by voice note.`,
      `Ashtray: full. Phone: 4%.`,
      `Anything is an ashtray.`,
      `Zero sugar. Full of ash.`,
    ],
  },

  // scene 7: the end card. Closing time.
  end: {
    eyebrow: `Closing time`,
    bigA: `See you`,
    bigB: `{weekday}.`,
    note: `Bring your own lighter.`,
    again: `Light it again`, // starts the whole thing over, from the dark
  },

  // The rooms. Every scene is a room, numbered in the order they come. The search lists them, and tapping one takes you there.
  // `line` is the little description under the name in the search. `words` are extra words that find the room.
  // {objects} is how many things are in the Collection.
  rooms: [
    { id: `scene-name`, name: `The Man`, line: `Tap the name. He coughs.`, words: [`name`, `cough`, `hello`, `top`] },
    { id: `scene-quiz`, name: `The Quiz`, line: `Three questions. One answer, every time.`, words: [`quiz`, `question`, `test`, `answer`] },
    { id: `scene-collection`, name: `The Collection`, line: `{objects} objects. Collect the ones you know.`, words: [`collection`, `museum`, `collect`, `cards`, `colour`, `color`, `objects`] },
    { id: `scene-count`, name: `{name} Time`, line: `Hours, cigarettes, pegs. In his units.`, words: [`countdown`, `count`, `clock`, `hours`, `days`, `timer`, `units`] },
    { id: `scene-rsvp`, name: `Box Office`, line: `Say yes. Get the ticket. Add it to your calendar.`, words: [`rsvp`, `ticket`, `coming`, `yes`, `whatsapp`, `calendar`, `invite`, `stub`] },
    { id: `scene-print`, name: `The Print Room`, line: `Pick a look. Pick a line. Send it round.`, words: [`poster`, `print`, `share`, `picture`, `image`, `save`, `design`] },
    { id: `scene-end`, name: `Closing Time`, line: `{weekday}, {time}. Light it again.`, words: [`end`, `closing`, `again`, `bye`, `last`] },
  ],

  // The search. The magnifier in the top bar opens it. It looks through the objects in the Collection and through the rooms,
  // and a few questions get a straight answer.
  //
  // TO ADD AN ANSWER  copy one { ... } line inside `answers`. `words` is what a guest might type (a whole word, or the start of one).
  //                   `line` is what comes back. {date} {dateLong} {time} {ends} {place} {name} work in it.
  // TO MAKE AN OBJECT EASIER TO FIND  add words to its `tags` in collection.objects.
  archive: {
    open: `Search the collection`, // the magnifier in the top bar (screen readers)
    title: `Search the collection`, // the small line at the top of the sheet
    close: `Close`, // the X (screen readers)
    inputLabel: `Search`, // screen readers
    placeholder: `Try "lighter"`,
    hint: `{objects} objects, {rooms} rooms. Ask anything.`, // before you type
    hintMissing: `{objects} objects, {rooms} rooms, {missing} missing. Ask anything.`, // the same, while the cake card is in the Collection
    suggest: [`lighter`, `3 AM`, `sleep`, `where`], // little buttons under the hint. Tap one to search for it
    suggestLabel: `Try`, // screen readers, before those buttons
    count: `{n} records`, // above the results
    countOne: `1 record`,
    none: `Nothing under "{q}". Ask {name}, he knows a guy.`,
    kind: { object: `Acc. no. {accession}`, room: `Room {n}`, extra: `Credits`, answer: `No record`, missing: `Missing object` }, // the small label above each result
    go: `Open`, // screen readers, on a result that takes you somewhere
    extras: [{ id: `fonts`, name: `Fonts in use`, line: `Three typefaces, and who made them.`, words: [`font`, `fonts`, `typeface`, `type`, `credits`, `colophon`, `designer`] }],
    answers: [
      { words: [`sleep`, `nap`, `rest`, `bed`, `tired`], line: `Not held. Last seen in 2019.` },
      { words: [`money`, `cash`, `pay`, `paid`, `bill`, `wallet`], line: `On loan. Ask who paid for the cab.` },
      { words: [`gym`, `diet`, `salad`, `fitness`, `healthy`], line: `Pending. Starts tomorrow.` },
      { words: [`water`, `hydrate`, `juice`, `thirsty`], line: `Out of stock. Check the glass.` },
      { words: [`sober`, `early`, `leave`, `home`], line: `Nobody leaves before {ends}. Nobody drives home.` },
      { words: [`gift`, `present`, `cake`, `balloons`, `bring`], line: `Gift: show up. Cake: not held. Lighter: bring your own.` },
      { words: [`when`, `date`, `day`, `time`], line: `{dateLong}, {time} till {ends}.` },
      { words: [`where`, `venue`, `place`, `address`, `location`, `map`], line: `Venue: {place}.` },
      { words: [`dress`, `wear`, `outfit`, `code`], line: `Dress code: what he wore yesterday.` },
    ],
  },

  // The credits for the type: "Fonts in use", a link on the last screen. The names are from each font's own project page
  // (the address is in the comment), so keep them accurate. `rows` are [label, text] pairs, like on the Collection cards.
  colophon: {
    link: `Fonts in use`, // the small link on the last screen
    title: `Fonts in use`,
    close: `Close`,
    intro: `Three typefaces. That is the whole wardrobe.`,
    foot: `All three are open source (SIL Open Font License 1.1) and served from this page.`,
    fonts: [
      {
        family: `League Gothic`,
        face: `display`, // which of the page's three faces to set the name in: display, serif or mono
        rows: [
          [`Designers`, `Caroline Hadilaksono, Micah Rich, Tyler Finck`],
          [`Foundry`, `The League of Moveable Type`],
          [`After`, `Alternate Gothic No. 1, Morris Fuller Benton, ATF, 1903`],
          [`Year`, `2009 to 2011`],
          [`Used for`, `Every big line. Does not do whispering.`],
        ], // github.com/theleagueof/league-gothic
      },
      {
        family: `Instrument Serif`,
        face: `serif`,
        rows: [
          [`Designer`, `Rodrigo Fuenzalida`],
          [`Direction`, `Jordan Egstad, JD Hooge, Jack De Caluwé`],
          [`Foundry`, `Instrument`],
          [`Year`, `2022`],
          [`Used for`, `The jokes. The italic is for the dry ones.`],
        ], // github.com/Instrument/instrument-serif
      },
      {
        family: `DM Mono`,
        face: `mono`,
        rows: [
          [`Designer`, `Colophon Foundry`],
          [`Commissioned by`, `DeepMind`],
          [`Year`, `2020`],
          [`Used for`, `The small print. Dates, numbers, paperwork.`],
        ], // github.com/googlefonts/dm-mono
      },
    ],
  },

  // the message that opens in WhatsApp when someone says Obviously
  whatsapp: {
    withPlace: `I'm in. {name}'s birthday, {date}, {time}, {place}. Obviously.`,
    noPlace: `I'm in. {name}'s birthday, {date}, {time}. Obviously. Location bhej.`, // used until you add a venue
    // one extra line, only if the guest collected something in the Collection. at most three names, then "+N more".
    collected: `Collected: {list}.`,
    more: `+{n} more`,
  },

  // the "add to calendar" entry
  calendar: {
    title: `{name}'s birthday`,
    description: `{dayJoke} Nobody drives home.`,
  },

  // the title of the browser tab and the preview card when the link is shared
  meta: {
    title: `{name}'s birthday · {date} · {time}`,
    description: `{dayJoke} Spin the wheel.`,
    noscript: `{name}'s birthday. {dateLong}, {time}. This page needs JavaScript for the full show.`,
  },

  // THE DAY AFTER. Once the party is over (the page asks the clock, so it follows party.config.js), the lines below take the
  // place of the lines with the same name above. Everything else stays as it was. The tab title, the preview card and the
  // calendar file are made when the site is built, so they never change.
  //
  // TO CHANGE ONE  edit its words. {tokens} work here too ({weekday} {nextWeekday} {date} {dateLong} {partyDay} {time} {ends} {name}).
  // TO ADD ONE     write it under the same group as the line it replaces (hero, rsvp, end ...), with the same name.
  // Lists: a list written as a list replaces the whole list. An object, like { 14: `...` }, replaces single items:
  // the key is the item's `id` (an object in the Collection, a room) or its place in the list, counting from 0.
  after: {
    bar: { rsvp: `ticket` }, // the link in the top bar. there is nothing left to RSVP to
    disclaimer: { done: `Skipping this party was worse.` },
    hero: {
      weekdayLine: `It was a {weekday}. {nextWeekday} was everyone's problem.`,
      weekendLine: `{weekday} night. Zero excuses were accepted.`,
    },
    collection: {
      objects: {
        man: { note: `On view {partyDay}. The lighter was never returned.` },
        course: {
          rows: [
            [`Prerequisite`, `A dead car`],
            [`Met`, `{partyDay}, {time} till late`],
          ],
        },
      },
    },
    rsvp: {
      ask: `Were you there?`,
      nope: `Don't remember`, // this button never works either
      fine: `Statutory warning: caused a {nextWeekday} hangover.`,
      guilt: [`That's how you know it was good.`, `Someone has the video. You are in it.`, `He booked your cab home. The receipt exists.`],
      noOption: `No option left. You were there.`,
      stampTop: ``, // the stamp reads WAS THERE, over the date. (before the party: "counted" / IN / the date)
      stampBig: `WAS THERE`,
      done: `Knew it. Now tell him what you remember.`,
    },
    end: {
      bigA: `Exhibition`,
      bigB: `closed.`,
      note: `Nobody drove home. The lighter is still missing.`,
    },
    rooms: {
      'scene-rsvp': { line: `Were you there? Get the ticket stamped.` },
      'scene-end': { line: `Exhibition closed. Light it again.` },
    },
    archive: {
      answers: {
        4: { line: `Nobody left before {ends}. Nobody drove home.` }, // sober, early, leave, home
        5: { line: `Gift: you showed up. Cake: not held. Lighter: not returned.` }, // gift, cake, bring
        6: { line: `It was {dateLong}, {time} till {ends}.` }, // when, date, day, time
      },
    },
    print: { lines: { 14: `{weekday}, {time}. You missed it.` } },
    // what opens in WhatsApp when someone says Obviously
    whatsapp: {
      withPlace: `I was there. {name}'s birthday, {date}. Still recovering.`,
      noPlace: `I was there. {name}'s birthday, {date}. Still recovering.`,
    },
  },
}
