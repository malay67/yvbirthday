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
     {dayJoke}                 the day-of-the-week joke. It switches itself to
                               the weekend version when the party is on one.

   Keep jokes short. The page shows very few words at a time on purpose.
*/

export const copy = {
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
  // In every list of answers, the one that says {name} is the right one.
  quiz: {
    title: `Who do you call?`,
    right: `Correct.`,
    questions: [
      { q: `3 AM. Car's dead. You call...`, options: [`Mom`, `Insurance`, `{name}`], punch: `Even Mom would call {name}.` },
      { q: `Group chat war. 200 unread. Who fixes it?`, options: [`Admin`, `Time`, `{name}`], punch: `One voice note. Ceasefire.` },
      { q: `Need a lighter?`, options: [`Shop`, `{name}`], punch: `He has four. None are his.` },
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
  collection: {
    title: `The {name} Collection`, // the small line above the cards
    acc: `Acc. no. {accession}`, // top of every card. the number is worked out for you
    prev: `Previous object`, // what a screen reader calls the arrows
    next: `Next object`,
    collect: `Collect`, // the big button
    uncollect: `Put back`, // the same button, once that object is collected
    stamp: `Collected`, // the red stamp on a collected card
    punchCount: `{n} / {total}`, // on the big button: how many he has
    shuffle: `Shuffle`, // screen readers only, the button is a drawing of two arrows
    showAll: `Show all`, // puts every card back after you pick a colour
    byColour: `by colour`, // beside the five colour squares
    colourLabel: `Explore by colour`, // screen readers
    colourPicked: `{colour} {hex}`, // replaces the title while a colour is picked
    slide: `{title}, {n} of {total}`, // screen readers, when the card changes
    stubCount: `{n}/{total}`, // on the ticket stub, under the little punch card

    // five colours. the hex codes are real: they paint the squares and tint the room.
    swatches: [
      { id: `amber`, name: `Last Peg Amber`, hex: `#E9A23B` },
      { id: `black`, name: `3 AM Black`, hex: `#0A0807` },
      { id: `ash`, name: `Ash`, hex: `#A39A8D` },
      { id: `ember`, name: `Ember`, hex: `#FF6A2B` },
      { id: `yellow`, name: `Kaali-Peeli Yellow`, hex: `#F4C20D` },
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
      },
      {
        id: `ashtray`,
        short: `the ashtray`,
        title: `Ashtray`,
        sub: ``,
        rows: [
          [`Medium`, `Glass, ash, good intentions`],
          [`Condition`, `Full`],
        ],
        note: `Quitting tomorrow. Tomorrow is running late.`,
        colours: [`ash`, `ember`],
        art: `ashtray`,
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
      },
    ],
  },

  // scene 3 (now scene 4): the countdown, in Yuvraj time
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
    map: `Open map`, // appears once the party is on, if you added a map link
  },

  // scene 4: the ticket
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
    again: `Light it again`,
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
}
