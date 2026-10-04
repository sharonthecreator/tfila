# תְּפִלָּה · tfila

**עולם תלת־ממדי של תפילות, מנהגים ונוסחים.** גלובוס חי שבו כל נקודה היא תפילה: מרחוק רואים את ״יבשות״ התפילה ואת שמות התפילות, ובהתקרבות מופיעות מילות התפילה עצמן — במקומן בעולם. בוחרים מסלול (יום כיפור, חתונה, ליל הסדר, שחרית…) והוא נדלק על הגלובוס עם סדר התחנות, הכיוון והקשרים ביניהן.

An interactive, Hebrew/RTL, WebGL "world of prayers": 154 prayers and ritual components, 19 prayer routes, 7 traditions (Sephardi/Edot HaMizrach by default), and authentic texts from openly licensed Sefaria editions — each with its edition, license and source link.

**Live:** https://sharonthecreator.github.io/tfila/

---

## Run locally

Requires Node 20+ (tested with Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
# or a production build:
npm run build && npm run preview   # http://localhost:4173
```

The generated content (`public/data/`) is committed, so the app runs without network access to Sefaria.

### Rebuilding the content from Sefaria

```bash
npm run content    # downloads the editions listed in content/books.mjs, rebuilds public/data/
npm test           # integrity check: attribution present, no text attributed to the wrong nusach
```

Sources are fetched from Sefaria's public data export (`storage.googleapis.com/sefaria-export`).

### End-to-end visual test

```bash
npm run build && npm run preview &
CHROMIUM=/path/to/chromium npm run test:e2e   # screenshots into test-shots/
```

---

## Design and interaction

The visual language follows the "interactive STEM lesson" style of Opus-built lab pages such as
[The Plane of Focus](https://sael.net/plane-of-focus/): a precise physical model at the centre, lit like a product shot,
surrounded by glass instrument panels with letter-spaced micro-labels, monospace readouts and a control dock.

* **The instrument.** A lacquered globe of prayers sits in a graduated dial ring (degree ticks and the 22 letters) on a
  four-legged cradle, standing on a perforated optical breadboard. A procedural studio environment (PMREM) gives the metal
  and lacquer their reflections; the key light casts real shadows; dust motes drift in the light. The globe *turns inside
  its stand* as you drag, so the instrument always reads as a physical object.
* **The skin is made of words.** The globe's surface is woven from the actual opening words of every prayer in the
  selected nusach, brighter around each prayer, with the 12 "continents" (שחרית, שבת, יום הכיפורים, מעגל החיים…).
* **Semantic zoom.** Far: continent names and the key prayers as callout tags. Closer: every title (collision-avoided).
  Closer still: each prayer opens into a dial-like medallion with its first words set right-to-left with nikud,
  lying on the globe — the Kol Nidrei text literally fills the dial when you descend onto it.
* **The plane of focus.** The selected prayer gets a rising light shaft and a "בפוקוס" tag, like the glowing focal plane
  in the reference.
* **Routes.** A flowing dashed light path (the flow and a travelling light show direction) with numbered badges. When a
  prayer recurs — the Yom Kippur Amidah ×5, Vidui ×7, Sheva Berachot ×2 at a wedding — each occurrence gets its own badge
  and its own occurrence-specific text. Regions dominated by one ceremony (Yom Kippur, Rosh Hashanah, the Seder,
  life-cycle) are laid out as a spiral in the ceremony's chronological order, so the path flows outward and only true
  repetitions cut back. Relations: **contains** (gold), **adds to** (green dashed), **varies by custom** (violet dotted),
  **related** (blue); "רצף בלבד / רצף + קשרים" toggles them.
* **Panels.** *Explain* (start side): what this stop is, when it is said, custom differences, where it recurs, before/after.
  *Readouts* (end side): big mono numbers (stop, occurrence, nusach, coverage), a route "depth track" with every stop
  coloured by section, and a list of the current section's stops with status pills and word-count bars.
  *Dock*: the route scrubber (drag through time, like a focus ring), section chips, nusach tiles whose ring shows text
  coverage, and view controls including the **guided journey**. *LIVE* inset: the current prayer's words crawling past
  like a sensor feed; click it to read.
* **Reader.** Explanation and relations beside the full text, with a provenance card (book › section, edition, license,
  Sefaria link), nikud on/off, font size, styled rubrics, per-nusach availability, and explicit unavailable states.
* **Library · Compare · Learn.** The Library is the full accessible text alternative (every prayer, every route as an
  ordered list). Compare shows one prayer in two nusachim side by side. Learn has four numbered explainers computed from
  the data (Yom Kippur's repeated prayers chart, coverage per nusach, what is added to the Amidah and when, sources and
  licenses).
* **Accessibility & performance.** Keyboard throughout (globe: arrows/±/Enter; `N`/`P` stops; `/` search; `Esc`),
  live-region announcements, reduced-motion mode, quality presets (Auto/Low/Medium/High — Auto steps down if the frame
  rate drops), and an automatic text-only fallback when WebGL is unavailable. Responsive down to phone width.
* Deep links keep the nusach, tab, route, stop or prayer (e.g. `#n=em&route=yom-kippur&stop=10`).

**Tech:** TypeScript, Vite, [three.js](https://threejs.org) 0.186 (custom shaders, fat lines, PMREM environment,
shadows), [`postprocessing`](https://github.com/pmndrs/postprocessing) (mipmap bloom, ACES filmic tone mapping,
vignette, SMAA), Fontsource variable fonts — Inter and JetBrains Mono (as in the reference), Heebo for Hebrew UI
glyphs, Frank Ruhl Libre for prayer text. DOM callout labels keep Hebrew typography crisp.

## Content, sources and honest limitations

All liturgical text is taken verbatim from specific Sefaria editions; nothing is written or reconstructed by this project. The Hebrew explanations ("what it is / when / variations") were written for tfila as orientation, describe widespread practice in general terms, and are **not halakhic rulings**.

| Tradition | Prayers with text (of 154) | Notes |
|---|---|---|
| ספרדי / עדות המזרח (default) | 132 (121 full sections, 11 excerpts) | Siddur Edot HaMizrach (Shaliehsaboo ed., CC0), Edot HaMizrach machzorim for Rosh Hashanah and Yom Kippur, Haggadah, Selichot, Seder Tisha B'Av |
| אשכנז | 97 (92 / 5) | Siddur Ashkenaz (Daat – PD; Metsudah – CC-BY), Metsudah machzorim, Kinnot (Wikisource, CC-BY-SA) |
| נוסח ספרד (חסידי) | 123 (112 / 11) | Siddur Sefard (Torat Emet – PD; Metsudah – CC-BY), Sefard machzorim |
| חב״ד | 40 | Only a **weekday** Chabad siddur exists in the open sources (Wikisource); Shabbat, festivals and High Holidays are marked unavailable for Chabad |
| תימני בלדי | 4 (historical source) | No Baladi Tiklal is openly available. For the Amidah, Vidui and Birkat Hamazon the app shows **the Rambam's "Order of Prayer"** (Mishneh Torah), clearly labelled as the historical basis of the Baladi rite — not as the Baladi siddur |
| תימני שאמי | 0 | No Shami Tiklal is openly available; every text is marked unavailable. Explanations and routes still work |
| קבלה (lens) | 132 + kavanot | There is no single "Kabbalah nusach". This lens shows the Edot HaMizrach text (labelled as such — that rite follows the Ari as transmitted by the Rashash), highlights kabbalistic components (Tikkun Chatzot, LeShem Yichud, Petach Eliyahu, Atkinu Seudata, Ushpizin…), and attaches passages from **Sha'ar HaKavanot** (R. Chaim Vital, public domain) to 29 prayers. The Rashash siddur with full kavanot is not available |

Status labels in the app: **טקסט מלא** (a complete section of the edition), **קטע** (an excerpt — e.g. one blessing extracted from an Amidah), **מקור היסטורי**, **בסיס: עדות המזרח** (Kabbalah lens), **לא זמין**. If a text is missing in the selected nusach, the reader says so and offers — only on request and with a banner — the same prayer in another nusach or a generic edition. Three wedding components (reception & ketubah signing, ketubah reading, yichud) are explanation-only.

Licenses as recorded by Sefaria: CC0, Public Domain, CC-BY, CC-BY-SA. Several editions (Wikisource-derived Edot HaMizrach Yom Kippur machzor and Chabad siddur, the Sefard machzorim, the per-nusach Birkat Hamazon versions) carry **no license in Sefaria's metadata**; the app shows "רישיון לא צוין בספריא" next to them rather than guessing.

Other known limitations: no Sephardi Hoshanot, Ashkenazi wedding/brit liturgy, Tikkun Leil Shavuot or ketubah texts; long sections are shown as they appear in the edition (some include the edition's own headings and instructions); customs differ between and within communities far more than any overview can show.

## Project layout

```
content/      catalog.mjs (prayers, explanations, per-nusach Sefaria refs), routes.mjs, nusachim.mjs, books.mjs
scripts/      fetch-sources.mjs, build-content.mjs, validate-content.mjs, dev helpers (peek/find/check)
public/data/  generated: world.json, t/*.json (texts with attribution), preview-*.json, search-*.json
src/          app.ts, ui/ (lab, reader, search, views), scene/ (PrayerWorld, instrument, textures, environment, geo), render/ (postprocessing pipeline, quality presets), styles/main.css
tests/        shots.mjs — Playwright interaction + screenshot test
```
