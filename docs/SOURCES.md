# Data sources, translations and credits

Every piece of Quran content in Qurrah is **loaded at runtime** from the sources below and
cached on the device. Nothing is typed into the code. `tests/content.test.mjs` fails the build
if a hand-written file contains Uthmani-only characters, as a guard against pasted Quran text.

## Quran text

| What | Source | Details |
|---|---|---|
| Arabic text (primary) | [Quran.com API v4](https://api.quran.com/api/v4) | field `text_uthmani` (Uthmani script), plus word-level `text_uthmani` |
| Arabic text (fallback) | [AlQuran.cloud API](https://alquran.cloud/api) | edition `quran-uthmani` (the [Tanzil](https://tanzil.net) Uthmani text). Used only if Quran.com is unreachable; the source line under each passage then says "Tanzil". The basmala that this edition prefixes to ayah 1 is removed by comparing against the same edition's 1:1. |
| Basmala header | Quran.com, verse 1:1 | shown above surahs whose `bismillah_pre` is true |
| Word-by-word meaning and transliteration | Quran.com (`words=true`, `word_fields=text_uthmani,transliteration`) | shown when you tap a word |

## Translations and meanings

| Language | Name | Quran.com resource ID | Fallback |
|---|---|---|---|
| English | **Saheeh International** | translation `20` | AlQuran.cloud `en.sahih` |
| Hebrew | **Dar Al-Salam Center** | translation `233` | none (Hebrew is shown as unavailable in fallback mode) |
| Transliteration | Quran.com Transliteration | translation `57` | AlQuran.cloud `en.transliteration` |
| Arabic simple meaning | **Tafsir al-Muyassar** (King Fahd Glorious Quran Printing Complex) | tafsir `16` | AlQuran.cloud `ar.muyassar` |
| English tafsir (on demand) | **Tafsir Ibn Kathir (Abridged)** | tafsir `169` | none |

Al-Muyassar sometimes explains several ayahs together (for example 78:21–26). The app shows
each explanation once, after the last ayah of its group, labelled with exactly the ayahs it
covers, so a meaning is never attached to the wrong ayah.

## Audio (per-ayah, for repetition)

| Reciter | Quran.com recitation ID | Fallback CDN edition (cdn.islamic.network) |
|---|---|---|
| Mishary Rashid Alafasy | 7 | `ar.alafasy` (128 kbps) |
| Mahmoud Khalil Al-Husary | 6 | `ar.husary` |
| Al-Husary — Muallim (teaching recitation) | 12 | `ar.husary` |
| Abdul Basit Abdus-Samad (Murattal) | 2 | `ar.abdulbasitmurattal` (64 kbps) |
| Mohamed Siddiq al-Minshawi (Murattal) | 9 | `ar.minshawi` |

Quran.com serves audio from `verses.quran.com` (Alafasy, Abdul Basit, Minshawi) and
`mirrors.quranicaudio.com` (Husary, Husary Muallim). Offline saving needs CORS. It was
verified for `verses.quran.com`. The fallback CDN does not send CORS headers, so audio from
it streams but cannot be saved offline. Reciters whose audio cannot be saved show
"Text saved… audio will stream when online".

## Hadith and fiqh references

* Numbers follow **[sunnah.com](https://sunnah.com)** numbering, and every reference links
  there (e.g. `https://sunnah.com/muslim:810`).
* Gradings: the Sahihayn (al-Bukhari, Muslim) are labelled authentic. For the Sunan, the
  app shows al-Albani's grading where it was confirmed, and says "scholars graded it
  differently" where the sources disagree. A widely shared weak narration (Tirmidhi 2922) is
  named as weak and not relied on.
* All hadith text in the app is a **summary of meaning**, not the original wording.
* Which references were checked during development, and which still need checking, is listed in [TO-VERIFY.md](TO-VERIFY.md).

## Prayer times, qibla, places

| What | Source |
|---|---|
| Prayer time calculation | [Adhan JavaScript](https://github.com/batoulapps/adhan-js) **4.4.6** (MIT), vendored unmodified in `vendor/adhan.esm.min.js`. Runs on the device. |
| Calculation methods | Adhan's built-in methods (Muslim World League, Umm al-Qura, Egyptian, Karachi, ISNA, Moonsighting Committee, Dubai, Kuwait, Qatar, Singapore, Turkey, Tehran), Asr Standard/Hanafi, high-latitude rules, per-prayer minute adjustments |
| Qibla | Great-circle initial bearing to the Kaaba at 21.4225241° N, 39.8261818° E (the same coordinates as Adhan). Unit-tested to match Adhan's `Qibla()` exactly. |
| City search | [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api). Only the typed city name is sent. |
| Offline city list | `js/data/cities.js`, generated from Open-Meteo by `scripts/build-cities.mjs` (84 cities, with coordinates and IANA time zones) |
| Hijri date | The browser's `Intl` Umm al-Qura calendar (an estimate, see TO-VERIFY) |

## Fonts (bundled, so nothing is fetched from font CDNs)

* **Amiri Quran**: © The Amiri Project Authors, SIL Open Font License 1.1 (`fonts/OFL-amiri-quran.txt`). Checked to cover all 62 characters used in the Quran.com Uthmani text of the catalog.
* **Noto Naskh Arabic**, **Noto Sans Hebrew**: Google Noto, SIL Open Font License 1.1.
* Packaged from [Fontsource](https://fontsource.org) 5.3.0.

## Generated metadata (names and counts only)

`js/data/meta.js` is generated by `scripts/build-meta.mjs` from the Quran.com API. It holds
the 114 surah names (Latin and Arabic), verse counts and revelation place, plus word and
letter counts for every catalog item. These counts justify the Easy/Medium/Hard levels. It
contains **no ayah text**.

## Privacy

No analytics, ads, accounts or cookies. A Content-Security-Policy in `index.html` limits
network access to the hosts above. Progress is stored in `localStorage` and can be exported
or imported as JSON.
