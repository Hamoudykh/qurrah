#!/usr/bin/env node
// Regenerates js/data/cities.js — an offline fallback list for picking a city manually.
// Coordinates, time zones and localized names come from the Open-Meteo geocoding API
// (https://open-meteo.com/en/docs/geocoding-api), not from memory.
// Usage: node scripts/build-cities.mjs   (on Node 22 behind a proxy: NODE_USE_ENV_PROXY=1)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEO = 'https://geocoding-api.open-meteo.com/v1/search';

// Localized search terms where searching the English name in ar/he finds no localized match.
const LOCAL_QUERY = {
  Mecca: { ar: 'مكة', he: 'מכה' },
  Medina: { ar: 'المدينة المنورة', he: 'מדינה' },
  Singapore: { ar: 'سنغافورة', he: 'סינגפור' },
  Hyderabad: { he: 'היידראבאד' },
  'Umm el Fahm': { he: 'אום אל-פחם' },
  Jenin: { ar: 'جنين', he: "ג'נין" },
};

// Local names where the geocoder has none in Arabic/Hebrew (place names only — coordinates
// and time zones still come from the geocoder).
const NAME_OVERRIDES = {
  Karmiel: { ar: 'كرميئيل', he: 'כרמיאל' },
  'Rosh HaAyin': { ar: 'روش هعاين', he: 'ראש העין' },
  Tirah: { ar: 'الطيرة', he: 'טירה' },
  Qalansawe: { ar: 'قلنسوة', he: 'קלנסווה' },
  'Baqa al-Gharbiyye': { ar: 'باقة الغربية', he: 'באקה אל-גרביה' },
  'Kafr Kanna': { he: 'כפר כנא' },
  'Kafr Manda': { ar: 'كفر مندا' },
  'Umm el Fahm': { he: 'אום אל-פחם' },
};

// [search name, ISO country code]
const WANTED = [
  ['Mecca', 'SA'], ['Medina', 'SA'], ['Riyadh', 'SA'], ['Jeddah', 'SA'], ['Dubai', 'AE'], ['Abu Dhabi', 'AE'],
  ['Doha', 'QA'], ['Kuwait City', 'KW'], ['Manama', 'BH'], ['Muscat', 'OM'], ['Amman', 'JO'], ['Beirut', 'LB'],
  ['Damascus', 'SY'], ['Baghdad', 'IQ'], ['Cairo', 'EG'], ['Alexandria', 'EG'], ['Khartoum', 'SD'], ['Tunis', 'TN'],
  ['Algiers', 'DZ'], ['Casablanca', 'MA'], ['Rabat', 'MA'], ['Tripoli', 'LY'], ['Istanbul', 'TR'], ['Ankara', 'TR'],
  ['Tehran', 'IR'], ['Kabul', 'AF'], ['Karachi', 'PK'], ['Lahore', 'PK'], ['Islamabad', 'PK'], ['New Delhi', 'IN'],
  ['Mumbai', 'IN'], ['Hyderabad', 'IN'], ['Dhaka', 'BD'], ['Kuala Lumpur', 'MY'], ['Jakarta', 'ID'], ['Singapore', 'SG'],
  ['Lagos', 'NG'], ['Kano', 'NG'], ['Dakar', 'SN'], ['Nairobi', 'KE'], ['Mogadishu', 'SO'], ['Addis Ababa', 'ET'],
  ['Johannesburg', 'ZA'], ['Cape Town', 'ZA'], ['London', 'GB'], ['Birmingham', 'GB'], ['Manchester', 'GB'],
  ['Paris', 'FR'], ['Marseille', 'FR'], ['Berlin', 'DE'], ['Brussels', 'BE'], ['Amsterdam', 'NL'], ['Stockholm', 'SE'],
  ['Oslo', 'NO'], ['Copenhagen', 'DK'], ['Vienna', 'AT'], ['Madrid', 'ES'], ['Rome', 'IT'], ['Moscow', 'RU'],
  ['Kazan', 'RU'], ['Sarajevo', 'BA'], ['New York', 'US'], ['Chicago', 'US'], ['Houston', 'US'], ['Los Angeles', 'US'],
  ['Dearborn', 'US'], ['Toronto', 'CA'], ['Montreal', 'CA'], ['Sydney', 'AU'], ['Melbourne', 'AU'],
  ['Jerusalem', 'IL'], ['Nazareth', 'IL'], ['Haifa', 'IL'], ['Umm el Fahm', 'IL'], ['Rahat', 'IL'], ['Tel Aviv', 'IL'],
  ['Acre', 'IL'], ['Sakhnin', 'IL'], ['Beersheba', 'IL'],
  ['Tamra', 'IL'], ['Karmiel', 'IL'], ['Rosh HaAyin', 'IL'], ['Kafr Qasim', 'IL'], ['Tirah', 'IL'],
  ['Qalansawe', 'IL'], ['Baqa al-Gharbiyye', 'IL'], ['Kafr Kanna', 'IL'],
  ['Lod', 'IL'], ['Ramla', 'IL'], ['Daliyat al-Karmel', 'IL'], ['Kafr Manda', 'IL'],
  ['Gaza', 'PS'], ['Hebron', 'PS'], ['Nablus', 'PS'], ['Ramallah', 'PS'], ['Jenin', 'PS'],
];

async function geo(name, cc, language) {
  const url = `${GEO}?name=${encodeURIComponent(name)}&count=5&language=${language}&format=json&countryCode=${cc}`;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      // Most populous first.
      return (j.results || [])
        .filter((r) => /^PPL/.test(r.feature_code || ''))
        .sort((a, b) => (b.population || 0) - (a.population || 0));
    } catch (e) {
      if (i === 3) throw e;
      await new Promise((res) => setTimeout(res, 1000 * 2 ** i));
    }
  }
}

const out = [];
for (const [name, cc] of WANTED) {
  const en = (await geo(name, cc, 'en'))[0];
  if (!en) { console.warn('not found:', name, cc); continue; }
  const ar = [...(await geo(name, cc, 'ar')), ...(LOCAL_QUERY[name]?.ar ? await geo(LOCAL_QUERY[name].ar, cc, 'ar') : [])];
  const he = [...(await geo(name, cc, 'he')), ...(LOCAL_QUERY[name]?.he ? await geo(LOCAL_QUERY[name].he, cc, 'he') : [])];
  // Same place (by geonames id) in the localized result list; strip bidi control marks.
  const pick = (list) => list.find((r) => r.id === en.id)?.name.replace(/[\u200E\u200F\u202A-\u202E]/g, '') || null;
  out.push({
    id: en.id,
    name: { en: en.name, ar: NAME_OVERRIDES[name]?.ar || pick(ar) || en.name, he: NAME_OVERRIDES[name]?.he || pick(he) || en.name },
    country: en.country_code,
    lat: +en.latitude.toFixed(4),
    lon: +en.longitude.toFixed(4),
    tz: en.timezone,
  });
  process.stdout.write('.');
}
process.stdout.write('\n');
const body = `// GENERATED by scripts/build-cities.mjs on ${new Date().toISOString().slice(0, 10)} from the Open-Meteo geocoding API.
// Offline fallback list for choosing a city manually. Do not edit by hand.
export const CITIES = ${JSON.stringify(out)};
`;
await writeFile(join(root, 'js/data/cities.js'), body);
console.log(`wrote js/data/cities.js (${out.length} cities)`);
