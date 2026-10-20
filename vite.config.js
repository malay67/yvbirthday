import { defineConfig } from 'vite'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import party from './party.config.js'
import { copy } from './src/copy.js'
import { check, withLines, calendarParts, metaParts, buildIcs } from './src/lib/party.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/*
  Everything that has to be right before the page even loads:
    - the tab title and the WhatsApp link preview (they are read from the HTML, not the running page)
    - a real party.ics file, for iPhones that will not take a download made on the fly
  All of it comes from party.config.js and src/copy.js.
*/
/*
  The address the finished site will have, for the WhatsApp card's picture (og:image) and og:url.
    1. siteUrl in party.config.js, if you typed one. It always wins.
    2. otherwise, on Vercel: https:// + VERCEL_PROJECT_PRODUCTION_URL. Vercel sets that while it builds, without the https://.
    3. otherwise nothing: the build leaves og:image out (a broken picture is worse than none).
*/
function vercelSiteUrl(env = process.env) {
  const raw = String(env.VERCEL_PROJECT_PRODUCTION_URL ?? '').trim()
  if (!raw) return ''
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return /^https?:$/.test(u.protocol) ? u.origin : ''
  } catch {
    return '' // an odd value should never break the build
  }
}

function partyPlugin() {
  const typed = String(party.siteUrl ?? '').trim()
  const fromVercel = typed ? '' : vercelSiteUrl()
  const { P, errors } = check({ ...party, siteUrl: typed || fromVercel })
  const raw = fs.readFileSync(fileURLToPath(new URL('./party.config.js', import.meta.url)), 'utf8')

  if (errors.length) {
    const bar = '='.repeat(64)
    console.error(`\n${bar}\n  party.config.js needs fixing. The site will show this message too.\n${bar}`)
    for (const e of withLines(raw, errors)) console.error(`  line ${e.line}  ${e.field}: ${JSON.stringify(e.value)}\n          ${e.message}`)
    console.error(`${bar}\n`)
  }

  const meta = P ? metaParts(P, copy) : null
  const ics = P ? buildIcs(P, calendarParts(P, copy)) : ''

  return {
    name: 'party',

    // one line in the build log that says where the share-card address came from
    configResolved(resolved) {
      if (resolved.command !== 'build') return
      const where = typed ? 'siteUrl in party.config.js' : fromVercel ? 'VERCEL_PROJECT_PRODUCTION_URL' : ''
      console.log(where && P?.siteUrl ? `party: share card address ${P.siteUrl} (from ${where})` : 'party: no site address known, so no og:image in the share card (set siteUrl in party.config.js, or build on Vercel)')
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const title = meta ? meta.title : `${party.name || 'Birthday'}'s birthday`
        const tags = [`<title>${esc(title)}</title>`]
        if (meta) {
          tags.push(`<meta name="description" content="${esc(meta.description)}" />`)
          tags.push(`<meta property="og:type" content="website" />`)
          tags.push(`<meta property="og:title" content="${esc(meta.title)}" />`)
          tags.push(`<meta property="og:description" content="${esc(meta.description)}" />`)
          if (meta.url) tags.push(`<meta property="og:url" content="${esc(meta.url)}" />`)
          if (meta.image) {
            tags.push(`<meta property="og:image" content="${esc(meta.image)}" />`)
            tags.push(`<meta property="og:image:type" content="image/jpeg" />`)
            tags.push(`<meta property="og:image:width" content="1200" />`)
            tags.push(`<meta property="og:image:height" content="630" />`)
            tags.push(`<meta name="twitter:card" content="summary_large_image" />`)
          }
        }
        // which commit this build came from (Vercel sets it). after a push, load the live page until this matches the commit you pushed.
        tags.push(`<meta name="build" content="${esc(process.env.VERCEL_GIT_COMMIT_SHA || 'local')}" />`)
        return html
          .replace('<!--party:head-->', tags.join('\n  '))
          .replace('<!--party:noscript-->', esc(meta ? meta.noscript : title))
      },
    },

    // the calendar file, in the built site and in npm run dev
    generateBundle() {
      if (ics) this.emitFile({ type: 'asset', fileName: 'party.ics', source: ics })
    },
    configureServer(server) {
      server.middlewares.use('/party.ics', (req, res) => {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
        res.end(ics)
      })
    },
  }
}

// base './' so the built dist/ works from any sub-path (GitHub Pages, Netlify drop, a folder on a server).
export default defineConfig({
  base: './',
  plugins: [partyPlugin()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
  },
})
