// The Kaddish that joins the parts of each service, cut out of each edition by its exact place.
//
// Kaddish is not one text but four forms, each with its own place in the service:
//   חצי קדיש  (half)        — closes a unit and opens the next: after Pesukei DeZimra, before the Amidah, after the Torah reading
//   קדיש תתקבל (titkabal)    — closes the Amidah unit of a service ("תתקבל צלותהון")
//   קדיש יתום  (yatom)       — said by mourners after psalms and Aleinu ("יהא שלמא")
//   קדיש דרבנן (derabbanan)  — after learning: korbanot, Pitum HaKetoret, Pirkei Avot ("על ישראל ועל רבנן")
//
// Every {from, count} below was located with scripts/find-kaddish.mjs and points at the Kaddish (with its rubric)
// in that very section of that edition. Ashkenaz uses the Daat siddur's dedicated Kaddish chapter.
// A nusach without an entry falls back to the Kaddish node's own text (the full Kaddish) — the route note says which
// form belongs at that point.
import { R } from './catalog.mjs';

const MZ = { version: 'The Metsudah siddur, 1981' };
const ASH = {
  half: R('ash', 'Kaddish/Half Kaddish'),
  titkabal: R('ash', 'Kaddish/Kaddish Shalem'),
  yatom: R('ash', "Kaddish/Mourner's Kaddish"),
  derabbanan: R('ash', "Kaddish/Kaddish d'Rabbanan"),
};

export const KADDISH = {
  // ── weekday Shacharit ──
  korbanot: { em: R('em', 'Weekday Shacharit/Incense Offering', { from: 31, count: 4 }), ash: ASH.derabbanan, sef: R('sef', "Weekday Shacharit/B'raita d'Rabi Yishmael", { ...MZ, from: 3, count: 6 }), chabad: R('chabad', 'Shacharit/Kaddish DeRabbanan') },
  pesukei: { em: R('em', "Weekday Shacharit/Pesukei D'Zimra", { from: 21, count: 2 }), ash: ASH.half, sef: R('sef', 'Weekday Shacharit/Yishtabach', { ...MZ, from: 4, count: 5 }), chabad: R('chabad', 'Shacharit/Pesukei Dezimra', { from: 17, count: 1 }) },
  tachanun: { em: R('em', 'Weekday Shacharit/Vidui', { from: 33, count: 1 }), ash: ASH.half, chabad: R('chabad', 'Shacharit/Tachnun', { from: 34, count: 2 }) },
  torah: { em: R('em', 'Weekday Shacharit/Torah Reading', { from: 19, count: 2 }), ash: ASH.half, sef: R('sef', 'Weekday Shacharit/For Monday & Thursday', { ...MZ, from: 25, count: 5 }) },
  uvaLetzion: { em: R('em', 'Weekday Shacharit/Uva LeSion', { from: 3, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Weekday Shacharit/Ashrei', { ...MZ, from: 17, count: 6 }), chabad: R('chabad', 'Shacharit/Ashrei Uva LeZion', { from: 4, count: 5 }) },
  shirShelYom: { em: R('em', 'Weekday Shacharit/Song of the Day', { from: 27, count: 3 }), ash: ASH.yatom, sef: R('sef', "Weekday Shacharit/L'David Hashem", { ...MZ, from: 8, count: 5 }), chabad: R('chabad', "Shacharit/Mourner's Kaddish") },
  kaveh: { em: R('em', 'Weekday Shacharit/Kaveh', { from: 12, count: 4 }), ash: ASH.derabbanan, sef: R('sef', 'Weekday Shacharit/Kaveh', { ...MZ, from: 11, count: 7 }), chabad: R('chabad', 'Shacharit/Kaveh', { from: 5, count: 5 }) },
  aleinu: { ash: ASH.yatom, sef: R('sef', 'Weekday Shacharit/Aleinu', { ...MZ, from: 5, count: 4 }), chabad: R('chabad', 'Shacharit/Aleinu', { from: 2, count: 4 }) },
  // ── weekday Mincha ──
  minchaHalf: { em: R('em', 'Weekday Mincha/Offerings', { from: 14, count: 2 }), ash: ASH.half, sef: R('sef', 'Weekday Mincha/Korbanot', { ...MZ, from: 23, count: 5 }), chabad: R('chabad', 'Mincha/Ashrei', { from: 1, count: 2 }) },
  minchaTitkabal: { em: R('em', 'Weekday Mincha/Vidui', { from: 10, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Weekday Mincha/Tachanun', { ...MZ, from: 17, count: 7 }), chabad: R('chabad', 'Mincha/Tachanun', { from: 12, count: 5 }) },
  minchaYatomEm: { em: R('em', 'Weekday Mincha/Vidui', { from: 21, count: 3 }) },
  minchaAleinu: { ash: ASH.yatom, sef: R('sef', 'Weekday Mincha/Tachanun', { ...MZ, from: 27, count: 5 }), chabad: R('chabad', 'Mincha/Aleinu', { from: 3, count: 4 }) },
  // ── weekday Arvit ──
  arvitBarchu: { em: R('em', 'Weekday Arvit/Barchu', { from: 5, count: 2 }), chabad: R('chabad', 'Maariv', { from: 2, count: 1 }) },
  arvitHalf: { em: R('em', 'Weekday Arvit/The Shema', { from: 11, count: 2 }), ash: ASH.half, sef: R('sef', 'Weekday Maariv', { ...MZ, from: 29, count: 4 }), chabad: R('chabad', 'Maariv', { from: 15, count: 1 }) },
  arvitTitkabal: { em: R('em', 'Weekday Arvit/Amidah', { from: 61, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Weekday Maariv', { ...MZ, from: 129, count: 7 }), chabad: R('chabad', 'Maariv', { from: 58, count: 5 }) },
  arvitYatomEm: { em: R('em', 'Weekday Arvit/Amidah', { from: 67, count: 3 }) },
  arvitAleinu: { ash: ASH.yatom, sef: R('sef', 'Weekday Maariv', { ...MZ, from: 138, count: 6 }), chabad: R('chabad', 'Maariv', { from: 69, count: 4 }) },
  // ── Shabbat ──
  kabbalatShabbatEm: { em: R('em', 'Kabbalat Shabbat', { from: 30, count: 5 }) },
  kabbalatShabbatAsh: { ash: ASH.yatom, sef: R('sef', 'Kabbalat Shabbat', { from: 40, count: 3 }) },
  shabbatShacharit: { em: R('em', 'Shabbat Shacharit/Amidah', { from: 80, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Shabbat Morning Services/Amidah', { from: 55, count: 5 }) },
  shabbatMusafHalf: { em: R('em', 'Shabbat Mussaf/Amida', { from: 2, count: 2 }), ash: ASH.half },
  shabbatMusafTitkabal: { em: R('em', 'Shabbat Mussaf/Amida', { from: 55, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Musaf', { from: 59, count: 5 }) },
  pirkeiAvot: { ash: ASH.derabbanan },
  // ── Rosh Chodesh ──
  rcHallel: { em: R('em', 'Rosh Hodesh/Hallel', { from: 25, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Rosh Chodesh/Hallel', { from: 29, count: 6 }) },
  rcTorah: { em: R('em', 'Rosh Hodesh/Hallel', { from: 40, count: 2 }), ash: ASH.half },
  rcMusaf: { em: R('em', 'Rosh Hodesh/Mussaf', { from: 43, count: 5 }), ash: ASH.titkabal, sef: R('sef', 'Rosh Chodesh/Mussaf', { from: 39, count: 5 }) },
  rcBarchiNafshi: { em: R('em', 'Rosh Hodesh/Barchi Nafshi', { from: 3, count: 3 }), ash: ASH.yatom, sef: R('sef', 'Rosh Chodesh/Barchi Nafshi', { from: 3, count: 3 }) },
  // ── Rosh Hashanah ──
  rhShacharit: { em: R('rhEm', 'Shacharit/Avinu Malkenu', { from: 30, count: 7 }), ash: ASH.titkabal },
  rhMaftir: { em: R('rhEm', 'Maftir', { from: 2, count: 2 }), ash: ASH.half },
  rhMusafHalf: { em: R('rhEm', 'Musaf', { from: 7, count: 2 }), ash: ASH.half },
  rhMusafTitkabal: { em: R('rhEm', 'Musaf', { from: 70, count: 8 }), ash: ASH.titkabal },
  // ── Yom Kippur ──
  ykArvitHalf: { em: R('ykEm', 'Arvit/Shema and its Blessings', { from: 11, count: 1 }), sef: R('ykSef', 'Maariv Service for Yom Kippur Eve/Barechu', { from: 18, count: 4 }), ash: ASH.half },
  ykArvitTitkabal: { em: R('ykEm', 'Arvit/Slichot', { from: 55, count: 1 }), sef: R('ykSef', 'Maariv Service for Yom Kippur Eve/Avinu Malkenu', { from: 52, count: 7 }), ash: ASH.titkabal },
  ykArvitYatom: { em: R('ykEm', 'Arvit/Arvit Finale', { from: 6, count: 1 }), sef: R('ykSef', "Maariv Service for Yom Kippur Eve/Mourner's Kaddish", { from: 0, count: 5 }), ash: ASH.yatom },
  ykShacharitTitkabal: { em: R('ykEm', 'Shacharit/Slichot', { from: 36, count: 1 }), sef: R('ykSef', 'The Morning Prayers/Avinu Malkenu', { from: 48, count: 7 }), ash: ASH.titkabal },
  ykMusafHalf: { em: R('ykEm', 'Mussaf/Amidah', { from: 3, count: 1 }), sef: R('ykSef', 'Musaf Service/Amidah', { from: 0, count: 4 }), ash: ASH.half },
  ykMusafTitkabal: { em: R('ykEm', 'Mussaf/Slichot', { from: 50, count: 1 }), sef: R('ykSef', 'Musaf Service/Priestly Blessing', { from: 75, count: 4 }), ash: ASH.titkabal },
  ykMinchaHalf: { em: R('ykEm', 'Mincha/Reading of the Torah', { from: 16, count: 1 }), sef: R('ykSef', 'Mincha Service/Haftarah', { from: 16, count: 2 }), ash: ASH.half },
  ykMinchaTitkabal: { em: R('ykEm', 'Mincha/Slichot', { from: 39, count: 1 }), sef: R('ykSef', 'Mincha Service/Avinu Malkenu', { from: 48, count: 5 }), ash: ASH.titkabal },
  ykNeilahHalf: { em: R('ykEm', 'Neilah/Ashrei', { from: 3, count: 1 }), sef: R('ykSef', 'Neilah Service/Ashrei', { from: 72, count: 2 }), ash: ASH.half },
  ykNeilahTitkabal: { em: R('ykEm', 'Neilah/Slichot', { from: 21, count: 3 }), sef: R('ykSef', 'Neilah Service/Avinu Malkenu', { from: 91, count: 6 }), ash: ASH.titkabal },
};

// When a nusach has no Kaddish at that exact place in its open edition, the stop shows the same FORM of Kaddish as it
// appears in that nusach's weekday siddur — labelled so — never another form. Chabad, whose only open edition is the
// weekday siddur, stays "unavailable" on Shabbat, festival and High Holiday routes.
export const KADDISH_FORM = {
  half: KADDISH.pesukei,
  titkabal: KADDISH.uvaLetzion,
  yatom: KADDISH.shirShelYom,
  derabbanan: KADDISH.korbanot,
};
/** The form a Kaddish stop's note names (its first clause). */
export function kaddishForm(note) {
  const head = (note || '').split('—')[0];
  if (/חצי קדיש/.test(head)) return 'half';
  if (/תתקבל/.test(head)) return 'titkabal';
  if (/קדיש יתום/.test(head)) return 'yatom';
  if (/דרבנן|על ישראל/.test(head)) return 'derabbanan';
  return null;
}

// Stops, ready to drop into a route.
const K = (key, note, extra = {}) => ({ n: 'kaddish', note, t: KADDISH[key], ...extra });
export const KS = {
  korbanot: K('korbanot', 'קדיש דרבנן (״על ישראל״) — אחר הקרבנות ו״רבי ישמעאל אומר״, שהם לימוד תורה.', { cond: 'custom' }),
  pesukei: K('pesukei', 'חצי קדיש — אחר ״ישתבח״, ומפריד בין פסוקי דזמרה ל״ברכו״ וקריאת שמע.'),
  tachanun: K('tachanun', 'חצי קדיש — אחר התחנון, לפני קריאת התורה או ״אשרי״.'),
  torah: K('torah', 'חצי קדיש — בסיום קריאת התורה.', { cond: 'conditional' }),
  uvaLetzion: K('uvaLetzion', 'קדיש תתקבל (״קדיש שלם״) — אחר ״ובא לציון״; חותם את יחידת העמידה של שחרית.'),
  shirShelYom: K('shirShelYom', 'קדיש יתום (״יהא שלמא״) — אחר שיר של יום.'),
  kaveh: K('kaveh', 'קדיש דרבנן — אחר פיטום הקטורת ו״תנא דבי אליהו״.', { cond: 'custom' }),
  aleinu: K('aleinu', 'קדיש יתום — אחר ״עלינו״ (באשכנז, בנוסח ספרד ובחב״ד; בעדות המזרח ״עלינו״ חותם את התפילה).', { only: ['ash', 'sef', 'chabad'] }),
  minchaHalf: K('minchaHalf', 'חצי קדיש — אחר ״אשרי״ (ובעדות המזרח גם פרשת התמיד והקטורת), לפני העמידה.'),
  minchaTitkabal: K('minchaTitkabal', 'קדיש תתקבל — אחר העמידה והתחנון.'),
  minchaYatomEm: K('minchaYatomEm', 'קדיש יתום — בעדות המזרח אחר ״למנצח בנגינות״, לפני ״עלינו״.', { only: ['em', 'kabbalah'] }),
  minchaAleinu: K('minchaAleinu', 'קדיש יתום — אחר ״עלינו״.', { only: ['ash', 'sef', 'chabad'] }),
  arvitBarchu: K('arvitBarchu', 'חצי קדיש לפני ״ברכו״ — בעדות המזרח ובחב״ד.', { only: ['em', 'kabbalah', 'chabad'] }),
  arvitHalf: K('arvitHalf', 'חצי קדיש — אחר ״השכיבנו״ (ו״ברוך ה׳ לעולם״ באשכנז), לפני העמידה.'),
  arvitTitkabal: K('arvitTitkabal', 'קדיש תתקבל — אחר העמידה.'),
  arvitYatomEm: K('arvitYatomEm', 'קדיש יתום — בעדות המזרח אחר ״שיר למעלות אשא עיני״, לפני ״ברכו״ ו״עלינו״.', { only: ['em', 'kabbalah'] }),
  arvitAleinu: K('arvitAleinu', 'קדיש יתום — אחר ״עלינו״.', { only: ['ash', 'sef', 'chabad'] }),
};
