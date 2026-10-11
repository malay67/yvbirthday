/*
  If party.config.js has a typo, say exactly which line and what to write instead.
  Plain inline styles on purpose: this has to work even if nothing else does.
*/
export function showConfigError(errors) {
  const css = (el, s) => {
    el.style.cssText = s
    return el
  }
  const make = (tag, s, text) => {
    const el = css(document.createElement(tag), s)
    if (text != null) el.textContent = text
    return el
  }

  const box = make(
    'div',
    'position:fixed;inset:0;z-index:99999;overflow:auto;-webkit-overflow-scrolling:touch;background:#0a0807;color:#ece3d3;font:17px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;padding:max(28px,env(safe-area-inset-top)) 22px max(36px,env(safe-area-inset-bottom))'
  )
  box.setAttribute('role', 'alert')

  const inner = make('div', 'max-width:560px;margin:0 auto')
  inner.append(
    make('p', 'margin:0 0 6px;font:600 13px/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#e9a23b', 'party.config.js'),
    make('h1', 'margin:0 0 22px;font-size:26px;line-height:1.2;font-weight:600', errors.length === 1 ? 'One line needs fixing' : `${errors.length} lines need fixing`)
  )

  for (const e of errors) {
    const card = make('div', 'margin:0 0 16px;padding:16px 18px;border:1px solid #3b332b;border-left:4px solid #e9a23b;border-radius:6px;background:#15110e')
    card.append(
      make('p', 'margin:0 0 8px;font:600 15px/1.3 ui-monospace,Menlo,Consolas,monospace;color:#f7c36f', `${e.line ? 'line ' + e.line + ' · ' : ''}${e.field}`),
      make('p', 'margin:0 0 8px;font:15px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#a39a8d;word-break:break-all', e.value ? `you wrote: ${e.value}` : 'you wrote: (nothing)'),
      make('p', 'margin:0', e.message)
    )
    inner.append(card)
  }

  inner.append(make('p', 'margin:24px 0 0;color:#a39a8d;font-size:15px', 'Fix it, save the file, and this page fixes itself.'))
  box.append(inner)
  document.body.append(box)
  document.documentElement.classList.remove('is-locked', 'is-frozen')
  document.title = 'party.config.js needs fixing'
}
