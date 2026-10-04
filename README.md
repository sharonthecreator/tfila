# תְּפִלָּה · tfila

**עולם תלת־ממדי של תפילות, מנהגים ונוסחים.** גלובוס חי שבו כל נקודה היא תפילה: מרחוק רואים את ״יבשות״ התפילה ואת שמות התפילות, ובהתקרבות מופיעות מילות התפילה עצמן — במקומן בעולם. בוחרים מסלול (יום כיפור, חתונה, ליל הסדר, שחרית…) והוא נדלק על הגלובוס עם סדר התחנות, הכיוון והקשרים ביניהן.

An interactive, Hebrew/RTL, WebGL "world of prayers": 154 prayers and ritual components, 19 prayer routes, 7 traditions (Sephardi/Edot HaMizrach by default), and authentic texts from openly licensed Sefaria editions — each with its edition, license and source link.

**Live:** https://sharonthecreator.github.io/tfila/

---

## Run locally

Requires Node 18+ (tested with Node 22).

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

* **The globe.** A dark, astrolabe-gridded sphere whose skin is woven from faint rows of the actual prayer words of the selected nusach, with soft light over each "continent" (שחרית, שבת, יום הכיפורים, מעגל החיים…). Stars, an atmosphere rim and gentle bloom give it depth; the camera tilts toward the horizon as you descend.
* **Semantic zoom.** Far away: region names and the most important prayers. Closer: all titles (with collision avoidance). Closer still: each prayer opens into a round medallion with its opening words, set right-to-left with nikud, lying on the surface of the globe. Click a prayer or a medallion to read the full text.
* **Routes.** Choosing a route draws a flowing dashed path (the flow and a travelling light show direction) through numbered stops. When a prayer recurs — the Yom Kippur Amidah 5 times, Vidui 7 times, Sheva Berachot twice at a wedding — each occurrence gets its own numbered badge around the node and its own occurrence-specific text (e.g. the Vidui inside the Musaf Amidah vs. the Neilah Vidui). Relations are drawn in distinct styles: **contains** (solid gold), **adds to** (dashed green, e.g. Ya'aleh VeYavo → Amidah), **varies by custom** (dotted violet, e.g. Yizkor ↔ Hashkava), **related** (blue).
* **Itinerary.** Section headings (ערב יום הכיפורים, כל נדרי, מוסף, נעילה…), status tags (core / conditional / custom / optional), occurrence counters, and stops that do not exist in the selected nusach are greyed and labelled. Some stops are deliberately shown as *omitted* (e.g. Tachanun is not said at a Brit) to explain what changes.
* **Guided journey.** ▶ flies stop to stop with captions; pause, next and previous at any time.
* **Reader.** Explanation (what / when / variations), relations, a per-nusach availability strip, then the text with source card (book › section, edition, license, Sefaria link), nikud on/off, font size, and rubrics (instructions in the source, such as "בעשרת ימי תשובה אומרים") styled distinctly from the prayer words.
* **Search** works with or without nikud (and folds final letters), across titles, explanations and the full text of the selected nusach, and highlights the hits inside the reader.
* **Accessibility.** Full keyboard support (globe: arrows/±/Enter; `/` search; Esc closes; ↑↓ through stops), a complete text-only view of all content and routes, live-region announcements, reduced-motion mode (honours `prefers-reduced-motion`, with a toggle), and an automatic text-view fallback when WebGL is unavailable. Responsive: bottom sheet and full-screen reader on phones.
* Deep links: the URL keeps the nusach, route, stop or prayer (e.g. `#n=em&route=yom-kippur&stop=10`).

Tech: vanilla JS + [three.js](https://threejs.org) (custom shaders, fat lines, bloom), DOM labels for crisp Hebrew typography, canvas-rendered text textures, Vite. Fonts: Frank Ruhl Libre and Heebo (self-hosted via Fontsource).

---

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
src/          main.js (app), ui/reader.js, globe/ (Globe.js, textures.js, geo.js), styles.css
tests/        shots.mjs — Playwright interaction + screenshot test
```
