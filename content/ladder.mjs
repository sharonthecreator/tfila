// סולם יעקב — the four worlds of the prayer ladder.
//
// "ויחלם והנה סלם מצב ארצה וראשו מגיע השמימה והנה מלאכי אלהים עלים וירדים בו" (Genesis 28:12).
// The Ari (Sha'ar HaKavanot, Sermons on Morning Prayers 1) divides the morning prayer into the four worlds:
//   from the beginning of the prayer to Baruch She'amar — Asiyah; Baruch She'amar to Yotzer Or — Yetzirah;
//   Yotzer Or to the end of the Avot blessing — Beriah; the rest of the Amidah — Atzilut.
// and (Sermons on the Falling on the Face Prayer 4) in Nefilat Apayim "he stands in Atzilut in the Amidah
// and lowers himself down to Asiyah".
//
// Only the nodes flagged 'ari' below are placed by that teaching. Every other placement is tfila's own
// structural assignment by the rule of thumb in WORLDS[].rule — it is a way to lay out the map, not a
// kabbalistic claim — and the app labels it as such.
import { R } from './catalog.mjs';

export const WORLDS = [
  {
    id: 'asiyah', he: 'עשיה', en: 'Asiyah', color: '#ffb547',
    ari: 'מתחילת התפילה עד ״ברוך שאמר״ — ברכות השחר וסדר הקרבנות.',
    rule: 'מעשים והכנות: נטילה, טלית ותפילין, נרות, ברכות הנהנין, מצוות שבמעשה, וגם ה״ירידה״ — וידוי, תחנון וסליחות.',
  },
  {
    id: 'yetzirah', he: 'יצירה', en: 'Yetzirah', color: '#5dffa2',
    ari: 'מ״ברוך שאמר״ עד ״יוצר אור״ — פסוקי דזמרה.',
    rule: 'שבח ושירה: מזמורים, הלל, פיוטים, זמירות, ושירת הקינה.',
  },
  {
    id: 'beriah', he: 'בריאה', en: 'Beriah', color: '#7fb2ff',
    ari: 'מ״יוצר אור״ עד סוף ברכת אבות — קריאת שמע וברכותיה.',
    rule: 'הכרזה ולימוד: קריאת שמע, קדיש, קריאה בתורה ובמגילה, קידוש, ברכת המזון, כל נדרי ותקיעת שופר.',
  },
  {
    id: 'atzilut', he: 'אצילות', en: 'Atzilut', color: '#e9d8ff',
    ari: 'שאר העמידה.',
    rule: 'עמידה לפני המלך: כל העמידות ותוספותיהן, מוסף, נעילה, סדר העבודה, ברכת כהנים ושבע ברכות.',
  },
];

// Authentic sources for the Learn explainer (resolved like any other text, with edition and license).
export const LADDER_SOURCES = {
  worlds: R('shaarKavanot', 'Sermons on Morning Prayers', { start: 'מן תחילת התפלה עד ברוך שאמר', count: 1 }),
  descent: R('shaarKavanot', 'Sermons on the Falling on the Face Prayer', { start: 'מפיל עצמו עד העשיה', count: 1 }),
};

// Sector order around the ladder (each region gets 30° of every turn). Yom Kippur is last, so Ne'ilah —
// the last Amidah of the year's holiest day — stands on the topmost rung.
export const SECTOR_ORDER = ['seuda', 'chaim', 'boker', 'shacharit', 'erev', 'shabbat', 'moadim', 'pesach', 'taaniot', 'sod', 'rh', 'yk'];

const A = 'asiyah', Y = 'yetzirah', B = 'beriah', Z = 'atzilut';

// Nodes placed by the Ari's division of Shacharit (the rest are structural).
// Where the Ari's reason is not the four-world division itself
export const ARI_NOTE = {
  tachanun: 'בנפילת אפיים ״בעמידה הוא עומד באצילות ומפיל עצמו עד העשיה״ (שער הכוונות, דרושי נפילת אפים, בשם קונטריס אדם א׳).',
};

export const ARI = new Set(['birchot-hashachar', 'birchot-hatorah', 'akeda-korbanot', 'adon-olam', 'pesukei-dezimra', 'shema', 'amidah', 'tachanun']);

export const PLACEMENT = {
  // boker
  'modeh-ani': A, 'birchot-hashachar': A, 'birchot-hatorah': A, tallit: A, tefillin: A, 'akeda-korbanot': A, 'adon-olam': A,
  // shacharit
  'pesukei-dezimra': Y, kaddish: B, shema: B, amidah: Z, tachanun: A, 'kriat-hatorah': B, ashrei: Y, 'shir-shel-yom': Y,
  aleinu: B, kaveh: A, zechirot: B, 'birkat-kohanim': Z,
  // erev
  'mincha-opening': A, 'arvit-shema': B, 'sefirat-haomer': A, 'kiddush-levana': Y, 'kriat-shema-al-hamita': B,
  // seuda
  'netilat-hamotzi': A, zimmun: B, 'birkat-hamazon': B, 'maein-shalosh': B, 'birchot-hanehenin': A, 'tefilat-haderech': A,
  // shabbat
  'nerot-shabbat': A, 'shir-hashirim': Y, 'yedid-nefesh': Y, 'kabbalat-shabbat': Y, 'lecha-dodi': Y, 'arvit-shabbat': Z,
  'shalom-aleichem': Y, 'eshet-chayil': Y, atkinu: B, 'kiddush-shabbat': B, zemirot: Y, 'shacharit-shabbat': Y,
  'amidah-shabbat': Z, 'kriat-hatorah-shabbat': B, 'birkat-hachodesh': B, 'musaf-shabbat': Z, 'kiddush-yom': B,
  'mincha-shabbat': Z, 'pirkei-avot': B, 'seuda-shlishit': Y, havdalah: A, 'veyiten-lecha': A,
  // chaim
  'birkat-habanim': B, 'kabbalat-panim': A, erusin: B, 'ketuba-reading': B, 'sheva-brachot': Z, 'shvirat-hakos': A, yichud: A,
  'brit-mila': B, 'kisse-eliyahu': A, 'harachaman-brit': Y, 'pidyon-haben': A, 'zeved-habat': Y,
  // sod
  'zohar-seuda': B, 'maavar-yabbok': B, 'tikkun-chatzot': A, 'leshem-yichud': A, 'petichat-eliyahu': B, 'ana-bekoach': Y,
  'tikkun-leil-shavuot': B,
  // moadim
  'yaale-veyavo': Z, hallel: Y, 'musaf-rosh-chodesh': Z, 'barchi-nafshi': Y, 'amidah-regalim': Z, 'musaf-regalim': Z,
  'kiddush-yom-tov': B, sukka: A, lulav: A, hoshanot: Y, geshem: Y, hakafot: Y, 'ner-chanukah': A, 'al-hanisim': Z,
  'chanukah-shacharit': Y, 'taanit-esther': A, 'parashat-zachor': B, megilla: B, 'purim-day': A,
  // pesach
  kadesh: B, urchatz: A, karpas: A, yachatz: A, maggid: B, rachtza: A, 'motzi-matza': A, maror: A, korech: A,
  'shulchan-orech': A, tzafun: A, barech: B, 'hallel-seder': Y, nirtzah: Y, 'ma-nishtana': B, 'bedikat-chametz': A,
  // rh
  'avinu-malkenu': A, selichot: A, 'hatarat-nedarim': A, 'arvit-rh': Z, simanim: A, 'kiddush-rh': B, 'amidah-rh': Z,
  shofar: B, 'unetaneh-tokef': Y, 'musaf-rh': Z, tashlich: A,
  // yk
  kapparot: A, malkot: A, 'mincha-erev-yk': Z, 'seuda-mafseket': A, 'nerot-yk': A, 'tefila-zaka': A, 'lecha-eli': Y,
  'kol-nidrei': B, 'arvit-yk': B, 'amidah-yk': Z, 'vidui-yk': A, 'selichot-yk': A, 'shir-hayichud': Y, 'shacharit-yk': Y,
  'chazara-yk': Z, 'kriat-hatorah-yk': B, hineni: A, avoda: Z, 'eleh-ezkera': Y, 'mincha-yk': B, 'el-nora-alila': Y,
  neila: Z, 'neila-closing': B, 'motzaei-yk': A,
  // taaniot & mourning
  yizkor: B, aneinu: Z, 'selichot-taanit': A, 'arvit-tisha': A, eicha: B, kinot: Y, nachem: Z, kriah: A, 'tziduk-hadin': B,
  'kaddish-yatom': B, 'birkat-avelim': B, hashkava: B, 'mishnayot-avel': B,
};

// Geometry of the ladder (world units): one full turn of the helix per world.
export const LADDER = { turnH: 0.9, rIn: 0.74, rOut: 1.36, base: -1.32, turns: 4 };
