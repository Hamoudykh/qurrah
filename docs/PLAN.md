# Qurrah — proposal: structure and level lists

> "…and the comfort of my eye has been placed in prayer." — reported in Sunan an-Nasa'i 3939
> (grading: see `TO-VERIFY.md`). The app's name comes from this phrase.

## 1. Guiding rules

1. **No Quran text is typed into the code.** Every Arabic ayah, translation, tafsir line and
   audio file is loaded at runtime from the Quran.com API v4 (`api.quran.com`), with a
   Tanzil-based fallback (`api.alquran.cloud`, text edition `quran-uthmani`). The code only
   holds *references*: surah numbers and ayah ranges.
2. Every passage is shown with its surah name and ayah numbers so it can be checked
   against a printed mushaf.
3. Hadith and fiqh content is a **summary of meaning**, never presented as the original wording.
   Each item carries its collection and number, links to sunnah.com, and states the grading
   when scholars differ. Anything I could not confirm is listed in `TO-VERIFY.md`.
4. No accounts, ads or analytics. All progress stays in `localStorage` on the device and can
   be exported to or imported from a JSON file.

## 2. App structure

```
Bottom tabs (mobile)        Screens
───────────────────────     ─────────────────────────────────────────────────────────
Today                       next-prayer countdown · daily verse · reviews due ·
                            "learn next" suggestion · today's salah plan
Learn                       level filter (Easy / Medium / Hard) · My Surahs · custom passage
  └─ Surah/passage page     Read tab: Arabic (adjustable size), transliteration toggle,
                            Saheeh International / Hebrew, al-Muyassar meaning (Arabic),
                            Ibn Kathir (English, on demand), "Why it matters", audio
                            Memorize tab: repeat ayah × N, pause-to-repeat, speed,
                            hide-words test, per-ayah learning / memorized
Pray                        prayer planner (rak'ah-by-rak'ah) · what to recite (fiqh notes) ·
                            khushu' tips · 60-second "before you pray" checklist
Times                       today's five prayers + sunrise, method & Asr setting, countdown,
                            notifications, calendar export · Qibla compass
Me                          progress, streak, next goals · review queue · settings ·
                            sources & credits · data export/import
```

### Code layout (no build step, plain ES modules)

```
index.html, manifest.webmanifest, sw.js
css/app.css                  design tokens, light/dark, RTL-aware layout
js/main.js                   boot, router, tab shell
js/core/                     dom helpers, i18n, store (localStorage), api (Quran.com + fallback,
                             cache), audio player, notifications, calendar (.ics)
js/logic/                    pure, unit-tested: srs, planner, qibla, prayer, daily, levels
js/data/                     catalog (refs + levels), virtues, khushu', fiqh, daily verses,
                             cities, meta (generated from the API by scripts/build-meta.mjs)
js/views/                    one module per screen
vendor/adhan.esm.min.js      Adhan prayer-time library (MIT), vendored for offline use
fonts/                       Amiri Quran, Noto Naskh Arabic, Noto Sans Hebrew (OFL)
tests/                       node --test unit tests + Playwright smoke test
```

## 3. How the levels are set

The word and letter counts were computed from the Quran.com Uthmani text
(`scripts/build-meta.mjs` regenerates them). Waqf signs are not counted as words.

| Level | Rule | Why |
|---|---|---|
| **Easy** | ≤ 26 words and no ayah longer than 9 words | can be learned in one or two sittings |
| **Medium** | 27–45 words and no ayah longer than 12 words | a few sessions; more ayahs to keep in order |
| **Hard** | > 45 words **or** any single ayah of ≥ 18 words | long surahs, or long ayahs that are hard to hold in memory |

Within each level, items are ordered from shortest to longest. The "learn next" suggestion
moves through one level at a time and only goes up a level once you know most of the
current one (you can always pick anything yourself).

**Foundation — Al-Fatihah (1:1–7, 29 words).** It is recited in every rak'ah, so it is not a
level item. It has its own page so you can study its meaning in depth.

### Easy — short surahs (11)

| # | Surah | Ayahs | Words |
|---|---|---|---|
| 108 | Al-Kawthar | 3 | 10 |
| 103 | Al-'Asr | 3 | 14 |
| 112 | Al-Ikhlas | 4 | 15 |
| 106 | Quraysh | 4 | 17 |
| 110 | An-Nasr | 3 | 19 |
| 114 | An-Nas | 6 | 20 |
| 105 | Al-Fil | 5 | 23 |
| 111 | Al-Masad | 5 | 23 |
| 113 | Al-Falaq | 5 | 23 |
| 107 | Al-Ma'un | 7 | 25 |
| 109 | Al-Kafirun | 6 | 26 |

### Medium — longer Juz' 'Amma surahs and a well-known passage (10)

| Ref | Name | Ayahs | Words |
|---|---|---|---|
| 94 | Ash-Sharh | 8 | 27 |
| 102 | At-Takathur | 8 | 28 |
| 97 | Al-Qadr | 5 | 30 |
| 104 | Al-Humazah | 9 | 33 |
| 95 | At-Tin | 8 | 34 |
| 99 | Az-Zalzalah | 8 | 36 |
| 101 | Al-Qari'ah | 11 | 36 |
| 2:1–5 | Opening of Al-Baqarah | 5 | 36 |
| 93 | Ad-Duha | 11 | 40 |
| 100 | Al-'Adiyat | 11 | 40 |

### Hard — longer surahs and famous passages (23)

| Ref | Name | Ayahs | Words | Note |
|---|---|---|---|---|
| 59:22–24 | End of Al-Hashr | 3 | 49 | ayah of 19 words |
| 2:255 | Ayat al-Kursi | 1 | 50 | one 50-word ayah |
| 91 | Ash-Shams | 15 | 54 | |
| 23:1–11 | Opening of Al-Mu'minun (khushu') | 11 | 57 | |
| 67:1–5 | Opening of Al-Mulk | 5 | 60 | ayah of 18 words |
| 86 | At-Tariq | 17 | 61 | |
| 92 | Al-Layl | 21 | 71 | |
| 87 | Al-A'la | 19 | 72 | |
| 96 | Al-'Alaq | 19 | 72 | |
| 2:285–286 | Last two ayahs of Al-Baqarah | 2 | 76 | ayah of 49 words |
| 3:190–194 | Reflecting on creation (Al 'Imran) | 5 | 77 | |
| 82 | Al-Infitar | 19 | 80 | |
| 90 | Al-Balad | 20 | 82 | |
| 88 | Al-Ghashiyah | 26 | 92 | |
| 98 | Al-Bayyinah | 8 | 94 | ayahs of up to 21 words |
| 81 | At-Takwir | 29 | 104 | |
| 84 | Al-Inshiqaq | 25 | 107 | |
| 85 | Al-Buruj | 22 | 109 | |
| 80 | 'Abasa | 42 | 133 | |
| 89 | Al-Fajr | 30 | 137 | |
| 83 | Al-Mutaffifin | 36 | 169 | |
| 78 | An-Naba' | 40 | 173 | |
| 79 | An-Nazi'at | 46 | 179 | |

This covers all of Juz' 'Amma (78–114) plus seven famous passages. You can also add any
other surah or ayah range as a custom item from the Learn tab.

## 4. Memorization and review model

* Item status: **new → learning → known**. Inside a learning item, each ayah is marked
  *learning* or *memorized*.
* Known items enter a simple spaced-repetition schedule (first review after 1 day, then the
  interval grows by an "ease" factor; Again / Hard / Good / Easy buttons; 180-day cap).
  Surahs you mark as already known at the start are spread over the first week so they do
  not all fall due on the same day.
* Reciting an item in salah through the planner ("I prayed with this plan") counts as a
  review when it is due.

## 5. Prayer planner

* Fard rak'ahs per prayer: Fajr 2, Dhuhr 4, Asr 4, Maghrib 3, Isha 4. A surah is suggested
  after al-Fatihah in the first two rak'ahs (Bukhari 776). The later rak'ahs show
  "al-Fatihah" with a note on the difference of opinion.
* Rotation: the planner prefers known items you have recited least recently and those due
  for review. It keeps mushaf order inside a prayer (rak'ah 1 earlier in the mushaf than
  rak'ah 2), and makes rak'ah 1 the longer of the two where possible. It gives longer items
  to Fajr and shorter ones to Maghrib, following the reported general practice.
* Optional sunnah prayers: the two rak'ahs before Fajr (Al-Kafirun / Al-Ikhlas, Muslim 726)
  and Witr (Al-A'la / Al-Kafirun / Al-Ikhlas, Abu Dawud 1423).

## 6. Prayer times, Qibla, daily verse

* Times are calculated on the device with the **Adhan** library (vendored, MIT). You choose
  the calculation method, the Asr method (standard Shafi'i/Maliki/Hanbali, or Hanafi), the
  high-latitude rule, and per-prayer minute adjustments. The method in use is always shown.
  Location comes from GPS (with your permission), a city search (Open-Meteo geocoding), a
  built-in city list, or coordinates you type in.
* Qibla: great-circle initial bearing to the Kaaba (21.4225° N, 39.8262° E), shown on a live
  compass where the phone allows it, otherwise as degrees from true north with instructions.
* Daily verse: one of 40 selected short ayahs, rotating by date. Arabic, Saheeh
  International, Hebrew, al-Muyassar and audio all come from the API. A one-line reflection,
  written only from the verse's own translation and labelled as such, is listed for
  review in `TO-VERIFY.md`.

## 7. Notifications — an honest limitation

Web apps cannot schedule notifications that fire while the app is fully closed unless a push
server is involved, and this app deliberately has none. So:

* While the app is open, or recently backgrounded, it shows prayer and daily-verse
  notifications on time.
* For reliable reminders, **Export to calendar (.ics)** creates the next 30 days of prayer
  times and a daily verse reminder, each with an alarm, for your phone's own calendar.
