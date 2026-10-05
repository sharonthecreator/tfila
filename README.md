# תְּפִלָּה · tfila

**סולם התפילות — סולם יעקב תלת־ממדי של תפילות, מנהגים ונוסחים.** ״סֻלָּם מֻצָּב אַרְצָה וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה״: כל שלב בסולם הוא תפילה, כל סיבוב שלו הוא אחד מארבעת העולמות שבהם, לפי האר״י, עולה תפילת השחר — עשיה, יצירה, בריאה, אצילות — וכל צד שלו הוא תחום (שחרית, שבת, יום הכיפורים, מעגל החיים…). מרחוק רואים את העולמות ואת שמות התפילות; בהתקרבות מופיעות מילות התפילה עצמן על השלבים. בוחרים מסלול (יום כיפור, חתונה, ליל הסדר, שחרית…) — והוא נדלק, עולה ויורד בסולם תחנה אחר תחנה.

An interactive, Hebrew/RTL, WebGL "ladder of prayer" (Jacob's ladder): 154 prayers and ritual components on a spiral ladder of the Ari's four worlds, 19 prayer routes (with every Kaddish that joins their parts, in its proper form), 7 traditions (Sephardi/Edot HaMizrach by default), and authentic texts from openly licensed Sefaria editions — each with its edition, license and a one-click link to the source.

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
npm test           # integrity: attribution, no text attributed to the wrong nusach, every Kaddish of the right form, ladder placements
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

* **The instrument: Jacob's ladder.** A spiral ladder — two polished rails and a rung under every prayer — stands on a
  perforated optical breadboard ("מוצב ארצה") and reaches into a light above ("וראשו מגיע השמימה", Genesis 28:12; the
  spiral form follows the classic image of Jacob's ladder as a winding stair). Lights travel up and down the rails —
  "angels of God ascending and descending on it" — as abstract points of light (no figures). Inside stands a pillar of
  the prayers' own words: at every angle and height it carries the words of the prayers on the rung in front of it.
* **Four worlds, one turn each.** Bottom to top: עשיה, יצירה, בריאה, אצילות. The Ari (Sha'ar HaKavanot, Sermons on
  Morning Prayers 1) divides Shacharit this way: from the start of the prayer to Baruch She'amar — Asiyah; to Yotzer Or —
  Yetzirah; to the end of the Avot blessing — Beriah; the rest of the Amidah — Atzilut; and in Nefilat Apayim "he stands
  in Atzilut and lowers himself down to Asiyah" (Sermons on the Falling on the Face Prayer 4). Those 8 placements are
  sourced and labelled "האר״י". **Every other placement is tfila's own structural assignment** by a stated rule of thumb
  (acts and preparations / praise and song / declaration and study / standing before the King) and is labelled as such
  in the app — it is a way to lay out the map, not a kabbalistic claim. The Learn page quotes the Ari's passages from
  the edition, with link.
* **Twelve sides.** Each region (שחרית, שבת, יום הכיפורים, מעגל החיים…) owns a 30° side of every turn; within a world the
  prayers stand on consecutive rungs in the order they are said. Yom Kippur is the last side, so **Ne'ilah stands on the
  topmost rung**.
* **Routes climb.** A route is a dashed path wrapping around the outside of the ladder: cyan where it ascends, amber where
  it descends. The Yom Kippur route visibly climbs to Atzilut for each of its five Amidot and descends to Vidui after
  each one. The readouts panel charts the climb (↑ ascents, ↓ descents, how many times the route reaches Atzilut).
* **Along the lane.** A route never jumps through the air: between two stops it steps off the rung onto the ladder's
  lane and follows the spiral — up the outer lane when it ascends, down the inner lane when it descends — onto the next
  rung. Moving to the next or previous stop, the camera rides that same lane past the prayers in between.
* **Pace.** The guided journey has four paces (איטי · רגיל · מהיר · מהיר מאוד, or `[` / `]`). The pace sets both the
  travel along the lane and how long the journey rests at each stop, and it is remembered.
* **Semantic zoom.** Far: the four worlds and the regions; closer: every title (collision-avoided); closest: each prayer
  opens into a dial-like medallion with its first words, leaning toward you from its rung. Close up the rails and rungs
  step back to ghosts and the nearest metal is cut away, so the words carry the view.
* **Going back.** A breadcrumb bar (סולם התפילות › route › stop) with a clear "→ חזרה" button and a ✕ to leave a route;
  `Esc` steps up one layer; and every layer is a browser-history entry, so the browser's and phone's Back/Forward
  buttons work (stop → route overview → the whole ladder).
* **Kaddish joins the parts.** Every service route carries its Kaddish at each seam — half Kaddish, Kaddish Titkabal,
  Kaddish Yatom, Kaddish deRabbanan — 56 stops in all, each cut from the exact place in that nusach's own edition
  (located with `scripts/find-kaddish.mjs`). Custom differences are explicit (e.g. no Kaddish after Aleinu in Edot
  HaMizrach; half Kaddish before Barchu in Edot HaMizrach and Chabad; the shofar blown in the middle of the last Kaddish
  of Ne'ilah in Edot HaMizrach). `npm test` checks that every Kaddish stop's text really is the form its note names.
* **Relations.** **contains** (gold), **adds to** (green dashed), **varies by custom** (violet dotted), **related**
  (blue); "רצף בלבד / רצף + קשרים" toggles them.
* **Panels.** *Explain* (start side): what this stop is, when it is said, custom differences, where it recurs, before/after.
  *Readouts* (end side): big mono numbers (stop, occurrence, nusach, coverage), a route "depth track" with every stop
  coloured by section, and a list of the current section's stops with status pills and word-count bars.
  *Dock*: the route scrubber (drag through time, like a focus ring), section chips, nusach tiles whose ring shows text
  coverage, and view controls including the **guided journey**. *LIVE* inset: the current prayer's words crawling past
  like a sensor feed; click it to read.
* **Reader and sources.** Explanation and relations beside the full text, with a provenance card (book › section,
  edition, license, "פתיחה בספריא ↗" and the edition's own source). Every prayer and stop also has a one-click
  "מקור: … — פתיחה בספריא ↗" link in the side panel, and every Library card has a "מקור ↗" link.
* **Library · Compare · Learn.** The Library is the full accessible text alternative (every prayer, every route as an
  ordered list). Compare shows one prayer in two nusachim side by side. Learn has six numbered explainers: the ladder and
  its four worlds (with the Ari's passages), Kaddish and its four forms, Yom Kippur's repeated prayers chart (incl.
  Kaddish), coverage per nusach, what is added to the Amidah and when, sources and licenses.
* **Respect.** No Hebrew letters on anything that lies on the floor (the bench dial has numerals only); verses are never
  placed underfoot; angels are abstract lights; the reader notes that the texts contain holy names and asks that printed
  pages be treated with care (גניזה); Kaddish is described as said only with a minyan; explanations are orientation,
  not halakhic rulings.
* **Accessibility & performance.** Keyboard throughout (ladder: ←/→ orbit, ↑/↓ PgUp/PgDn climb, ± zoom, Home, Enter; `N`/`P` stops; `/` search; `Esc` back),
  live-region announcements, reduced-motion mode, quality presets (Auto/Low/Medium/High — Auto steps down if the frame
  rate drops), and an automatic text-only fallback when WebGL is unavailable. Responsive down to phone width.
* Deep links keep the nusach, tab, route, stop or prayer (e.g. `#n=em&route=yom-kippur&stop=10`).

**Tech:** TypeScript, Vite, [three.js](https://threejs.org) 0.186 (custom shaders, instanced rungs, fat lines with
vertex colours, a shader cutaway, PMREM environment, shadows), [`postprocessing`](https://github.com/pmndrs/postprocessing) (mipmap bloom, ACES filmic tone mapping,
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

**Content audit.** All routes, Kaddish placements, relations, text references and the respect points were audited
against the cached editions. The findings were fixed and are now enforced by `npm test` where they can be:
- No Kaddish stop ever falls back to another form of Kaddish. Where an edition lacks the text at that exact spot, the
  same form from that nusach's weekday siddur is shown, labelled as such.
- Chabad's weekday text is never shown on Shabbat, festival or High Holiday routes.
- Ne'ilah's Vidui has no Al Chet in any nusach.
- Musaf's Vidui comes before the Avodah.
- Avinu Malkenu is marked per custom.
- The father's blessing at a brit is now included.
- Truncated excerpts were fixed: Ya'aleh VeYavo, Al HaNissim, Aneinu, Ana BeKoach, Birchot HaShachar and the Rosh
  Hashanah Amidah.
- Nachem was added for Edot HaMizrach and Sefard, along with a number of factual corrections.

Divine Names appear in full only in the reader. In decorative places (the pillar, the medallions, the LIVE ticker)
they are written as ה׳ / אלקים / אד׳.

Other known limitations: no Sephardi Hoshanot, Ashkenazi wedding/brit liturgy, Tikkun Leil Shavuot or ketubah texts; long sections are shown as they appear in the edition (some include the edition's own headings and instructions); customs differ between and within communities far more than any overview can show.

## Project layout

```
content/      catalog.mjs (prayers, explanations, per-nusach Sefaria refs), routes.mjs, kaddish.mjs (every Kaddish, per form and nusach),
              ladder.mjs (the four worlds, the Ari's placements, sectors), nusachim.mjs, books.mjs
scripts/      fetch-sources.mjs, build-content.mjs, validate-content.mjs, find-kaddish(-all).mjs, dev helpers (peek/find/check)
public/data/  generated: world.json, t/*.json (texts with attribution), preview-*.json, search-*.json
src/          app.ts (incl. history/back navigation), ui/ (lab + breadcrumbs, reader, search, views), scene/ (PrayerWorld = the ladder,
              instrument = the bench, textures, environment, geo), render/ (postprocessing pipeline, quality presets), styles/main.css
tests/        shots.mjs — Playwright interaction + screenshot test
```
