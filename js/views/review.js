import { html, mount, on } from '../core/dom.js';
import { t, fmtNum } from '../core/i18n.js';
import { getState, reviewItem } from '../core/store.js';
import { dueQueue, review as preview, GRADES } from '../logic/srs.js';
import { itemFromId } from '../data/catalog.js';
import { player } from '../core/audio.js';
import { settings } from '../core/store.js';
import { ic, itemTitle, rangeLabel, loading, errorBox } from './ui.js';
import { loadPassage, wordsHTML, ayahEnd, arabicStyle, queueAudio } from './passage.js';

export async function render(ctx) {
  ctx.setTitle(t('review'));
  const queue = dueQueue(Object.entries(getState().items).map(([id, st]) => ({ id, srs: st.srs })).filter((x) => x.srs));
  let i = 0;
  let show = 'none'; // none | first | all
  let p = null;
  let done = 0;

  const drawDone = () => mount(ctx.el, html`<section class="card center">
    <div class="ornament" aria-hidden="true">${ic('leaf')}</div>
    <h2>${done ? t('reviewsComplete') : t('noReviewsDue')}</h2>
    <p class="muted">${done ? t('reviewsCompleteN', { count: done, n: fmtNum(done) }) : t('noReviewsDueHint')}</p>
    <a class="btn primary" href="#/">${t('backToToday')}</a></section>`);

  const draw = () => {
    if (i >= queue.length) { drawDone(); return; }
    const item = itemFromId(queue[i].id);
    const st = getState().items[item.id];
    const hide = show === 'all' ? null : show === 'first' ? (k) => k > 0 : () => true;
    mount(ctx.el, html`
      <p class="muted small">${t('reviewCount', { i: fmtNum(i + 1), n: fmtNum(queue.length) })}</p>
      <section class="card">
        <h2>${itemTitle(item)}</h2>
        <p class="muted" dir="ltr">${rangeLabel(item)}</p>
        <p>${t('reviewInstruction')}</p>
        <div class="row gap wrap">
          <button class="btn" data-act="first">${ic('eye')} ${t('showFirstWords')}</button>
          <button class="btn" data-act="all">${ic('text')} ${t('showText')}</button>
          <button class="btn ghost" data-act="listen">${ic('play')} ${t('listen')}</button>
        </div>
      </section>
      <div class="ayahs" style="${arabicStyle()}" id="rv">${p && p.item.id === item.id ? p.verses.map((v) => html`<p class="quran" lang="ar" dir="rtl">${wordsHTML(v, { hide })}${ayahEnd(v.n)}</p>`) : loading()}</div>
      <section class="card">
        <p class="small muted">${t('howDidItGo')}</p>
        <div class="grades">${GRADES.map((g) => {
          const next = preview(st.srs, g);
          return html`<button class="btn grade-${g}" data-grade="${g}"><strong>${t(`grade_${g}`)}</strong><span class="small">${t('inNDays', { count: next.interval, n: fmtNum(next.interval) })}</span></button>`;
        })}</div>
      </section>`);
    if (!p || p.item.id !== item.id) {
      loadPassage(item, { tafsir: false }).then((x) => { p = x; if (ctx.isCurrent()) draw(); }).catch((e) => { if (ctx.isCurrent()) mount(ctx.el.querySelector('#rv'), errorBox(e)); });
    }
  };
  draw();

  const off = on(ctx.el, 'click', '[data-act], [data-grade]', async (e, b) => {
    if (b.dataset.grade) {
      reviewItem(queue[i].id, b.dataset.grade);
      done++; i++; show = 'none'; player.stop();
      draw();
      return;
    }
    const a = b.dataset.act;
    if (a === 'first') { show = 'first'; draw(); }
    if (a === 'all') { show = 'all'; draw(); }
    if (a === 'retry') { p = null; draw(); }
    if (a === 'listen' && p) { await queueAudio(p); player.setOptions({ repeat: 1, gap: 'off', autoAdvance: true, rangeRepeat: 1, cache: settings().cacheAudio }); player.playIndex(0); }
  });
  return off;
}
