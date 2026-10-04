// Source books used by tfila. Every text shown in the app comes from one of these
// Sefaria editions, fetched from Sefaria's public data export
// (https://storage.googleapis.com/sefaria-export/json/...), with the exact version
// title, license and source recorded next to each excerpt.
//
// `versions` is an ordered preference list: for every reference the build script
// takes the FIRST version that actually contains text at that location, and records
// which version that was. Nothing is merged across versions within one excerpt.

export const BOOKS = {
  em: {
    path: 'Liturgy/Siddur/Siddur Edot HaMizrach',
    title: 'Siddur Edot HaMizrach',
    heTitle: 'סידור עדות המזרח',
    versions: [' Shaliehsaboo Edition', 'Torat Emet 357'],
  },
  ash: {
    path: 'Liturgy/Siddur/Siddur Ashkenaz',
    title: 'Siddur Ashkenaz',
    heTitle: 'סידור אשכנז',
    versions: ['Daat Siddur Ashkenaz', 'The Metsudah siddur, 1981', 'Torat Emet 357'],
  },
  sef: {
    path: 'Liturgy/Siddur/Siddur Sefard',
    title: 'Siddur Sefard',
    heTitle: 'סידור נוסח ספרד',
    versions: ['Torat Emet 357', 'The Metsudah siddur, 1981'],
  },
  chabad: {
    path: 'Liturgy/Siddur/Weekday Siddur Chabad',
    title: 'Weekday Siddur Chabad',
    heTitle: 'סידור חב"ד לימות החול',
    versions: ['Wikisource'],
  },
  ykEm: {
    path: 'Liturgy/High Holidays/Machzor Yom Kippur Edot HaMizrach',
    title: 'Machzor Yom Kippur Edot HaMizrach',
    heTitle: 'מחזור יום כיפור עדות המזרח',
    versions: ['Wikisource'],
  },
  ykSef: {
    path: 'Liturgy/High Holidays/Machzor Yom Kippur Sefard',
    title: 'Machzor Yom Kippur Sefard',
    heTitle: 'מחזור יום כיפור נוסח ספרד',
    versions: ['Machzor Yom Kippur'],
  },
  ykAsh: {
    path: 'Liturgy/High Holidays/Machzor Yom Kippur Ashkenaz',
    title: 'Machzor Yom Kippur Ashkenaz',
    heTitle: 'מחזור יום כיפור אשכנז',
    versions: ['The Metsudah Machzor. Metsudah Publications, New York - Heb paragraph ed.'],
  },
  rhEm: {
    path: 'Liturgy/High Holidays/Machzor Rosh Hashanah Edot HaMizrach',
    title: 'Machzor Rosh Hashanah Edot HaMizrach',
    heTitle: 'מחזור ראש השנה עדות המזרח',
    versions: ['Machzor Edot HaMizrach for Rosh Hashanah'],
  },
  rhSef: {
    path: 'Liturgy/High Holidays/Machzor Rosh Hashanah Sefard',
    title: 'Machzor Rosh Hashanah Sefard',
    heTitle: 'מחזור ראש השנה נוסח ספרד',
    versions: ['Machzor Rosh Hashanah'],
  },
  rhAsh: {
    path: 'Liturgy/High Holidays/Machzor Rosh Hashanah Ashkenaz',
    title: 'Machzor Rosh Hashanah Ashkenaz',
    heTitle: 'מחזור ראש השנה אשכנז',
    versions: ['The Metsudah Machzor. Metsudah Publications, New York -- he paragraph ed.'],
  },
  selichotEm: {
    path: 'Liturgy/High Holidays/Selichot Edot HaMizrach',
    title: 'Selichot Edot HaMizrach',
    heTitle: 'סליחות נוסח עדות המזרח',
    versions: ['Selichot Edot HaMizrach - Torat Emet'],
  },
  unetaneh: {
    path: 'Liturgy/High Holidays/Unetaneh Tokef',
    title: 'Unetaneh Tokef',
    heTitle: 'ונתנה תוקף',
    versions: ['Goldshmidt with ms emendation'],
  },
  hagEm: {
    path: 'Liturgy/Haggadah/Pesach Haggadah Edot Hamizrah',
    title: 'Pesach Haggadah Edot Hamizrah',
    heTitle: 'הגדה של פסח עדות המזרח',
    versions: ['Haggadah Shaliehsaboo Edition', 'Pesach Haggadah'],
  },
  hag: {
    path: 'Liturgy/Haggadah/Pesach Haggadah',
    title: 'Pesach Haggadah',
    heTitle: 'הגדה של פסח',
    versions: ['Pesach Haggadah'],
  },
  bh: {
    path: 'Liturgy/Other Liturgy Works/Birkat Hamazon',
    title: 'Birkat Hamazon',
    heTitle: 'ברכת המזון',
    // Birkat Hamazon is published per nusach as separate versions; refs pick one explicitly.
    versions: [
      'Birkat Hamazon -- Edot HaMizrach',
      'Birkat Hamazon -- Ashkenaz',
      'Birkat Hamazon -- Sefard',
      'Birkat Hamazon -- Ari',
      'Sheva Brachot',
      'Brit Mila Additions ',
    ],
  },
  tishaEm: {
    path: "Liturgy/Other Liturgy Works/Seder Tisha B'Av (Edot HaMizrach)",
    title: "Seder Tisha B'Av (Edot HaMizrach)",
    heTitle: 'סדר תשעה באב (עדות המזרח)',
    versions: ["Seder Tisha B'Av - Kollel Ohr Haemet"],
  },
  kinnot: {
    path: "Liturgy/Other Liturgy Works/Kinnot for Tisha B'Av (Ashkenaz)",
    title: "Kinnot for Tisha B'Av (Ashkenaz)",
    heTitle: 'קינות לתשעה באב (אשכנז)',
    versions: ["Kinnot for Tisha B'Av -- Wikisource"],
  },
  yizkor: {
    path: 'Liturgy/Other Liturgy Works/Yizkor',
    title: 'Yizkor',
    heTitle: 'יזכור',
    versions: ['Public Domain'],
  },
  hallel: {
    path: 'Liturgy/Other Liturgy Works/Hallel',
    title: 'Hallel',
    heTitle: 'הלל',
    versions: ['Public Domain'],
  },
  lekhaDodi: {
    path: 'Liturgy/Piyutim/Lekha Dodi',
    title: 'Lekha Dodi',
    heTitle: 'לכה דודי',
    versions: ['Wikisource'],
  },
  yedidNefesh: {
    path: 'Liturgy/Piyutim/Yedid Nefesh',
    title: 'Yedid Nefesh',
    heTitle: 'ידיד נפש',
    versions: ['Original version with nikkud', 'Original version'],
  },
  maavarYabbok: {
    path: "Liturgy/Other Liturgy Works/Ma'avar Yabbok",
    title: "Ma'avar Yabbok",
    heTitle: 'מעבר יבק',
    versions: ['Vilna, 1860'],
  },
  rambamOrder: {
    path: 'Halakhah/Mishneh Torah/Sefer Ahavah/Mishneh Torah, The Order of Prayer',
    title: 'Mishneh Torah, The Order of Prayer',
    heTitle: 'משנה תורה, סדר תפילות כל השנה (רמב"ם)',
    versions: ['Torat Emet 370'],
  },
  shaarKavanot: {
    path: "Kabbalah/Arizal and Chaim Vital/Sha'ar HaKavanot",
    title: "Sha'ar HaKavanot",
    heTitle: 'שער הכוונות (ר׳ חיים ויטאל בשם האר"י)',
    versions: ['Shaar HaKavanot'],
  },
};
