/*
  Open a link in a new tab and say whether that worked.
  Do not pass 'noopener' as a feature here: with it, window.open() returns null even when the tab
  did open, so "null means blocked" would send this page away as well. Open plainly, then cut the opener.
*/
export function openTab(url) {
  let w = null
  try {
    w = window.open(url, '_blank')
  } catch {}
  if (!w) return false
  try {
    w.opener = null
  } catch {}
  return true
}

/* a new tab if the phone allows it, otherwise this tab. never both. */
export function goTo(url) {
  if (!openTab(url)) window.location.href = url
}
