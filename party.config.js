/*
  ====================================================================
   PARTY SETTINGS
   This is the only file you need to edit for dates, times and places.
  ====================================================================

   HOW TO CHANGE SOMETHING
     1. Change the text between the quote marks. Keep the quote marks.
     2. Save this file.
     3. Run  npm run build  and upload the "dist" folder again.
        (While testing, run  npm run dev  and the page updates by itself.)

   DATES are written DAY/MONTH/YEAR.   12/10/2026 means 12 October 2026.
   TIMES are written like  8:00 PM  or  9:30 PM.

   If a line is typed wrong, the page shows a message that says which
   line to fix. You cannot break anything by trying.

   The words and jokes are in a different file: src/copy.js
*/

export default {
  // His name, as it appears everywhere.
  name: 'Yuvraj',

  // His actual birthday.  DAY/MONTH/YEAR
  birthday: '11/10/2026',

  // The day of the party.  DAY/MONTH/YEAR
  partyDate: '12/10/2026',

  // When the party starts, and when it ends.
  // If it ends after midnight, just write the time, like '2:00 AM'.
  partyTime: '8:00 PM',
  partyEnds: '2:00 AM',

  // The time zone of the party. India is '+05:30'.
  // Only change this if the party is outside India.
  timezone: '+05:30',

  // Where it is. Leave '' (empty) and the page says "Pin on WhatsApp".
  venue: '',

  // The Google Maps link for the place. Leave '' and there is no map button.
  mapLink: '',

  // The WhatsApp number that gets the "I'm in" messages, with the country code,
  // for example '919876543210'. Leave '' and WhatsApp simply opens and the
  // guest picks who to send it to.
  rsvpWhatsApp: '',

  // His age, for the "Aged 25 years." joke. Leave '' to skip the joke.
  age: '',

  // The web address of the finished site, for example 'https://yuvraj-bday.netlify.app'
  // Needed for the picture that shows up when you share the link on WhatsApp.
  // Leave '' until you have the address.
  siteUrl: '',
}
