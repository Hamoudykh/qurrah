import { html, mount } from '../core/dom.js';
import { t, fmtNum } from '../core/i18n.js';
import { TRANSLATIONS, TAFSIRS, RECITERS } from '../core/api.js';
import { META_SOURCE } from '../data/meta.js';
import { LEVEL_RULES } from '../data/catalog.js';
import { FIQH_DISCLAIMER } from '../data/fiqh.js';
import { ctext } from './ui.js';

const a = (href, label) => html`<a href="${href}" target="_blank" rel="noopener noreferrer" dir="ltr">${label}</a>`;

export async function render(ctx) {
  ctx.setTitle(t('sourcesAndCredits'));
  mount(ctx.el, html`
    <section class="card">
      <h3>${t('principles')}</h3>
      <ul class="bullets">
        <li>${t('principle1')}</li>
        <li>${t('principle2')}</li>
        <li>${t('principle3')}</li>
        <li>${t('principle4')}</li>
      </ul>
    </section>

    <section class="card">
      <h3>${t('quranText')}</h3>
      <ul class="bullets">
        <li>${t('srcPrimary')}: ${a('https://api.quran.com/api/v4', 'Quran.com API v4')} — ${t('uthmaniScript')} (<code>text_uthmani</code>)</li>
        <li>${t('srcFallback')}: ${a('https://alquran.cloud/api', 'AlQuran.cloud API')} — <code>quran-uthmani</code> (${a('https://tanzil.net', 'Tanzil')})</li>
        <li>${t('srcWbw')}: Quran.com (${t('wordByWordSource')})</li>
      </ul>
      <h3>${t('translationsUsed')}</h3>
      <ul class="bullets">
        <li>${t('english')}: <strong>${TRANSLATIONS.en.name}</strong> (Quran.com #${TRANSLATIONS.en.id}; ${t('srcFallback')}: <code>${TRANSLATIONS.en.fallback}</code>)</li>
        <li>${t('hebrew')}: <strong>${TRANSLATIONS.he.name}</strong> (Quran.com #${TRANSLATIONS.he.id}) — ${t('hebrewNote')}</li>
        <li>${t('transliteration')}: ${TRANSLATIONS.translit.name} (#${TRANSLATIONS.translit.id}) — ${t('translitNote')}</li>
        <li>${t('simpleMeaning')}: <strong>${TAFSIRS.muyassar.name}</strong> (Quran.com #${TAFSIRS.muyassar.id}; ${t('srcFallback')}: <code>${TAFSIRS.muyassar.fallback}</code>)</li>
        <li>${t('ibnKathir')}: ${TAFSIRS.ibnKathir.name} (Quran.com #${TAFSIRS.ibnKathir.id})</li>
      </ul>
      <h3>${t('recitersUsed')}</h3>
      <ul class="bullets">${RECITERS.map((r) => html`<li>${r.name} (Quran.com #${r.id}; ${t('srcFallback')}: <code>${r.fb}</code> @ cdn.islamic.network)</li>`)}</ul>
    </section>

    <section class="card" id="levels">
      <h3>${t('howLevelsWork')}</h3>
      <p>${t('levelsExplain')}</p>
      <ul class="bullets">
        <li><strong>${t('level_easy')}</strong>: ${t('levelRule_easy', { words: fmtNum(LEVEL_RULES.easy.maxWords), ayah: fmtNum(LEVEL_RULES.easy.maxAyahWords) })}</li>
        <li><strong>${t('level_medium')}</strong>: ${t('levelRule_medium', { words: fmtNum(LEVEL_RULES.medium.maxWords), ayah: fmtNum(LEVEL_RULES.medium.maxAyahWords) })}</li>
        <li><strong>${t('level_hard')}</strong>: ${t('levelRule_hard', { words: fmtNum(45), ayah: fmtNum(18) })}</li>
      </ul>
      <p class="small muted">${t('metaGenerated', { date: META_SOURCE.generated.slice(0, 10) })}</p>
    </section>

    <section class="card">
      <h3>${t('hadithAndFiqh')}</h3>
      <p>${t('hadithMethod')}</p>
      <p>${ctext(FIQH_DISCLAIMER)}</p>
      <p class="small">${t('toVerifyNote')}</p>
    </section>

    <section class="card">
      <h3>${t('prayerTimes')} & ${t('qibla')}</h3>
      <ul class="bullets">
        <li>${a('https://github.com/batoulapps/adhan-js', 'Adhan JavaScript')} 4.4.6 (MIT) — ${t('adhanNote')}</li>
        <li>${t('qiblaFormula')}</li>
        <li>${t('citySearch')}: ${a('https://open-meteo.com/en/docs/geocoding-api', 'Open-Meteo Geocoding API')} (${t('citySearchNote')})</li>
      </ul>
    </section>

    <section class="card">
      <h3>${t('fontsAndCode')}</h3>
      <ul class="bullets">
        <li>Amiri Quran — ${a('https://github.com/aliftype/amiri', 'Amiri Project')} (SIL OFL 1.1)</li>
        <li>Noto Naskh Arabic, Noto Sans Hebrew — Google Noto (SIL OFL 1.1)</li>
        <li>${t('noTracking')}</li>
      </ul>
    </section>`);
}
