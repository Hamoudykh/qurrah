// Tiny, dependency-free templating with escaping by default.
// html`<p>${userText}</p>` escapes interpolations; wrap trusted markup in raw().

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s ?? ''));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function renderVal(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(renderVal).join('');
  return esc(v);
}

export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) out += renderVal(vals[i]);
  });
  return new Raw(out);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function mount(el, content) {
  el.innerHTML = String(content);
  return el;
}

/** Remove footnote markers (<sup …>1</sup>) and all tags from API translation text. */
export function plainText(s) {
  if (!s) return '';
  const noSup = String(s).replace(/<sup[^>]*>.*?<\/sup>/gi, '');
  if (typeof DOMParser === 'undefined') return noSup.replace(/<[^>]+>/g, '').trim();
  const doc = new DOMParser().parseFromString(`<body>${noSup}</body>`, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

const ALLOWED = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SPAN', 'DIV', 'SUP']);

/** Allow-list sanitizer for tafsir HTML from the API. Drops all attributes except dir/lang. */
export function sanitizeHtml(s) {
  if (!s) return raw('');
  const doc = new DOMParser().parseFromString(`<body>${s}</body>`, 'text/html');
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 1) {
        if (!ALLOWED.has(child.tagName)) {
          // Keep text of unknown elements, drop scripts/styles entirely.
          if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].includes(child.tagName)) child.remove();
          else { walk(child); child.replaceWith(...child.childNodes); }
          continue;
        }
        for (const a of [...child.attributes]) if (!['dir', 'lang'].includes(a.name)) child.removeAttribute(a.name);
        walk(child);
      } else if (child.nodeType !== 3) {
        child.remove();
      }
    }
  };
  walk(doc.body);
  return raw(doc.body.innerHTML);
}

/** Event delegation: on(root, 'click', '[data-act="x"]', handler) */
export function on(root, type, selector, handler, opts) {
  const fn = (e) => {
    const t = e.target.closest(selector);
    if (t && root.contains(t)) handler(e, t);
  };
  root.addEventListener(type, fn, opts);
  return () => root.removeEventListener(type, fn, opts);
}

export function toast(msg, ms = 2600) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

/** Download a text file (used for .ics and backups). */
export function downloadFile(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
