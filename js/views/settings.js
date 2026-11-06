import { html, mount, on, toast, downloadFile } from '../core/dom.js';
import { t, LANGS, getLang, fmtNum } from '../core/i18n.js';
import { settings, setSetting, exportJSON, importJSON, resetAll } from '../core/store.js';
import { RECITERS, cacheStats, clearCaches } from '../core/api.js';
import { requestPermission, permission, notificationsSupported } from '../core/notify.js';
import { dailyReminderIcs } from '../logic/ics.js';
import { ic } from './ui.js';

export async function render(ctx) {
  ctx.setTitle(t('settings'));
  const draw = async () => {
    if (!ctx.isCurrent()) return;
    const s = settings();
    const stats = await cacheStats().catch(() => null);
    if (!ctx.isCurrent()) return;
    const mb = stats?.usage != null ? (stats.usage / 1048576).toFixed(1) : null;
    mount(ctx.el, html`
      <section class="card">
        <h3>${t('appearance')}</h3>
        <div class="ctl"><span class="ctl-label">${t('language')}</span><div class="seg small" role="radiogroup">
          ${LANGS.map((l) => html`<button role="radio" aria-checked="${getLang() === l.id}" class="${getLang() === l.id ? 'on' : ''}" data-lang="${l.id}" lang="${l.id}">${l.name}</button>`)}</div></div>
        <div class="ctl"><span class="ctl-label">${t('theme')}</span><div class="seg small" role="radiogroup">
          ${['system', 'light', 'dark'].map((v) => html`<button role="radio" aria-checked="${s.theme === v}" class="${s.theme === v ? 'on' : ''}" data-theme-set="${v}">${t(`theme_${v}`)}</button>`)}</div></div>
        <label class="field"><span>${t('arabicSize')} · <span dir="ltr">${s.arabicSize}px</span></span>
          <input type="range" min="22" max="64" step="1" value="${s.arabicSize}" data-set="arabicSize"></label>
        <p class="quran preview" lang="ar" dir="rtl" style="--qsize:${s.arabicSize}px">${t('arabicPreviewNote')}</p>
      </section>

      <section class="card">
        <h3>${t('reading')}</h3>
        <label class="field"><span>${t('translation')}</span><select data-set="translation">
          ${['auto', 'en', 'he', 'both', 'off'].map((v) => html`<option value="${v}" ${s.translation === v ? 'selected' : ''}>${t(`tr_${v}`)}</option>`)}</select></label>
        <label class="switch-row"><input type="checkbox" data-bool="showTranslit" ${s.showTranslit ? 'checked' : ''}><span>${t('showTranslit')}</span></label>
        <label class="switch-row"><input type="checkbox" data-bool="showMeaning" ${s.showMeaning ? 'checked' : ''}><span>${t('showMuyassar')}</span></label>
        <label class="field"><span>${t('reciter')}</span><select data-set="reciter">
          ${RECITERS.map((r) => html`<option value="${r.id}" ${s.reciter === r.id ? 'selected' : ''}>${getLang() === 'ar' ? r.ar : r.name}</option>`)}</select></label>
        <label class="switch-row"><input type="checkbox" data-bool="cacheAudio" ${s.cacheAudio ? 'checked' : ''}><span>${t('cacheAudioSetting')}</span></label>
      </section>

      <section class="card">
        <h3>${ic('bell')} ${t('dailyVerseReminder')}</h3>
        ${notificationsSupported() ? html`<label class="switch-row"><input type="checkbox" data-act="daily-notify" ${s.daily.notify && permission() === 'granted' ? 'checked' : ''}><span>${t('notifyDaily')}</span></label>` : ''}
        <label class="field inline"><span>${t('time')}</span><input type="time" value="${s.daily.time}" data-daily-time></label>
        <p class="small note">${t('notifyLimitation')}</p>
        <button class="btn" data-act="daily-ics">${ic('calendar')} ${t('exportDailyCalendar')}</button>
      </section>

      <section class="card">
        <h3>${t('yourData')}</h3>
        <p class="small muted">${t('dataLocalNote')}</p>
        <div class="row wrap gap">
          <button class="btn" data-act="export">${ic('download')} ${t('exportBackup')}</button>
          <label class="btn">${t('importBackup')}<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        </div>
        <p class="small muted">${stats ? t('cacheInfo', { data: fmtNum(stats.data), audio: fmtNum(stats.audio) }) : ''}${mb ? ` · ${t('storageUsed', { mb })}` : ''}</p>
        <div class="row wrap gap">
          <button class="btn ghost" data-act="clear-cache">${t('clearCache')}</button>
          <button class="btn danger" data-act="reset">${t('resetAll')}</button>
        </div>
      </section>`);
  };
  await draw();

  const offs = [
    on(ctx.el, 'click', '[data-lang]', (e, b) => setSetting('lang', b.dataset.lang)),
    on(ctx.el, 'click', '[data-theme-set]', (e, b) => { setSetting('theme', b.dataset.themeSet); draw(); }),
    on(ctx.el, 'input', 'input[type=range][data-set]', (e, inp) => {
      setSetting(inp.dataset.set, +inp.value);
      const pv = ctx.el.querySelector('.preview'); pv.style.setProperty('--qsize', `${inp.value}px`);
      inp.previousElementSibling.querySelector('span[dir]').textContent = `${inp.value}px`;
    }),
    on(ctx.el, 'change', 'select[data-set]', (e, sel) => { setSetting(sel.dataset.set, sel.dataset.set === 'reciter' ? +sel.value : sel.value); }),
    on(ctx.el, 'change', '[data-bool]', (e, inp) => setSetting(inp.dataset.bool, inp.checked)),
    on(ctx.el, 'change', '[data-daily-time]', (e, inp) => setSetting('daily.time', inp.value || '08:00')),
    on(ctx.el, 'change', '[data-act=daily-notify]', async (e, inp) => {
      if (inp.checked) { const p = await requestPermission(); setSetting('daily.notify', p === 'granted'); if (p !== 'granted') toast(t('notifyDenied')); }
      else setSetting('daily.notify', false);
      draw();
    }),
    on(ctx.el, 'change', 'input[type=file][data-act=import]', async (e, inp) => {
      const f = inp.files?.[0];
      if (!f) return;
      try { importJSON(await f.text()); toast(t('importDone')); draw(); } catch { toast(t('importFailed')); }
    }),
    on(ctx.el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act;
      if (a === 'export') downloadFile(`qurrah-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJSON(), 'application/json');
      if (a === 'daily-ics') {
        downloadFile('qurrah-daily-verse.ics', dailyReminderIcs({ time: settings().daily.time, title: t('dailyVerse'), description: t('dailyNotifyBody') }), 'text/calendar');
        toast(t('icsExported'));
      }
      if (a === 'clear-cache') { if (confirm(t('confirmClearCache'))) { await clearCaches(); toast(t('cacheCleared')); draw(); } }
      if (a === 'reset') { if (confirm(t('confirmReset'))) { resetAll(); location.hash = '#/welcome'; } }
    }),
  ];
  return () => offs.forEach((f) => f());
}
