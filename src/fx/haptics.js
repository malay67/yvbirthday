/*
  A short buzz, on phones that allow it (Android; iPhone Safari has no vibration).
  Only after the guest has actually touched the page. Before that the browser refuses
  and writes a warning in the console, so we do not ask.
*/
export function buzz(pattern = 12) {
  try {
    if (!('vibrate' in navigator)) return
    const ua = navigator.userActivation
    if (ua && !ua.hasBeenActive) return
    navigator.vibrate(pattern)
  } catch {}
}
