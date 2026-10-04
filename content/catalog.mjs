// tfila catalog — the "places" of the prayer world.
//
// Every node is a prayer, a ritual component or a liturgical unit.
//   d   – what it is (educational explanation written for tfila, not liturgy)
//   w   – when it is said
//   k   – status: 'core' (fixed part of the service), 'conditional' (only on certain
//         days/occasions), 'custom' (a minhag; not universal), 'optional' (said by some)
//   v   – variations by tradition (only where the difference is well established)
//   t   – liturgical text per nusach, as Sefaria references (see content/books.mjs).
//         Missing nusach = explicitly "unavailable" in the app; we never fall back silently.
//   gen – a text that is not tied to a specific nusach (shown only on explicit request)
//   kav – a passage from Sha'ar HaKavanot (the Kabbalah lens)
//   rmb – the Rambam's order of prayer (historical source of the Baladi rite)
//   rel – relations to other nodes: [type, target, note?]
//         type ∈ 'contains' | 'adds' (this node is added into target) | 'varies' | 'related'
//   tags – 'kabbalah' marks components rooted in the Safed kabbalists

export const R = (book, path, opts = {}) => ({ book, path: path ? path.split('/') : [], ...opts });

export const REGIONS = [
  { id: 'shacharit', name: 'שחרית', lat: 12, lon: 0, color: '#ffc35a' },
  { id: 'boker', name: 'השכמת הבוקר', lat: 44, lon: -6, color: '#ffd27a' },
  { id: 'erev', name: 'מנחה וערבית', lat: -22, lon: -4, color: '#9db8ff' },
  { id: 'rh', name: 'ראש השנה', lat: 30, lon: -46, color: '#f4a8ff' },
  { id: 'yk', name: 'יום הכיפורים', lat: -4, lon: -60, color: '#ffffff' },
  { id: 'taaniot', name: 'תעניות ואבל', lat: -44, lon: -50, color: '#9fb0c8' },
  { id: 'chaim', name: 'מעגל החיים', lat: -52, lon: 4, color: '#ffb3c7' },
  { id: 'seuda', name: 'סעודה וברכות', lat: -26, lon: 42, color: '#e9c38a' },
  { id: 'shabbat', name: 'שבת', lat: 14, lon: 46, color: '#f6d58f' },
  { id: 'sod', name: 'סוד ותיקונים', lat: 58, lon: 50, color: '#ffe08a' },
  { id: 'moadim', name: 'מועדים', lat: 22, lon: 96, color: '#a9e6a1' },
  { id: 'pesach', name: 'ליל הסדר', lat: -20, lon: 92, color: '#c6f08f' },
];

export const NODES = [
  // ───────────────────────────── השכמת הבוקר ─────────────────────────────
  {
    id: 'modeh-ani', region: 'boker', title: 'מודה אני', k: 'core', imp: 2,
    d: 'משפט ההודיה הראשון של היום, על החזרת הנשמה. אין בו שם ה׳, ולכן נהגו לאומרו מיד עם היקיצה, עוד לפני נטילת ידיים.',
    w: 'מיד עם ההתעוררות בבוקר.',
    t: {
      em: R('em', 'Preparatory Prayers/Modeh Ani'),
      ash: R('ash', 'Weekday/Shacharit/Preparatory Prayers/Modeh Ani'),
      sef: R('sef', 'Upon Arising/Modeh Ani'),
      chabad: R('chabad', 'Shacharit/Upon Arising'),
    },
    kav: R('shaarKavanot', 'Sermons on Morning Blessings', { count: 3 }),
  },
  {
    id: 'birchot-hashachar', region: 'boker', title: 'ברכות השחר', k: 'core', imp: 3,
    d: 'סדרת ברכות על חסדי הבוקר — נטילת ידיים, ״אשר יצר״, ״אלוהי נשמה״, ״הנותן לשכוי בינה״ ועוד. מקורן בגמרא (ברכות ס ע״ב), שם נאמרה כל ברכה עם הפעולה עצמה; לימים הועברו לפתיחת התפילה.',
    w: 'בכל בוקר, לפני התפילה.',
    v: 'סדר הברכות ונוסחן שונה מעט בין העדות; בקהילות רבות החזן אומרן בקול והקהל עונה אמן.',
    t: {
      em: R('em', 'Preparatory Prayers/Morning Blessings'),
      ash: R('ash', 'Weekday/Shacharit/Preparatory Prayers/Morning Blessings'),
      sef: R('sef', 'Weekday Shacharit/Morning Blessings'),
      chabad: R('chabad', 'Shacharit/Morning Blessings'),
    },
    kav: R('shaarKavanot', 'Sermons on Morning Blessings', { from: 3, count: 4 }),
    rel: [['contains', 'birchot-hatorah']],
  },
  {
    id: 'birchot-hatorah', region: 'boker', title: 'ברכות התורה', k: 'core', imp: 2,
    d: 'ברכות על מצוות לימוד תורה, שאחריהן נוהגים לומר מעט פסוקים ומשנה כדי ללמוד מיד. הן פוטרות את הלימוד של כל היום.',
    w: 'בכל בוקר, לפני כל לימוד תורה.',
    t: {
      em: R('em', 'Preparatory Prayers/Torah Blessings'),
      ash: R('ash', 'Weekday/Shacharit/Preparatory Prayers/Torah Blessings'),
      sef: R('sef', 'Weekday Shacharit/Blessings on Torah'),
    },
  },
  {
    id: 'tallit', region: 'boker', title: 'עטיפת טלית', k: 'core', imp: 1,
    d: 'ברכת ״להתעטף בציצית״ ועטיפת הטלית לפני התפילה, עם פסוקי ״ברכי נפשי״ ו״מה יקר חסדך״.',
    w: 'בתפילת שחרית בכל יום (ובליל יום הכיפורים — גם בערבית).',
    v: 'בקהילות אשכנז רבות נוהגים שרווקים אינם מתעטפים בטלית גדול; בקהילות ספרד והמזרח מתעטפים גם צעירים.',
    t: {
      em: R('em', 'Weekday Shacharit/Order of Talit'),
      ash: R('ash', 'Weekday/Shacharit/Preparatory Prayers/Tallit'),
      sef: R('sef', 'Upon Arising/Tallit'),
      chabad: R('chabad', 'Shacharit/Tzitzit and Tallit'),
    },
    kav: R('shaarKavanot', 'Sermons on Tzitzit', { count: 3 }),
  },
  {
    id: 'tefillin', region: 'boker', title: 'הנחת תפילין', k: 'conditional', imp: 2,
    d: 'הנחת תפילין של יד ושל ראש בברכה, בעיקר בתפילת שחרית.',
    w: 'בימי חול בלבד — לא בשבת וביום טוב.',
    v: 'בחול המועד: הספרדים והחסידים אינם מניחים, ורבים מבני אשכנז בחוץ לארץ מניחים. בעדות המזרח ובחב״ד יש המניחים גם תפילין דרבנו תם.',
    t: {
      em: R('em', 'Weekday Shacharit/Order of Tefillin'),
      ash: R('ash', 'Weekday/Shacharit/Preparatory Prayers/Tefillin'),
      sef: R('sef', 'Upon Arising/Tefilin'),
      chabad: R('chabad', 'Shacharit/Tefillin'),
    },
    kav: R('shaarKavanot', 'Sermons on Tefillin', { count: 3 }),
  },
  {
    id: 'akeda-korbanot', region: 'boker', title: 'עקדה וקרבנות', k: 'custom', imp: 1,
    d: 'קריאת פרשת העקדה ופרשיות הקרבנות — התמיד, הכיור ופיטום הקטורת — כזכר לעבודת בית המקדש, על פי ״ונשלמה פרים שפתינו״.',
    w: 'לפני פסוקי דזמרה בשחרית.',
    v: 'בנוסח עדות המזרח מקפידים במיוחד על אמירת ״פיטום הקטורת״, ולפי המקובלים יש לאומרו מתוך הכתב.',
    t: {
      em: R('em', 'Weekday Shacharit/Incense Offering'),
      ash: R('ash', 'Weekday/Shacharit/Preparatory Prayers/Korbanot'),
      sef: R('sef', 'Weekday Shacharit/Korbanot'),
    },
  },
  {
    id: 'adon-olam', region: 'boker', title: 'אדון עולם ויגדל', k: 'custom', imp: 1,
    d: 'שני פיוטים על יסודות האמונה. ״יגדל״ מבוסס על י״ג העיקרים של הרמב״ם.',
    w: 'בפתיחת שחרית (בנוסח אשכנז) או בסיום תפילות שונות.',
    t: {
      ash: [R('ash', 'Weekday/Shacharit/Preparatory Prayers/Adon Olam'), R('ash', 'Weekday/Shacharit/Preparatory Prayers/Yigdal')],
    },
  },

  // ───────────────────────────── שחרית ─────────────────────────────
  {
    id: 'pesukei-dezimra', region: 'shacharit', title: 'פסוקי דזמרה', k: 'core', imp: 3,
    d: 'פרק השבח שלפני התפילה: ״ברוך שאמר״, ״הודו״, ״אשרי״, מזמורי ״הללויה״ שבסוף תהלים, שירת הים ו״ישתבח״.',
    w: 'בכל שחרית, לאחר ברכות השחר.',
    v: 'בנוסח עדות המזרח, ספרד וחב״ד אומרים ״הודו״ לפני ״ברוך שאמר״; בנוסח אשכנז — אחריו.',
    t: {
      em: [R('em', 'Weekday Shacharit/Hodu'), R('em', "Weekday Shacharit/Pesukei D'Zimra")],
      ash: R('ash', 'Weekday/Shacharit/Pesukei Dezimra'),
      sef: [R('sef', 'Weekday Shacharit/Hodu'), R('sef', 'Weekday Shacharit/Yishtabach')],
      chabad: [R('chabad', 'Shacharit/Hodu'), R('chabad', 'Shacharit/Pesukei Dezimra')],
    },
    kav: R('shaarKavanot', 'Sermons on Morning Prayers', { count: 4 }),
  },
  {
    id: 'kaddish', region: 'shacharit', title: 'קדיש', k: 'core', imp: 3,
    d: 'תפילה בארמית על קידוש שם שמיים — ״יתגדל ויתקדש שמיה רבא״ — הנאמרת רק בעשרה. יש חצי קדיש, קדיש שלם (״תתקבל״), קדיש יתום וקדיש דרבנן, והוא מפריד בין חלקי התפילה.',
    w: 'פעמים רבות בכל תפילה בציבור; קדיש יתום — על ידי אבלים.',
    v: 'בעדות המזרח נוהגים שכל האבלים אומרים קדיש יחד; גם הנוסח (״ויצמח פורקניה ויקרב משיחיה״) מצוי בעדות המזרח, בנוסח ספרד ובחב״ד ולא באשכנז.',
    t: {
      em: R('em', 'Weekday Shacharit/Song of the Day', { start: 'יתגדל', count: 1 }),
      ash: R('ash', "Kaddish/Mourner's Kaddish"),
      sef: R('sef', 'Weekday Shacharit/Aleinu', { start: 'יתגדל', count: 1 }),
      chabad: R('chabad', "Shacharit/Mourner's Kaddish"),
    },
    kav: R('shaarKavanot', 'Sermons on Kaddish', { count: 4 }),
  },
  {
    id: 'shema', region: 'shacharit', title: 'קריאת שמע וברכותיה', k: 'core', imp: 3,
    d: 'ברכו, ברכות יוצר אור ואהבה, שלוש פרשיות שמע (״שמע ישראל״, ״והיה אם שמוע״, ״ויאמר״) וברכת ״אמת ויציב… גאל ישראל״ — קבלת עול מלכות שמיים, מצווה מן התורה.',
    w: 'בשחרית ובערבית בכל יום.',
    t: {
      em: R('em', 'Weekday Shacharit/The Shema'),
      ash: R('ash', 'Weekday/Shacharit/Blessings of the Shema'),
      sef: R('sef', 'Weekday Shacharit/The Shema'),
      chabad: R('chabad', 'Shacharit/Blessings of the Shema'),
    },
    kav: R('shaarKavanot', 'Sermons on Intentions of the Shema Recitation', { count: 4 }),
  },
  {
    id: 'amidah', region: 'shacharit', title: 'עמידה של חול', k: 'core', imp: 3,
    d: 'התפילה — שמונה עשרה (ובפועל תשע עשרה) ברכות: שלוש של שבח, שלוש עשרה של בקשה ושלוש של הודאה. נאמרת בעמידה ובלחש, ובציבור חוזר עליה שליח הציבור עם קדושה.',
    w: 'שלוש פעמים ביום — שחרית, מנחה וערבית (בערבית אין חזרת הש״ץ).',
    t: {
      em: R('em', 'Weekday Shacharit/Amida'),
      ash: R('ash', 'Weekday/Shacharit/Amidah'),
      sef: R('sef', 'Weekday Shacharit/Amidah'),
      chabad: R('chabad', 'Shacharit/The Amidah'),
    },
    rmb: R('rambamOrder', '1'),
    kav: R('shaarKavanot', 'Sermons on the Standing Prayer', { count: 4 }),
    rel: [['contains', 'yaale-veyavo', 'בראש חודש ובחול המועד'], ['contains', 'al-hanisim', 'בחנוכה ובפורים'], ['contains', 'aneinu', 'בימי תענית']],
  },
  {
    id: 'tachanun', region: 'shacharit', title: 'וידוי ותחנון', k: 'conditional', imp: 2,
    d: 'בקשת סליחה אחר העמידה: וידוי (״אשמנו״), י״ג מידות ונפילת אפיים.',
    w: 'בימי חול. אין אומרים בשבת, ביום טוב, בראש חודש, בחודש ניסן, בבית האבל, ובציבור שיש בו חתן או בעל ברית.',
    v: 'בעדות המזרח אומרים ״וידוי וי״ג מידות״ בכל יום ונפילת אפיים במזמור כ״ה (״לדוד אליך״) בלי הטיית הראש; באשכנז אומרים מזמור ו׳ (״ה׳ אל באפך״) בהטיית הראש על הזרוע.',
    t: {
      em: R('em', 'Weekday Shacharit/Vidui'),
      ash: R('ash', 'Weekday/Shacharit/Post Amidah/Tachanun'),
      sef: R('sef', 'Weekday Shacharit/Tachanun'),
      chabad: R('chabad', 'Shacharit/Tachnun'),
    },
    rmb: R('rambamOrder', '3'),
    kav: R('shaarKavanot', 'Sermons on the Falling on the Face Prayer', { count: 4 }),
    rel: [['related', 'vidui-yk', 'אותו וידוי בהרחבה']],
  },
  {
    id: 'avinu-malkenu', region: 'rh', title: 'אבינו מלכנו', k: 'conditional', imp: 2,
    d: 'שורת בקשות הפותחות ״אבינו מלכנו״, שמקורה בתפילת רבי עקיבא בתענית (תענית כה ע״ב).',
    w: 'בעשרת ימי תשובה ובימי תענית ציבור.',
    v: 'מספר השורות ונוסחן שונים מאוד בין העדות. בשבת אין אומרים בדרך כלל, אך במחזור עדות המזרח מצוין שביום הכיפורים אומרים אותו ״ואפילו בשבת״.',
    t: {
      em: R('rhEm', 'Shacharit/Avinu Malkenu'),
      ash: R('ash', 'Weekday/Shacharit/Post Amidah/Avinu Malkenu'),
      sef: R('sef', 'Weekday Shacharit/Avinu Malkeinu'),
    },
  },
  {
    id: 'kriat-hatorah', region: 'shacharit', title: 'קריאת התורה', k: 'conditional', imp: 2,
    d: 'הוצאת ספר התורה מן ההיכל, קריאה בציבור בברכות העולים והחזרתו. בחול קוראים שלושה עולים.',
    w: 'בימי שני וחמישי, בשבת, בראש חודש, במועדים ובתעניות — רק במניין.',
    v: 'בקהילות עדות המזרח ספר התורה נתון בתיק קשיח ונקרא בעמידה, ומגביהים אותו לפני הקריאה; באשכנז מגביהים אחריה. בתימן נהוג לתרגם את הקריאה בתרגום אונקלוס.',
    t: {
      em: R('em', 'Weekday Shacharit/Torah Reading'),
      ash: R('ash', 'Weekday/Shacharit/Torah Reading'),
      sef: R('sef', 'Weekday Shacharit/Torah Reading'),
      chabad: R('chabad', 'Shacharit/Torah Reading'),
    },
    kav: R('shaarKavanot', 'Sermons on Torah Reading', { count: 4 }),
  },
  {
    id: 'ashrei', region: 'shacharit', title: 'אשרי ובא לציון', k: 'core', imp: 2,
    d: '״אשרי״ (תהלים קמה, מזמור באלף־בית) ו״ובא לציון״ עם ״קדושה דסידרא״.',
    w: 'בסוף שחרית; ״אשרי״ גם בפתיחת מנחה.',
    t: {
      em: [R('em', 'Weekday Shacharit/Ashrei'), R('em', 'Weekday Shacharit/Uva LeSion')],
      ash: [R('ash', 'Weekday/Shacharit/Concluding Prayers/Ashrei'), R('ash', 'Weekday/Shacharit/Concluding Prayers/Uva Letzion')],
      sef: R('sef', 'Weekday Shacharit/Ashrei'),
      chabad: R('chabad', 'Shacharit/Ashrei Uva LeZion'),
    },
    kav: R('shaarKavanot', 'Sermons on Ashrei, Incense Compositions, and Aleinu', { count: 3 }),
  },
  {
    id: 'shir-shel-yom', region: 'shacharit', title: 'שיר של יום', k: 'core', imp: 1,
    d: 'המזמור שאמרו הלויים בבית המקדש בכל יום מימות השבוע.',
    w: 'בסוף שחרית.',
    v: 'בעדות המזרח ובנוסח ספרד אומרים אותו לאחר ״בית יעקב״; באשכנז — אחר ״עלינו״.',
    t: {
      em: R('em', 'Weekday Shacharit/Song of the Day'),
      ash: R('ash', 'Weekday/Shacharit/Concluding Prayers/Song of the Day'),
      sef: R('sef', 'Weekday Shacharit/Song of the Day'),
      chabad: R('chabad', 'Shacharit/Song of the Day'),
    },
  },
  {
    id: 'aleinu', region: 'shacharit', title: 'עלינו לשבח', k: 'core', imp: 2,
    d: 'תפילת סיום על מלכות ה׳ בעולם. במקורה פותחת את ברכת ״מלכויות״ במוסף ראש השנה, וממנה הועתקה לסיום כל תפילה.',
    w: 'בסוף שחרית, מנחה וערבית.',
    t: {
      em: R('em', 'Weekday Shacharit/Alenu'),
      ash: R('ash', 'Weekday/Shacharit/Concluding Prayers/Alenu'),
      sef: R('sef', 'Weekday Shacharit/Aleinu'),
      chabad: R('chabad', 'Shacharit/Aleinu'),
    },
    kav: R('shaarKavanot', 'Sermons on Aleinu and the Prayer Formula', { count: 4 }),
    rel: [['related', 'musaf-rh', 'מקורו בברכת מלכויות']],
  },
  {
    id: 'kaveh', region: 'shacharit', title: 'קוה ופיטום הקטורת', k: 'custom', imp: 1,
    d: 'סיום התפילה בפסוקי ״קוה אל ה׳״, ״אין כאלוהינו״ ופיטום הקטורת.',
    w: 'בסוף שחרית בנוסח עדות המזרח, ספרד וחב״ד; באשכנז בארץ ישראל — בחלק מהקהילות.',
    t: {
      em: R('em', 'Weekday Shacharit/Kaveh'),
      ash: R('ash', 'Weekday/Shacharit/Concluding Prayers/Korbanot (Israel)'),
      sef: R('sef', 'Weekday Shacharit/Kaveh'),
      chabad: R('chabad', 'Shacharit/Kaveh'),
    },
  },
  {
    id: 'zechirot', region: 'shacharit', title: 'זכירות ועיקרים', k: 'optional', imp: 1,
    d: 'תוספות לאחר התפילה: שש (או עשר) זכירות ושלושה עשר עיקרי האמונה של הרמב״ם.',
    w: 'לאחר שחרית, למי שנוהג.',
    t: {
      em: R('em', 'Additions for Shacharit'),
      ash: R('ash', 'Weekday/Shacharit/Post Service'),
      sef: R('sef', 'Additional Prayers /Six Rememberances'),
      chabad: R('chabad', 'Shacharit/Six Remembrances'),
    },
  },
  {
    id: 'birkat-kohanim', region: 'shacharit', title: 'ברכת כהנים', k: 'conditional', imp: 2,
    d: 'הכהנים עולים לדוכן ומברכים את העם ב״יברכך… יאר… ישא…״ בחזרת הש״ץ, לפני ״שים שלום״.',
    w: 'בארץ ישראל ובקהילות הספרדים — בכל יום בשחרית ובמוסף; בקהילות אשכנז בחוץ לארץ — רק במוסף של ימים טובים.',
    t: {
      em: R('ykEm', "Mussaf/Reader's Repetition", { start: 'וכשעומדים הכהנים', count: 2 }),
      ash: R('ash', 'Weekday/Shacharit/Amidah/Birkat Kohanim'),
      sef: R('sef', 'Priestly Blessing'),
    },
  },

  // ───────────────────────────── מנחה וערבית ─────────────────────────────
  {
    id: 'mincha-opening', region: 'erev', title: 'פתיחת מנחה', k: 'core', imp: 2,
    d: 'פתיחת תפילת המנחה: בעדות המזרח ובנוסח ספרד — פרשת התמיד ופיטום הקטורת ואחריהם ״אשרי״; באשכנז — ״אשרי״.',
    w: 'אחר הצהריים, מחצות היום ועד השקיעה.',
    t: {
      em: R('em', 'Weekday Mincha/Offerings'),
      ash: R('ash', 'Weekday/Minchah/Ashrei'),
      sef: R('sef', 'Weekday Mincha/Korbanot'),
      chabad: [R('chabad', 'Mincha/Korbanot'), R('chabad', 'Mincha/Ashrei')],
    },
    kav: R('shaarKavanot', 'Sermons on the Afternoon Prayers', { count: 4 }),
  },
  {
    id: 'arvit-shema', region: 'erev', title: 'ערבית: ברכו וקריאת שמע', k: 'core', imp: 2,
    d: 'פתיחת ערבית: ״והוא רחום״, ״ברכו״, ושתי ברכות לפני קריאת שמע ושתיים אחריה (״אמת ואמונה״, ״השכיבנו״).',
    w: 'בכל לילה, לאחר צאת הכוכבים (ובדיעבד מפלג המנחה).',
    v: 'בקהילות אשכנז בחוץ לארץ מוסיפים ״ברוך ה׳ לעולם אמן ואמן״; בעדות המזרח ובארץ ישראל לא.',
    t: {
      em: [R('em', 'Weekday Arvit/Barchu'), R('em', 'Weekday Arvit/The Shema')],
      ash: R('ash', 'Weekday/Maariv/Blessings of the Shema'),
      sef: R('sef', 'Weekday Maariv/The Shema'),
      chabad: R('chabad', 'Maariv', { end: 'אדני,? שפתי תפתח' }),
    },
    kav: R('shaarKavanot', 'Sermons on the Evening Prayers', { count: 4 }),
  },
  {
    id: 'sefirat-haomer', region: 'erev', title: 'ספירת העומר', k: 'conditional', imp: 1,
    d: 'ספירת ארבעים ותשעה ימים מליל טז׳ בניסן ועד שבועות, בברכה, ובקהילות רבות עם ״לשם יחוד״ ותפילת ״הרחמן״.',
    w: 'בכל לילה בין פסח לשבועות, בסוף ערבית.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Counting of the Omer'),
      ash: R('ash', 'Weekday/Maariv/Sefirat HaOmer'),
      sef: R('sef', 'Weekday Maariv/Sefirat HaOmer'),
      chabad: R('chabad', 'Sefirat HaOmer'),
    },
  },
  {
    id: 'kiddush-levana', region: 'erev', title: 'ברכת הלבנה', k: 'conditional', imp: 1,
    d: 'ברכה על חידוש הירח, הנאמרת מתחת לכיפת השמיים, בדרך כלל במוצאי שבת.',
    w: 'פעם בחודש, מכמה ימים לאחר המולד ועד אמצע החודש (יש הממתינים שלושה ימים ויש שבעה).',
    t: {
      em: R('em', 'Blessing of the Moon'),
      ash: R('ash', 'Weekday/Maariv/Birkat HaLevana'),
      sef: R('sef', 'Kiddush Levanah'),
      chabad: R('chabad', 'Kiddush Levanah'),
    },
  },
  {
    id: 'kriat-shema-al-hamita', region: 'erev', title: 'קריאת שמע שעל המיטה', k: 'core', imp: 1,
    d: 'קריאת שמע וברכת ״המפיל״ לפני השינה, עם מזמורי שמירה ו״אנא בכח״. אצל המקובלים — גם חשבון נפש ווידוי.',
    w: 'בכל לילה לפני השינה.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Bedtime Shema'),
      ash: R('ash', "Weekday/Maariv/Keri'at Shema al Hamita"),
      sef: R('sef', 'Bedtime Shema'),
      chabad: R('chabad', 'Bedtime Shema'),
    },
    kav: R('shaarKavanot', 'Sermons on the Night Ritual', { count: 4 }),
  },

  // ───────────────────────────── שבת ─────────────────────────────
  {
    id: 'nerot-shabbat', region: 'shabbat', title: 'הדלקת נרות שבת', k: 'core', imp: 2,
    d: 'הדלקת נרות לכבוד שבת ולשלום בית, בברכת ״להדליק נר של שבת״.',
    w: 'ביום שישי לפני השקיעה (נהוג 18 דקות לפני השקיעה, ובירושלים 40).',
    v: 'רוב הספרדים מברכים לפני ההדלקה; האשכנזים מדליקים, מכסים את העיניים ואז מברכים.',
    t: {
      em: R('em', 'Shabbat Candle Lighting'),
      sef: R('sef', 'Shabbat Candle Lighting'),
    },
  },
  {
    id: 'shir-hashirim', region: 'shabbat', title: 'שיר השירים', k: 'custom', imp: 1,
    d: 'קריאת שיר השירים כולו בערב שבת, כשיר אהבה בין הקב״ה לכנסת ישראל — מנהג שהתפשט בעקבות מקובלי צפת.',
    w: 'בערב שבת לפני מנחה או קבלת שבת.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Song of Songs'),
      sef: R('sef', 'Shabbat Eve Mincha/Song of Songs'),
    },
  },
  {
    id: 'yedid-nefesh', region: 'shabbat', title: 'ידיד נפש', k: 'custom', imp: 1,
    d: 'פיוט אהבה ודבקות שחיבר ר׳ אלעזר אזכרי, מחכמי צפת במאה ה־16.',
    w: 'לפני קבלת שבת (ובחלק מהקהילות בסעודה שלישית).',
    tags: ['kabbalah'],
    t: { ash: R('ash', 'Shabbat/Kabbalat Shabbat/Yedid Nefesh') },
    gen: R('yedidNefesh', ''),
  },
  {
    id: 'kabbalat-shabbat', region: 'shabbat', title: 'קבלת שבת', k: 'core', imp: 3,
    d: 'מזמורי תהלים ופיוט ״לכה דודי״ — יציאה לקראת ״שבת המלכה״. הסדר נקבע בצפת במאה ה־16 בידי המקובלים, והתקבל בכל העדות.',
    w: 'בליל שבת, לפני ערבית.',
    v: 'קיימים הבדלים בין העדות במזמורים הנאמרים ובסדרם; בעדות המזרח שולבו ״אנא בכח״ ו״לשם יחוד״.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Kabbalat Shabbat'),
      ash: R('ash', 'Shabbat/Kabbalat Shabbat'),
      sef: R('sef', 'Kabbalat Shabbat'),
    },
    kav: R('shaarKavanot', 'Sermons on Receiving the Sabbath', { count: 5 }),
    rel: [['contains', 'lecha-dodi'], ['contains', 'ana-bekoach']],
  },
  {
    id: 'lecha-dodi', region: 'shabbat', title: 'לכה דודי', k: 'core', imp: 2,
    d: 'הפיוט של ר׳ שלמה הלוי אלקבץ (צפת, המאה ה־16), שראשי בתיו יוצרים את השם ״שלמה הלוי״. בבית האחרון פונים לפתח ומקבלים את השבת.',
    w: 'בקבלת שבת.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Kabbalat Shabbat', { start: 'לכה דודי', end: '^מזמור' }),
      ash: R('ash', 'Shabbat/Kabbalat Shabbat/Lekha Dodi'),
      sef: R('sef', 'Kabbalat Shabbat', { start: 'לכה דודי', end: '^מזמור שיר ליום השבת' }),
    },
    gen: R('lekhaDodi', ''),
  },
  {
    id: 'arvit-shabbat', region: 'shabbat', title: 'ערבית של שבת', k: 'core', imp: 2,
    d: 'ערבית של ליל שבת: קריאת שמע, ״ושמרו״, עמידה של שבע ברכות, ״ויכולו״ וברכת ״מגן אבות״ (מעין שבע) של שליח הציבור.',
    w: 'בליל שבת.',
    t: {
      em: [R('em', 'Shabbat Arvit/Barchu'), R('em', 'Shabbat Arvit/The Shema'), R('em', 'Shabbat Arvit/Magen Avot')],
      ash: R('ash', 'Shabbat/Maariv'),
      sef: R('sef', 'Shabbat Eve Maariv'),
    },
    kav: R('shaarKavanot', 'Sermons on Sabbath Evening Prayers', { count: 4 }),
  },
  {
    id: 'shalom-aleichem', region: 'shabbat', title: 'שלום עליכם', k: 'custom', imp: 2,
    d: 'קבלת פני מלאכי השרת המלווים את האדם מבית הכנסת לביתו בליל שבת (על פי שבת קיט ע״ב).',
    w: 'בליל שבת, בכניסה לבית לפני הקידוש.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Shabbat Evening/Shalom Alekhem'),
      ash: R('ash', 'Shabbat/Shabbat Evening/Shalom Aleichem'),
      sef: R('sef', 'Shabbat Evening Meal/Shalom Aleichem'),
    },
  },
  {
    id: 'eshet-chayil', region: 'shabbat', title: 'אשת חיל', k: 'custom', imp: 1,
    d: 'משלי לא, י–לא: שבח ״אשת חיל״, הנאמר לכבוד עקרת הבית — ולפי המקובלים, גם כנגד השכינה.',
    w: 'בליל שבת לפני הקידוש.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Shabbat Evening/Eshet Hayil'),
      ash: R('ash', 'Shabbat/Shabbat Evening/Eshet Chayil'),
      sef: R('sef', 'Shabbat Evening Meal/Eishet Chayil'),
    },
  },
  {
    id: 'birkat-habanim', region: 'chaim', title: 'ברכת הבנים', k: 'custom', imp: 1,
    d: 'ההורים מברכים את הילדים: ״ישימך אלוהים כאפרים וכמנשה״ / ״כשרה רבקה רחל ולאה״ וברכת כהנים.',
    w: 'בליל שבת, ובערב יום הכיפורים לפני הכניסה לבית הכנסת.',
    t: {
      em: R('em', 'Shabbat Evening/Blessing of Children'),
      ash: R('ash', 'Shabbat/Shabbat Evening/Blessing the Children'),
      sef: R('sef', 'Shabbat Evening Meal/Blessing the Children'),
    },
  },
  {
    id: 'atkinu', region: 'shabbat', title: 'אתקינו סעודתא', k: 'custom', imp: 1,
    d: 'פסוקי ההזמנה בארמית שחיבר האר״י לכל אחת משלוש סעודות השבת, ועמם הפיוטים ״אזמר בשבחין״, ״אסדר לסעודתא״ ו״בני היכלא״.',
    w: 'בפתיחת סעודות השבת.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Shabbat Evening/Atkenu Seudata'),
      ash: R('ash', 'Shabbat/Third Meal/Atkinu'),
      sef: R('sef', 'Shabbat Evening Meal/Atkinu Seudata'),
    },
  },
  {
    id: 'kiddush-shabbat', region: 'shabbat', title: 'קידוש ליל שבת', k: 'core', imp: 2,
    d: 'קידוש היום על כוס יין: ״ויכולו״, ברכת הגפן וברכת ״מקדש השבת״.',
    w: 'בליל שבת, לפני הסעודה.',
    t: {
      em: R('em', 'Shabbat Evening/Kiddush'),
      ash: R('ash', 'Shabbat/Shabbat Evening/Kiddush'),
      sef: R('sef', 'Shabbat Evening Meal/Shabbat Eve Kiddush'),
    },
    kav: R('shaarKavanot', 'Sermons on Sabbath Night Kiddush', { count: 4 }),
  },
  {
    id: 'zemirot', region: 'shabbat', title: 'זמירות שבת', k: 'custom', imp: 1,
    d: 'שירי שבת המושרים סביב השולחן — ״יה ריבון״, ״יום זה לישראל״, ״צור משלו״ ועוד. כל עדה ומסורת הנגינה שלה.',
    w: 'בסעודות השבת.',
    t: {
      em: R('em', 'Shabbat Evening/Songs for Shabbat'),
      ash: R('ash', 'Shabbat/Shabbat Evening/Zemirot for Shabbat Evening'),
      sef: R('sef', 'Shabbat Evening Meal/Zemirot'),
    },
  },
  {
    id: 'zohar-seuda', region: 'sod', title: 'זוהר לסעודת שבת', k: 'custom', imp: 1,
    d: 'קטעי זוהר הנאמרים על שולחן השבת, כחלק מהכוונות של סעודות השבת.',
    w: 'בסעודת ליל שבת, למנהג עדות המזרח.',
    tags: ['kabbalah'],
    t: { em: R('em', 'Shabbat Evening/Zohar') },
  },
  {
    id: 'shacharit-shabbat', region: 'shabbat', title: 'שחרית של שבת', k: 'core', imp: 2,
    d: 'פסוקי דזמרה מורחבים של שבת — מזמורים נוספים, ״נשמת כל חי״ — וברכות קריאת שמע עם ״אל אדון״.',
    w: 'בבוקר שבת.',
    t: {
      em: [R('em', 'Shabbat Shacharit/Psalms for Shabbat'), R('em', "Shabbat Shacharit/Pesukei D'Zimra"), R('em', 'Shabbat Shacharit/The Shema')],
      ash: [R('ash', 'Shabbat/Shacharit/Pesukei Dezimra'), R('ash', 'Shabbat/Shacharit/Blessings of the Shema')],
      sef: [R('sef', "Shabbat Morning Services/Pesukei D'Zimrah"), R('sef', 'Shabbat Morning Services/Shema & Blessings')],
    },
  },
  {
    id: 'amidah-shabbat', region: 'shabbat', title: 'עמידה של שבת', k: 'core', imp: 2,
    d: 'בשבת העמידה קצרה — שבע ברכות: שלוש ראשונות, ״קדושת היום״ ושלוש אחרונות. בכל תפילה ״קדושת היום״ אחרת: ״אתה קידשת״, ״ישמח משה״, ״אתה אחד״.',
    w: 'בערבית, שחרית ומנחה של שבת; במוסף — עמידה משלה.',
    t: {
      em: R('em', 'Shabbat Shacharit/Amidah'),
      ash: R('ash', 'Shabbat/Shacharit/Amidah'),
      sef: R('sef', 'Shabbat Morning Services/Amidah'),
    },
  },
  {
    id: 'kriat-hatorah-shabbat', region: 'shabbat', title: 'קריאת התורה והפטרה', k: 'core', imp: 2,
    d: 'קריאת פרשת השבוע בשבעה עולים לפחות, מפטיר והפטרה מן הנביאים.',
    w: 'בשבת בבוקר.',
    t: {
      em: [R('em', 'Shabbat Shacharit/Torah Reading'), R('em', 'Shabbat Shacharit/Haftarah')],
      ash: R('ash', 'Shabbat/Shacharit/Torah Reading'),
      sef: [R('sef', 'Shabbat Morning Services/Shabbat Torah Reading'), R('sef', 'Shabbat Morning Services/Haftarah Blessings')],
    },
  },
  {
    id: 'birkat-hachodesh', region: 'shabbat', title: 'ברכת החודש', k: 'conditional', imp: 1,
    d: 'הכרזה על ראש החודש הקרב ותפילה לחודש טוב.',
    w: 'בשבת שלפני ראש חודש (חוץ מחודש תשרי).',
    t: {
      em: R('em', 'Shabbat Shacharit/Birkat HaChodesh'),
      ash: R('ash', 'Shabbat/Shacharit/Communal Prayers/Birkat Hachodesh'),
      sef: R('sef', 'Shabbat Morning Services/Blessing of New Month'),
    },
  },
  {
    id: 'musaf-shabbat', region: 'shabbat', title: 'מוסף של שבת', k: 'core', imp: 2,
    d: 'תפילה כנגד קרבן המוסף של שבת, עם ״תכנת שבת״ (בעדות המזרח ובנוסח ספרד) או ״ישמחו במלכותך״.',
    w: 'בשבת אחרי קריאת התורה.',
    t: {
      em: R('em', 'Shabbat Mussaf/Amida'),
      ash: R('ash', 'Shabbat/Musaf LeShabbat/Amidah'),
      sef: R('sef', 'Musaf'),
    },
  },
  {
    id: 'kiddush-yom', region: 'shabbat', title: 'קידושא רבה', k: 'core', imp: 1,
    d: 'קידוש היום של שבת בבוקר: ״ושמרו״, ״זכור את יום השבת״ וברכת הגפן.',
    w: 'לפני סעודת שבת בצהריים.',
    t: {
      em: R('em', 'Daytime Meal/Kiddush'),
      ash: R('ash', 'Shabbat/Daytime Meal/Kiddusha Rabba'),
      sef: R('sef', 'Shabbat Day Meal/Shabbat Day Kiddush'),
    },
  },
  {
    id: 'mincha-shabbat', region: 'shabbat', title: 'מנחה של שבת', k: 'core', imp: 1,
    d: 'מנחה של שבת: ״ואני תפילתי״, קריאת התורה בשלושה עולים מפרשת השבוע הבאה ועמידה ״אתה אחד״.',
    w: 'בשבת אחר הצהריים.',
    t: {
      em: [R('em', 'Shabbat Mincha/Uva LeSion'), R('em', 'Shabbat Mincha/Amida')],
      ash: R('ash', 'Shabbat/Minchah'),
      sef: R('sef', 'Shabbat Mincha/Amidah'),
    },
  },
  {
    id: 'pirkei-avot', region: 'shabbat', title: 'פרקי אבות', k: 'custom', imp: 1,
    d: 'לימוד פרק ממסכת אבות בכל שבת.',
    w: 'בשבתות הקיץ אחר מנחה: בעדות המזרח בין פסח לשבועות; באשכנז עד ראש השנה.',
    t: {
      em: R('em', 'Mishna Study for Shabbat/Pirkei Avot'),
      sef: R('sef', 'Shabbat Mincha/Pirkei Avot'),
    },
  },
  {
    id: 'seuda-shlishit', region: 'shabbat', title: 'סעודה שלישית', k: 'core', imp: 1,
    d: 'הסעודה השלישית של שבת, בין מנחה לשקיעה, ובה ״בני היכלא״, ״ידיד נפש״ ומזמור כג׳.',
    w: 'בשבת לפני צאתה.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Third Meal'),
      ash: R('ash', 'Shabbat/Third Meal'),
      sef: R('sef', 'Third Meal/Zemirot'),
    },
  },
  {
    id: 'havdalah', region: 'shabbat', title: 'הבדלה', k: 'core', imp: 2,
    d: 'הבדלה בין קודש לחול על כוס יין, בשמים ונר — ״המבדיל בין קודש לחול״.',
    w: 'במוצאי שבת ובמוצאי יום טוב (במוצאי יום הכיפורים — בלי בשמים, אלא אם כן חל בשבת).',
    t: {
      em: R('em', 'Havdalah/Havdala'),
      ash: R('ash', 'Shabbat/Havdalah'),
      sef: R('sef', 'Motzaei Shabbat /Havdala'),
    },
  },
  {
    id: 'veyiten-lecha', region: 'shabbat', title: 'ויתן לך ומלווה מלכה', k: 'custom', imp: 1,
    d: 'פסוקי ברכה לשבוע החדש וסעודה רביעית — ״מלווה מלכה״ — ללוויית השבת.',
    w: 'במוצאי שבת.',
    t: {
      em: [R('em', 'Havdalah/Veyiten Lecha'), R('em', 'Havdalah/Fourth Meal')],
      sef: R('sef', 'Motzaei Shabbat /Melava Malka Zemirot'),
    },
  },

  // ───────────────────────────── סעודה וברכות ─────────────────────────────
  {
    id: 'netilat-hamotzi', region: 'seuda', title: 'נטילת ידיים והמוציא', k: 'core', imp: 2,
    d: 'נטילת ידיים לסעודה בברכת ״על נטילת ידיים״, וברכת ״המוציא לחם מן הארץ״ על הפת.',
    w: 'בפתיחת כל סעודה שיש בה לחם.',
    t: { sef: R('sef', 'Mealtime Blessings') },
  },
  {
    id: 'zimmun', region: 'seuda', title: 'זימון', k: 'conditional', imp: 1,
    d: 'הזמנה משותפת לברכת המזון — ״רבותי נברך״ — כאשר אכלו יחד שלושה או יותר; בעשרה מוסיפים ״אלוהינו״.',
    w: 'בסיום סעודה של שלושה ומעלה.',
    t: {
      em: R('bh', 'Zimmun', { version: 'Birkat Hamazon -- Edot HaMizrach' }),
      ash: R('bh', 'Zimmun', { version: 'Birkat Hamazon -- Ashkenaz' }),
      sef: R('bh', 'Zimmun', { version: 'Birkat Hamazon -- Sefard' }),
      chabad: R('bh', 'Zimmun', { version: 'Birkat Hamazon -- Ari' }),
    },
  },
  {
    id: 'birkat-hamazon', region: 'seuda', title: 'ברכת המזון', k: 'core', imp: 3,
    d: 'מצווה מן התורה — ״ואכלת ושבעת וברכת״. ארבע ברכות: הזן, הארץ, בונה ירושלים והטוב והמטיב, ואחריהן בקשות ״הרחמן״.',
    w: 'לאחר כל סעודה שאכלו בה לחם כשיעור.',
    v: 'בשבת מוסיפים ״רצה״, בראש חודש ובמועדים ״יעלה ויבוא״, בחנוכה ובפורים ״על הניסים״.',
    t: {
      em: R('em', 'Post Meal Blessing'),
      ash: R('ash', 'Berachot/Birkat HaMazon'),
      sef: R('sef', 'Birchat HaMazon/Birchat HaMazon'),
      chabad: R('chabad', 'Blessings/Birkat HaMazon'),
    },
    rmb: R('rambamOrder', '4'),
    kab: R('bh', '', { version: 'Birkat Hamazon -- Ari' }),
    rel: [['contains', 'zimmun']],
  },
  {
    id: 'maein-shalosh', region: 'seuda', title: 'ברכה מעין שלוש', k: 'conditional', imp: 1,
    d: 'ברכה אחרונה מקוצרת — ״על המחיה״, ״על הגפן״, ״על העץ״ — על מיני מזונות, יין ופירות שבעת המינים.',
    w: 'לאחר אכילת מזונות, יין או פירות שנשתבחה בהם ארץ ישראל.',
    t: {
      em: R('em', 'Al Hamihya'),
      ash: R('ash', 'Berachot/Birkat Hanehenin/Eating/Brachot Achronot/Al Hamichyah'),
      sef: R('sef', "Blessings/Me'ein Shalosh"),
      chabad: R('chabad', 'Blessings/Berakha Acharona'),
    },
  },
  {
    id: 'birchot-hanehenin', region: 'seuda', title: 'ברכות הנהנין', k: 'core', imp: 1,
    d: 'ברכות לפני הנאה — על מאכלים, משקים וריחות — ״בורא פרי העץ״, ״שהכל נהיה בדברו״ ועוד.',
    w: 'לפני כל אכילה, שתייה או הרחה.',
    t: {
      em: R('em', 'Blessings on Enjoyments'),
      ash: R('ash', 'Berachot/Birkat Hanehenin'),
      sef: [R('sef', "Blessings/Ha'etz"), R('sef', "Blessings/Ha'adamah"), R('sef', 'Blessings/Shehakol'), R('sef', 'Blessings/Borei Nefashot')],
      chabad: R('chabad', 'Blessings/Various Blessings'),
    },
  },
  {
    id: 'tefilat-haderech', region: 'seuda', title: 'תפילת הדרך', k: 'conditional', imp: 1,
    d: 'בקשה לשמירה בדרך — ״שתוליכנו לשלום״.',
    w: 'כשיוצאים לדרך מחוץ לעיר.',
    t: {
      em: R('em', "Assorted Blessings and Prayers/Traveler's Prayer"),
      ash: R('ash', 'Berachot/Tefillat HaDerech'),
      sef: R('sef', "Blessings/Traveler's Prayer"),
      chabad: R('chabad', "Blessings/The Travelers' Prayer"),
    },
  },

  // ───────────────────────────── מעגל החיים ─────────────────────────────
  {
    id: 'kabbalat-panim', region: 'chaim', title: 'קבלת פנים וחתימת הכתובה', k: 'custom', imp: 1,
    d: 'לפני החופה: קבלת פנים לחתן ולכלה, ״קניין״ וחתימת העדים על הכתובה — שטר בארמית המפרט את התחייבויות החתן לכלה.',
    w: 'ביום החתונה, לפני החופה.',
    v: 'בקהילות אשכנז נהוג ״באדעקן״ — החתן מכסה את פני הכלה בהינומה. נוסח הכתובה ומנהגיה משתנים בין העדות.',
  },
  {
    id: 'erusin', region: 'chaim', title: 'ברכות האירוסין והטבעת', k: 'core', imp: 3,
    d: 'תחת החופה: ברכת הגפן וברכת האירוסין, והחתן נותן לכלה טבעת ואומר ״הרי את מקודשת לי בטבעת זו כדת משה וישראל״.',
    w: 'בטקס החופה.',
    v: 'בקהילות אשכנז נוהגות רבות שהכלה מקיפה את החתן שבע פעמים. בחלק מקהילות ספרד פורשים טלית על החתן והכלה.',
    t: {
      em: R('em', 'Assorted Blessings and Prayers/Marriage'),
      sef: R('sef', 'Various Blessings/Marriage Blessings', { end: 'קוראים הכתובה' }),
      chabad: R('chabad', 'Blessings of Marriage Ceremony', { end: 'שהכל ברא' }),
    },
  },
  {
    id: 'ketuba-reading', region: 'chaim', title: 'קריאת הכתובה', k: 'core', imp: 1,
    d: 'קריאת הכתובה בקול תחת החופה, המפרידה בין האירוסין לנישואין. טקסט הכתובה אינו מוצג כאן — כל קהילה ונוסחה.',
    w: 'בין ברכות האירוסין לשבע הברכות.',
  },
  {
    id: 'sheva-brachot', region: 'chaim', title: 'שבע ברכות', k: 'core', imp: 3,
    d: 'שבע ברכות הנישואין: ״שהכל ברא לכבודו״, ״יוצר האדם״, ״אשר יצר את האדם בצלמו״, ״משמח ציון בבניה״, ״משמח חתן וכלה״ ו״אשר ברא ששון ושמחה״ — עם ברכת הגפן.',
    w: 'תחת החופה, ושוב בסיום כל סעודה בשבעת ימי המשתה (במניין ובהשתתפות ״פנים חדשות״).',
    t: {
      em: R('em', 'Assorted Blessings and Prayers/Sheva Berachot'),
      sef: R('sef', 'Various Blessings/Sheva Berachot'),
      chabad: R('chabad', 'Blessings/Sheva Berakhot'),
    },
    gen: R('bh', 'Sheva Brachot', { version: 'Sheva Brachot' }),
  },
  {
    id: 'shvirat-hakos', region: 'chaim', title: 'שבירת הכוס', k: 'custom', imp: 1,
    d: 'החתן שובר כוס זכר לחורבן ירושלים, ואומר ״אם אשכחך ירושלים״ — לזכור את ירושלים ״על ראש שמחתי״.',
    w: 'בסיום טקס החופה.',
    t: { em: R('em', 'Assorted Blessings and Prayers/Sheva Berachot', { start: 'ושובר החתן', endInclusive: true, end: 'אם אשכחך' }) },
  },
  {
    id: 'yichud', region: 'chaim', title: 'ייחוד', k: 'custom', imp: 1,
    d: 'החתן והכלה נכנסים לחדר לבדם לזמן קצר, כחלק מגמר הנישואין לפי חלק מהפוסקים.',
    w: 'מיד אחרי החופה.',
    v: 'נהוג בקהילות אשכנז; בקהילות רבות מעדות המזרח אין נוהגים בחדר ייחוד.',
  },
  {
    id: 'brit-mila', region: 'chaim', title: 'סדר ברית מילה', k: 'core', imp: 3,
    d: 'ברית מילה ביום השמיני: ״ברוך הבא״, כיסא אליהו, ברכת המוהל ״על המילה״, ברכת האב ״להכניסו בבריתו של אברהם אבינו״ ותפילת קריאת השם.',
    w: 'ביום השמיני ללידה, גם בשבת ויום הכיפורים (אם הוא במועדו).',
    v: 'בעדות המזרח אבי הבן מברך גם ״שהחיינו״ (וכך מופיע בסידור); בקהילות אשכנז בחוץ לארץ בדרך כלל לא.',
    t: {
      em: R('em', 'Assorted Blessings and Prayers/Brit Mila'),
      sef: R('sef', 'Various Blessings/Circumcision'),
      chabad: R('chabad', 'Order of a Circumcision'),
    },
  },
  {
    id: 'kisse-eliyahu', region: 'chaim', title: 'כיסא של אליהו', k: 'custom', imp: 1,
    d: 'כיסא מיוחד לאליהו הנביא, ״מלאך הברית״, שעליו מניחים את התינוק לפני המילה.',
    w: 'בברית מילה.',
    t: { em: R('em', 'Assorted Blessings and Prayers/Brit Mila', { start: 'זה הכסא של אליהו', count: 1 }) },
  },
  {
    id: 'harachaman-brit', region: 'chaim', title: 'הרחמן לברית מילה', k: 'conditional', imp: 1,
    d: 'בקשות ״הרחמן״ מיוחדות לאבי הבן, לסנדק, למוהל ולתינוק, בברכת המזון של סעודת הברית.',
    w: 'בסעודת ברית מילה.',
    t: {
      sef: R('sef', 'Birchat HaMazon/Brit Milah'),
      chabad: R('chabad', 'Blessings/Birkat HaMazon for Circumcision'),
    },
    gen: R('bh', 'HaRachaman of Brit Milah', { version: 'Brit Mila Additions ' }),
  },
  {
    id: 'pidyon-haben', region: 'chaim', title: 'פדיון הבן', k: 'conditional', imp: 1,
    d: 'פדיון בכור מכהן בחמישה סלעים.',
    w: 'ביום השלושים ואחד ללידת בן בכור לאמו (אם אינו כהן או לוי).',
    t: {
      em: R('em', 'Assorted Blessings and Prayers/Redeeming the First Born'),
      sef: R('sef', 'Various Blessings/Redeeming Firstborn'),
      chabad: R('chabad', 'Pidyon HaBen'),
    },
  },
  {
    id: 'zeved-habat', region: 'chaim', title: 'זבד הבת', k: 'custom', imp: 1,
    d: 'מנהג ספרדי לקריאת שם לבת: ״יונתי בחגוי הסלע״ ו״מי שברך״ לאם ולבת.',
    w: 'בבית הכנסת לאחר הלידה, בדרך כלל בשבת.',
    t: { em: R('em', 'Shabbat Shacharit/Zeved HaBat') },
  },

  // ───────────────────────────── מועדים ─────────────────────────────
  {
    id: 'yaale-veyavo', region: 'moadim', title: 'יעלה ויבוא', k: 'conditional', imp: 2,
    d: 'תוספת לעמידה (בברכת ״רצה״) ולברכת המזון, המזכירה את היום — ראש חודש או מועד.',
    w: 'בראש חודש, בחול המועד ובימים טובים.',
    t: {
      em: R('em', 'Weekday Shacharit/Amida', { start: 'יעלה ויבא', count: 1 }),
      ash: R('ash', 'Weekday/Shacharit/Amidah/Temple Service'),
      sef: R('sef', 'Weekday Shacharit/Amidah', { start: 'יעלה ויבא', count: 1 }),
    },
    rel: [['adds', 'amidah', 'בברכת רצה'], ['adds', 'birkat-hamazon', 'בברכת בונה ירושלים']],
  },
  {
    id: 'hallel', region: 'moadim', title: 'הלל', k: 'conditional', imp: 3,
    d: 'מזמורי תהלים קיג–קיח, שירת הודיה על הגאולה. ״הלל שלם״ או ״חצי הלל״ (בדילוג) — לפי היום.',
    w: 'הלל שלם: בימים טובים, בכל ימי חנוכה ובליל הסדר. חצי הלל: בראש חודש ובימי פסח האחרונים.',
    v: 'בחצי הלל של ראש חודש: הספרדים אינם מברכים, האשכנזים מברכים.',
    t: {
      em: R('em', 'Rosh Hodesh/Hallel'),
      ash: R('ash', 'Festivals/Rosh Chodesh/Hallel'),
      sef: R('sef', 'Rosh Chodesh/Hallel'),
      chabad: R('chabad', 'Hallel'),
    },
    gen: R('hallel', ''),
  },
  {
    id: 'musaf-rosh-chodesh', region: 'moadim', title: 'מוסף לראש חודש', k: 'conditional', imp: 1,
    d: 'עמידת מוסף כנגד קרבן ראש החודש, ובה ״ראשי חודשים לעמך נתת״.',
    w: 'בראש חודש, אחר שחרית.',
    t: {
      em: R('em', 'Rosh Hodesh/Mussaf'),
      ash: R('ash', 'Festivals/Rosh Chodesh/Musaf Amidah for Rosh Chodesh'),
      sef: R('sef', 'Rosh Chodesh/Mussaf'),
      chabad: R('chabad', 'Rosh Chodesh'),
    },
    kav: R('shaarKavanot', 'Sermons on Rosh Chodesh', { count: 4 }),
  },
  {
    id: 'barchi-nafshi', region: 'moadim', title: 'ברכי נפשי', k: 'conditional', imp: 1,
    d: 'מזמור קד בתהלים, על חידוש הבריאה, ובו ״עשה ירח למועדים״.',
    w: 'בראש חודש (ובאשכנז גם בשבתות החורף אחר מנחה).',
    t: {
      em: R('em', 'Rosh Hodesh/Barchi Nafshi'),
      ash: R('ash', 'Weekday/Shacharit/Concluding Prayers/Barchi Nafshi'),
      sef: R('sef', 'Rosh Chodesh/Barchi Nafshi'),
    },
  },
  {
    id: 'amidah-regalim', region: 'moadim', title: 'עמידה לשלוש רגלים', k: 'conditional', imp: 2,
    d: 'עמידת יום טוב: ״אתה בחרתנו״ ו״ותתן לנו… את יום חג המצות / השבועות / הסוכות הזה״.',
    w: 'בערבית, שחרית ומנחה של פסח, שבועות וסוכות.',
    t: {
      em: R('em', 'Prayers for Three Festivals/Amidah'),
      ash: R('ash', 'Festivals/Shalosh Regalim/Amida for Maariv, Shacharit, Mincha'),
      sef: R('sef', 'Holidays/Maariv, Shacharit & Mincha Amidah'),
    },
  },
  {
    id: 'musaf-regalim', region: 'moadim', title: 'מוסף לשלוש רגלים', k: 'conditional', imp: 1,
    d: 'מוסף של יום טוב — ״ומפני חטאינו גלינו מארצנו״ — כנגד קרבנות החג.',
    w: 'בימים טובים ובחול המועד.',
    t: {
      em: R('em', 'Prayers for Three Festivals/Mussaf'),
      ash: R('ash', 'Festivals/Shalosh Regalim/Mussaf'),
      sef: R('sef', 'Holidays/Yom Tov Musaf Amidah'),
      chabad: R('chabad', 'Musaf for Festivals'),
    },
  },
  {
    id: 'kiddush-yom-tov', region: 'moadim', title: 'קידוש ליום טוב', k: 'conditional', imp: 1,
    d: 'קידוש על היין לכבוד החג, ובלילה הראשון — ״שהחיינו״.',
    w: 'בלילות יום טוב.',
    t: { sef: R('sef', 'Holidays/Yom Tov Eve Kiddush') },
  },
  {
    id: 'sukka', region: 'moadim', title: 'ישיבה בסוכה ואושפיזין', k: 'conditional', imp: 2,
    d: 'ברכת ״לישב בסוכה״ והזמנת ה״אושפיזין״ — אברהם, יצחק, יעקב, משה, אהרן, יוסף ודוד — אורח עליון לכל יום, על פי הזוהר.',
    w: 'בכל שבעת ימי סוכות.',
    tags: ['kabbalah'],
    t: {
      ash: R('ash', 'Festivals/Sukkot/Prayers in the Sukkah'),
      sef: R('sef', 'Holidays/Prayer Upon Entering Sukkah'),
    },
    kav: R('shaarKavanot', 'Sermons on the Festival of Sukkot', { count: 4 }),
  },
  {
    id: 'lulav', region: 'moadim', title: 'נטילת לולב', k: 'conditional', imp: 2,
    d: 'נטילת ארבעת המינים — לולב, אתרוג, הדסים וערבות — בברכה, ונענועים לשש רוחות.',
    w: 'בכל ימי סוכות חוץ משבת, לפני הלל או בתוכו.',
    v: 'סדר הנענועים שונה: עדות המזרח, נוסח ספרד וחב״ד נוהגים לפי האר״י; באשכנז — סדר אחר.',
    tags: ['kabbalah'],
    t: {
      ash: R('ash', 'Festivals/Sukkot/Blessing on Lulav'),
      sef: R('sef', 'Shaking Lulav'),
      chabad: R('chabad', 'Lulav'),
    },
  },
  {
    id: 'hoshanot', region: 'moadim', title: 'הושענות והושענא רבה', k: 'conditional', imp: 1,
    d: 'הקפת הבימה עם ארבעת המינים ופיוטי ״הושענא״; בהושענא רבה — שבע הקפות וחביטת ערבות.',
    w: 'בכל ימי סוכות; בהושענא רבה בהרחבה.',
    t: {
      ash: R('ash', "Festivals/Sukkot/Hosha'anot"),
      sef: R('sef', 'Sukkot'),
    },
  },
  {
    id: 'geshem', region: 'moadim', title: 'תפילת גשם', k: 'conditional', imp: 1,
    d: 'תפילה לגשמים, שממנה מתחילים להזכיר ״משיב הרוח ומוריד הגשם״.',
    w: 'בשמיני עצרת, במוסף.',
    t: {
      ash: R('ash', 'Festivals/Prayer for Rain'),
      sef: R('sef', 'Holidays/Prayer for Rain'),
    },
  },
  {
    id: 'hakafot', region: 'moadim', title: 'הקפות שמחת תורה', k: 'custom', imp: 1,
    d: 'שבע הקפות עם ספרי התורה בשירה ובריקודים, וסיום והתחלת קריאת התורה.',
    w: 'בשמחת תורה (בארץ ישראל — בשמיני עצרת).',
    t: { sef: R('sef', 'Simchat Torah/Hakafot') },
  },
  {
    id: 'ner-chanukah', region: 'moadim', title: 'הדלקת נר חנוכה', k: 'conditional', imp: 3,
    d: 'הדלקת נרות בשמונת ימי חנוכה, נר אחד ביום הראשון ונר נוסף בכל יום, בברכות ״להדליק נר חנוכה״ ו״שעשה ניסים״ (ובלילה הראשון גם ״שהחיינו״), ואחריהן ״הנרות הללו״.',
    w: 'בשמונת לילות חנוכה, מכ״ה בכסלו.',
    v: 'באשכנז שרים ״מעוז צור״; בעדות המזרח אומרים ״מזמור שיר חנוכת הבית״.',
    t: {
      em: R('em', 'Hanukkah/Menorah Lighting'),
      ash: R('ash', 'Festivals/Chanukah/Service for Lighting Chanukah Candles'),
      sef: R('sef', 'Chanukah/Menorah Lighting'),
      chabad: R('chabad', 'Chanukah'),
    },
    kav: R('shaarKavanot', 'Sermons on the Festival of Hanukkah', { count: 4 }),
  },
  {
    id: 'al-hanisim', region: 'moadim', title: 'על הניסים', k: 'conditional', imp: 2,
    d: 'תוספת הודיה על ניסי חנוכה (״בימי מתתיהו״) ופורים (״בימי מרדכי ואסתר״) בברכת ״מודים״ שבעמידה ובברכת הארץ שבברכת המזון.',
    w: 'בכל ימי חנוכה ובפורים.',
    t: {
      ash: [R('ash', 'Shabbat/Minchah/Amidah/Thanksgiving/Al Hanisim for Chanukkah'), R('ash', 'Shabbat/Minchah/Amidah/Thanksgiving/Al Hanisim for Purim')],
      em: R('em', 'Weekday Shacharit/Amida', { start: 'על הנסים', count: 3 }),
      sef: R('sef', 'Weekday Shacharit/Amidah', { start: 'על הנסים', count: 3 }),
    },
    rel: [['adds', 'amidah', 'בברכת מודים'], ['adds', 'birkat-hamazon', 'בברכת הארץ']],
  },
  {
    id: 'chanukah-shacharit', region: 'moadim', title: 'שחרית של חנוכה', k: 'conditional', imp: 1,
    d: 'הלל שלם וקריאת התורה בפרשת חנוכת המשכן (״הנשיאים״).',
    w: 'בכל בוקר של חנוכה.',
    t: {
      em: R('em', 'Hanukkah/Shacharit'),
      sef: R('sef', 'Chanukah/Torah Reading'),
    },
  },
  {
    id: 'taanit-esther', region: 'moadim', title: 'תענית אסתר', k: 'conditional', imp: 1,
    d: 'יום צום לפני פורים, זכר לצום אסתר והעם; אומרים סליחות ו״עננו״.',
    w: 'בי״ג באדר (ואם חל בשבת — מוקדם ליום חמישי).',
    t: {
      em: R('em', 'Fast Days and Mourning/Fast of Esther'),
      ash: R('ash', 'Festivals/Selichot/Fast of Esther'),
      sef: R('sef', 'Fast Days/Selichot for Taanit Esther'),
    },
  },
  {
    id: 'parashat-zachor', region: 'moadim', title: 'שבת זכור', k: 'conditional', imp: 1,
    d: 'קריאת ״זכור את אשר עשה לך עמלק״ בשבת שלפני פורים, ופיוטים לשבת זכור.',
    w: 'בשבת שלפני פורים.',
    t: {
      em: R('em', 'Purim/Shabbat Zachor'),
      sef: R('sef', 'Purim/Parashat Zachor'),
    },
  },
  {
    id: 'megilla', region: 'moadim', title: 'קריאת המגילה', k: 'conditional', imp: 3,
    d: 'קריאת מגילת אסתר מקלף, בלילה וביום, בברכות ״על מקרא מגילה״, ״שעשה ניסים״ ו״שהחיינו״, ואחריה ״הרב את ריבנו״ ו״שושנת יעקב״.',
    w: 'בליל פורים ובבוקרו (בי״ד באדר; בירושלים — בט״ו).',
    t: {
      em: R('em', 'Purim/Megillah Reading'),
      sef: R('sef', 'Purim/Megillah Reading'),
      chabad: R('chabad', 'Purim'),
    },
    kav: R('shaarKavanot', 'Sermons on the Festival of Purim', { count: 4 }),
  },
  {
    id: 'purim-day', region: 'moadim', title: 'מצוות יום הפורים', k: 'conditional', imp: 1,
    d: 'משלוח מנות איש לרעהו, מתנות לאביונים וסעודת פורים — ולצדן קריאת התורה ״ויבוא עמלק״.',
    w: 'ביום הפורים.',
    t: {
      em: R('em', 'Purim/Purim Day'),
      sef: R('sef', 'Purim/Order of Purim Day'),
    },
  },

  // ───────────────────────────── ליל הסדר ─────────────────────────────
  ...[
    ['kadesh', 'קדש', 'Kadesh', 'כוס ראשונה — קידוש של יום טוב, בהסבה.'],
    ['urchatz', 'ורחץ', 'Urchatz', 'נטילת ידיים בלי ברכה לפני טיבול הכרפס.'],
    ['karpas', 'כרפס', 'Karpas', 'טיבול ירק במי מלח, בברכת ״בורא פרי האדמה״ — כדי שישאלו הילדים.'],
    ['yachatz', 'יחץ', 'Yachatz', 'בציעת המצה האמצעית; החלק הגדול נשמר לאפיקומן.'],
    ['maggid', 'מגיד', 'Magid', 'סיפור יציאת מצרים: ״הא לחמא עניא״, ״מה נשתנה״, ארבעה בנים, עשר המכות, ״דיינו״, ״רבן גמליאל״, תחילת ההלל וכוס שנייה.'],
    ['rachtza', 'רחצה', 'Rachtzah', 'נטילת ידיים בברכה לסעודה.'],
    ['motzi-matza', 'מוציא מצה', 'Motzi Matzah', 'ברכות ״המוציא״ ו״על אכילת מצה״ ואכילת כזית מצה בהסבה.'],
    ['maror', 'מרור', 'Maror', 'אכילת מרור טבול בחרוסת, בברכת ״על אכילת מרור״.'],
    ['korech', 'כורך', 'Korech', 'כריכת מצה ומרור יחד, ״זכר למקדש כהלל״.'],
    ['shulchan-orech', 'שולחן עורך', 'Shulchan Orech', 'סעודת החג.'],
    ['tzafun', 'צפון', 'Tzafun', 'אכילת האפיקומן, זכר לקרבן פסח.'],
    ['barech', 'ברך', 'Barech', 'ברכת המזון על כוס שלישית, ו״שפוך חמתך״.'],
    ['hallel-seder', 'הלל', 'Hallel', 'השלמת ההלל, ״הלל הגדול״, ״נשמת״ וכוס רביעית.'],
    ['nirtzah', 'נרצה', 'Nirtzah', '״חסל סידור פסח״, ״לשנה הבאה בירושלים״ ושירי הסיום — ״אחד מי יודע״, ״חד גדיא״.'],
  ].map(([id, title, en, d], i) => ({
    id, region: 'pesach', title, k: 'core', imp: id === 'maggid' ? 3 : 2,
    d, w: 'בליל הסדר — ליל ט״ו בניסן (ובחוץ לארץ גם ליל ט״ז).',
    t: {
      em: R('hagEm', en),
      sef: R('sef', 'Pesach Haggadah/' + ({ Magid: 'Maggid', Rachtzah: 'Rochtzoh', 'Motzi Matzah': 'Motzi, Matzah', Kadesh: 'Kadesh' }[en] || en)),
    },
    gen: R('hag', en),
    ...(id === 'maggid' ? { rel: [['contains', 'ma-nishtana']], kav: R('shaarKavanot', 'Sermons on Passover', { count: 5 }) } : {}),
  })),
  {
    id: 'ma-nishtana', region: 'pesach', title: 'מה נשתנה', k: 'core', imp: 2,
    d: 'ארבע הקושיות שהילדים שואלים, ושעליהן עונה כל ההגדה.',
    w: 'בתחילת המגיד.',
    v: 'בהגדות עדות המזרח סדר הקושיות שונה מעט: ״שאפילו פעם אחת״ לטיבול, ״מצה״, ״מרור״ ו״מסובין״.',
    t: { em: R('hagEm', 'Magid/Four Questions') },
    gen: R('hag', 'Magid/Four Questions'),
  },
  {
    id: 'bedikat-chametz', region: 'pesach', title: 'בדיקת חמץ וביעורו', k: 'conditional', imp: 1,
    d: 'בדיקת הבית לאור נר בליל י״ד בניסן, ביטול החמץ (״כל חמירא״) ושריפתו בבוקר.',
    w: 'בליל י״ד בניסן ובבוקרו.',
    t: { sef: [R('sef', 'Nissan/Search for Hametz'), R('sef', 'Nissan/Burning Hametz')] },
  },

  // ───────────────────────────── ראש השנה ─────────────────────────────
  {
    id: 'selichot', region: 'rh', title: 'סליחות', k: 'conditional', imp: 2,
    d: 'פיוטי בקשה ותחנונים ו״שלוש עשרה מידות של רחמים״ באשמורת הבוקר.',
    w: 'בעדות המזרח — מראש חודש אלול ועד יום הכיפורים; באשכנז — מהשבוע שלפני ראש השנה.',
    t: { em: R('selichotEm', '') },
  },
  {
    id: 'hatarat-nedarim', region: 'rh', title: 'התרת נדרים', k: 'custom', imp: 1,
    d: 'התרת נדרים לפני בית דין של שלושה, כדי להיכנס לשנה החדשה נקיים מנדרים.',
    w: 'בערב ראש השנה (ויש הנוהגים גם בערב יום הכיפורים).',
    t: {
      em: R('rhEm', 'Annulment of Vows and Curses'),
      ash: R('rhAsh', 'Annullment of Vows'),
      sef: R('rhSef', 'Annullment of Vows'),
      chabad: R('chabad', 'Annulment of Vows'),
    },
  },
  {
    id: 'arvit-rh', region: 'rh', title: 'ערבית של ראש השנה', k: 'core', imp: 1,
    d: 'ערבית ליל ראש השנה, עם עמידה של ראש השנה ו״לדוד מזמור״.',
    w: 'בלילות ראש השנה.',
    v: 'בעדות המזרח פותחים בפיוט ״אחות קטנה״.',
    t: {
      em: R('rhEm', 'Arvit'),
      ash: R('rhAsh', 'Maariv'),
      sef: R('rhSef', 'Maariv'),
    },
  },
  {
    id: 'simanim', region: 'rh', title: 'סדר הסימנים', k: 'custom', imp: 2,
    d: 'אכילת מאכלים שיש בשמם סימן לשנה טובה — תפוח בדבש, רימון, תמרים, רוביא, כרתי, סלק, דלעת ראש — כל אחד עם ״יהי רצון״ (על פי ״סימנא מילתא״, הוריות יב ע״א).',
    w: 'בסעודת ליל ראש השנה.',
    v: 'בעדות המזרח הסדר מפורט ומורחב, ונאמר בו ״יהי רצון״ על כל סימן; באשכנז — בעיקר תפוח בדבש.',
    t: {
      em: R('rhEm', 'Seder Rosh Hashana'),
      sef: R('rhSef', 'Rosh Hashanah Customs'),
    },
  },
  {
    id: 'kiddush-rh', region: 'rh', title: 'קידוש ראש השנה', k: 'core', imp: 1,
    d: 'קידוש על היין: ״…את יום הזיכרון הזה, יום תרועה מקרא קודש״ ו״שהחיינו״.',
    w: 'בלילות ראש השנה ובבוקר.',
    t: {
      em: R('rhEm', 'Nighttime Kiddush'),
      ash: R('rhAsh', 'Kiddush'),
      sef: R('rhSef', 'Kiddush'),
    },
  },
  {
    id: 'amidah-rh', region: 'rh', title: 'שחרית וחזרת הש״ץ של ראש השנה', k: 'core', imp: 2,
    d: 'עמידה של ראש השנה עם ״ובכן תן פחדך״ ו״המלך הקדוש״, וחזרת הש״ץ המשובצת בפיוטים.',
    w: 'בבוקר ראש השנה.',
    t: {
      em: R('rhEm', 'Shacharit/Amidah'),
      ash: R('rhAsh', 'The Morning Prayers/First Day of Rosh Hashana', { count: 60 }),
      sef: R('rhSef', 'The Morning Prayers/First Day of Rosh Hashana', { count: 60 }),
    },
  },
  {
    id: 'shofar', region: 'rh', title: 'תקיעת שופר', k: 'core', imp: 3,
    d: 'מצוות היום — ״יום תרועה יהיה לכם״: ברכות ״לשמוע קול שופר״ ו״שהחיינו״, ותקיעות, שברים ותרועות; נהוג להשלים למאה קולות.',
    w: 'בשני ימי ראש השנה, לפני מוסף ובתוכו (לא בשבת).',
    tags: ['kabbalah'],
    t: {
      em: R('rhEm', 'Sounding of the Shofar'),
      ash: R('rhAsh', 'Sounding of the Shofar'),
      sef: R('rhSef', 'Sounding of the Shofar/Blessings and Sounding of the Shofar'),
    },
    kav: R('shaarKavanot', 'Sermons on Rosh Hashanah', { count: 5 }),
  },
  {
    id: 'unetaneh-tokef', region: 'rh', title: 'ונתנה תוקף', k: 'custom', imp: 2,
    d: 'פיוט על יום הדין — ״מי יחיה ומי ימות״ — ״ותשובה ותפילה וצדקה מעבירין את רוע הגזירה״. המסורת מייחסת אותו לר׳ אמנון ממגנצא; המחקר מצא אותו בכתבים קדומים יותר מארץ ישראל.',
    w: 'במוסף של ראש השנה ויום הכיפורים, לפני הקדושה.',
    v: 'חלק קבוע בנוסח אשכנז ובנוסח ספרד; בעדות המזרח רק ״יש נוהגים״ לאומרו, כפי שמציינים המחזורים עצמם.',
    t: {
      em: R('rhEm', 'Unetanneh Tokef'),
      ash: R('rhAsh', 'Musaf/First Day of Rosh Hashana', { start: 'ונתנה\\s+תקף', count: 6 }),
      sef: R('rhSef', 'Musaf/First Day of Rosh Hashana', { start: 'ונתנה\\s+תקף', count: 6 }),
    },
    gen: R('unetaneh', ''),
  },
  {
    id: 'musaf-rh', region: 'rh', title: 'מוסף: מלכויות, זכרונות, שופרות', k: 'core', imp: 3,
    d: 'מוסף ראש השנה, בן תשע ברכות: שלוש ברכות אמצעיות — מלכויות, זכרונות ושופרות — ובכל אחת עשרה פסוקים, ותקיעות לאחריה.',
    w: 'בשני ימי ראש השנה.',
    t: {
      em: R('rhEm', 'Musaf'),
      ash: R('rhAsh', 'Musaf/First Day of Rosh Hashana'),
      sef: R('rhSef', 'Musaf/First Day of Rosh Hashana'),
    },
  },
  {
    id: 'tashlich', region: 'rh', title: 'תשליך', k: 'custom', imp: 2,
    d: 'אמירת ״מי אל כמוך… ותשליך במצולות ים כל חטאתם״ ליד מקור מים.',
    w: 'ביום הראשון של ראש השנה אחר הצהריים (אם חל בשבת — יש הדוחים ליום השני).',
    t: {
      em: R('rhEm', 'Tashlich'),
      ash: R('rhAsh', 'Tashlich'),
      sef: R('rhSef', 'Tashlich'),
    },
  },

  // ───────────────────────────── יום הכיפורים ─────────────────────────────
  {
    id: 'kapparot', region: 'yk', title: 'כפרות', k: 'custom', imp: 1,
    d: 'סיבוב תרנגול או כסף מעל הראש ואמירת ״זה חליפתי״, ונתינתו לצדקה.',
    w: 'בעשרת ימי תשובה, בעיקר בערב יום הכיפורים.',
    v: 'מנהג שנוי במחלוקת: השולחן ערוך כתב ״יש למנוע המנהג״, והרמ״א והאר״י קיימוהו. רבים נוהגים כיום בכסף לצדקה.',
    tags: ['kabbalah'],
    t: {
      em: R('ykEm', 'Kapparot'),
      ash: R('ykAsh', 'Kaporos'),
      sef: R('ykSef', 'Kapparot'),
      chabad: R('chabad', 'Kapparot'),
    },
  },
  {
    id: 'malkot', region: 'yk', title: 'מלקות', k: 'custom', imp: 1,
    d: 'מלקות סמליות לעורר תשובה, בעת אמירת ״והוא רחום״ שלוש פעמים.',
    w: 'בערב יום הכיפורים אחר מנחה.',
    t: { em: R('ykEm', 'Lashes') },
  },
  {
    id: 'mincha-erev-yk', region: 'yk', title: 'מנחה של ערב יום הכיפורים', k: 'core', imp: 2,
    d: 'מנחה מוקדמת שבסוף העמידה אומרים וידוי — ״שמא יארע לו קלקלה בסעודה״ (יומא פז ע״ב).',
    w: 'בערב יום הכיפורים, לפני סעודה המפסקת.',
    t: {
      em: R('ykEm', 'Mincha for Yom Kippur Eve'),
      ash: R('ykAsh', 'Mincha Service for Erev Yom Kippur'),
      sef: R('ykSef', 'Mincha Service for Erev Yom Kippur'),
    },
    rel: [['contains', 'vidui-yk']],
  },
  {
    id: 'seuda-mafseket', region: 'yk', title: 'סעודה המפסקת', k: 'core', imp: 1,
    d: 'הסעודה האחרונה לפני הצום, ובקשות לפניה ואחריה. עם סיומה מקבלים את חמשת העינויים.',
    w: 'בערב יום הכיפורים, לפני השקיעה.',
    t: { em: R('ykEm', 'Seudah HaMafseket') },
  },
  {
    id: 'nerot-yk', region: 'yk', title: 'הדלקת נרות יום הכיפורים', k: 'core', imp: 1,
    d: 'הדלקת נר בברכת ״להדליק נר של (שבת ושל) יום הכיפורים״, ובקהילות רבות גם ״שהחיינו״.',
    w: 'לפני השקיעה בערב יום הכיפורים.',
    t: {
      em: R('ykEm', 'Candle Lighting'),
      ash: R('ykAsh', 'Candle Lighting'),
      sef: R('ykSef', 'Candle Lighting'),
    },
  },
  {
    id: 'tefila-zaka', region: 'yk', title: 'תפילה זכה ומחילה', k: 'custom', imp: 1,
    d: 'תפילה אישית לפני כל נדרי, ובה מחילה לכל מי שפגע בנו. ״תפילה זכה״ חוברה בידי ר׳ אברהם דנציג (בעל ״חיי אדם״).',
    w: 'לפני כל נדרי.',
    v: 'בעדות המזרח אומרים ״ריבונו של עולם הריני מוחל וסולח״; באשכנז ובנוסח ספרד — ״תפילה זכה״.',
    t: {
      em: R('ykEm', 'Arvit/Prayer Before the Service'),
      sef: R('ykSef', 'Before Kol Nidrei', { start: 'תפלה זכה' }),
    },
  },
  {
    id: 'lecha-eli', region: 'yk', title: 'לך אלי תשוקתי', k: 'custom', imp: 1,
    d: 'פיוט של ר׳ אברהם אבן עזרא, שבו פותחות קהילות עדות המזרח את ליל יום הכיפורים.',
    w: 'בליל יום הכיפורים לפני כל נדרי.',
    t: { em: R('ykEm', 'Arvit/Lecha Eli Teshukati') },
  },
  {
    id: 'kol-nidrei', region: 'yk', title: 'כל נדרי', k: 'core', imp: 3,
    d: 'התרת נדרים בארמית, בפני ספרי תורה פתוחים ובעטיפת טלית, שלוש פעמים — ההתחלה הדרמטית של היום הקדוש.',
    w: 'בליל יום הכיפורים, לפני השקיעה.',
    v: 'נוסחו משתנה בין העדות — האם ההתרה חלה על השנה שעברה או על השנה הבאה (בעקבות רבנו תם).',
    t: {
      em: R('ykEm', 'Arvit/Kol Nidrei'),
      ash: R('ykAsh', 'Kol Nidrei'),
      sef: R('ykSef', 'Kol Nidrei'),
    },
  },
  {
    id: 'arvit-yk', region: 'yk', title: 'ערבית ליל הכיפורים', k: 'core', imp: 2,
    d: 'ברכו וקריאת שמע — וביום זה בלבד אומרים ״ברוך שם כבוד מלכותו לעולם ועד״ בקול רם, כמלאכי השרת.',
    w: 'בליל יום הכיפורים.',
    t: {
      em: [R('ykEm', 'Arvit/Barechu'), R('ykEm', 'Arvit/Shema and its Blessings')],
      ash: R('ykAsh', 'Maariv Service for Yom Kippur Eve/Borechu'),
      sef: R('ykSef', 'Maariv Service for Yom Kippur Eve/Barechu'),
    },
  },
  {
    id: 'amidah-yk', region: 'yk', title: 'עמידה של יום הכיפורים', k: 'core', imp: 3,
    d: 'עמידה בת שבע ברכות, ובברכה האמצעית ״ותתן לנו… את יום הכיפורים הזה למחילה ולסליחה ולכפרה״ ו״מחול לעוונותינו״. בסופה — וידוי.',
    w: 'חמש פעמים ביום: ערבית, שחרית, מוסף, מנחה ונעילה.',
    t: {
      em: R('ykEm', 'Arvit/Amidah'),
      ash: R('ykAsh', 'Maariv Service for Yom Kippur Eve/Amidah'),
      sef: R('ykSef', 'Maariv Service for Yom Kippur Eve/Amidah'),
    },
    rel: [['contains', 'vidui-yk'], ['related', 'neila', 'העמידה החמישית נאמרת בנעילה']],
  },
  {
    id: 'vidui-yk', region: 'yk', title: 'וידוי: אשמנו ועל חטא', k: 'core', imp: 3,
    d: 'הווידוי הקצר (״אשמנו, בגדנו״, על סדר אלף־בית) והווידוי הגדול (״על חטא שחטאנו לפניך״), בלשון רבים — כל הציבור ערבים זה לזה. מכים על הלב בכל חטא.',
    w: 'בסוף כל עמידה וכל חזרת הש״ץ של היום (בנעילה — בלי ״על חטא״), ובמנחה של ערב יום הכיפורים.',
    t: {
      em: R('ykEm', 'Arvit/Slichot', { start: '^אשמנו\\. בגדנו' }),
      ash: R('ykAsh', 'Maariv Service for Yom Kippur Eve/Yaaleh', { start: 'אשמנו', end: 'ועל מצות עשה|ועל מצוות עשה|ועל חטאים שאנו חיבים עליהם עולה', endInclusive: false }),
      sef: R('ykSef', 'Maariv Service for Yom Kippur Eve/Yaaleh', { start: 'אשמנו', count: 60 }),
    },
    rmb: R('rambamOrder', '3'),
    kav: R('shaarKavanot', 'Sermons on Yom Kippur', { count: 4 }),
    rel: [['related', 'tachanun', 'הווידוי של ימות החול']],
  },
  {
    id: 'selichot-yk', region: 'yk', title: 'סליחות וי״ג מידות', k: 'core', imp: 2,
    d: 'פיוטי סליחה וקריאת ״ויעבור ה׳ על פניו ויקרא: ה׳ ה׳ אל רחום וחנון…״ — שלוש עשרה מידות של רחמים, שוב ושוב לאורך היום.',
    w: 'בכל תפילות יום הכיפורים, אחר העמידה או בתוך החזרה.',
    t: {
      em: R('ykEm', 'Arvit/Slichot', { end: '^אשמנו\\. בגדנו' }),
      ash: R('ykAsh', 'Maariv Service for Yom Kippur Eve/Yaaleh', { end: 'אשמנו' }),
      sef: R('ykSef', 'Maariv Service for Yom Kippur Eve/Yaaleh', { end: 'אשמנו' }),
    },
  },
  {
    id: 'shir-hayichud', region: 'yk', title: 'שיר היחוד ושיר הכבוד', k: 'custom', imp: 1,
    d: 'פיוטי שבח ארוכים מימי הביניים באשכנז, המחולקים לשבעת ימי השבוע; בליל יום הכיפורים נוהגים לאומרם כולם.',
    w: 'בליל יום הכיפורים אחר ערבית.',
    t: {
      ash: R('ykAsh', 'Customs of Yom Kippur Night'),
      sef: R('ykSef', 'Customs of Yom Kippur Night/Shir HaYichud'),
    },
  },
  {
    id: 'shacharit-yk', region: 'yk', title: 'שחרית של יום הכיפורים', k: 'core', imp: 1,
    d: 'סדר השחר, פסוקי דזמרה וקריאת שמע של היום הקדוש, עם פיוטים ו״המלך״ בקול.',
    w: 'בבוקר יום הכיפורים.',
    t: {
      em: [R('ykEm', 'Shacharit/Pesukei Dezimrah'), R('ykEm', 'Shacharit/Shema and its Blessings')],
      ash: [R('ykAsh', 'The Morning Prayers/The King'), R('ykAsh', 'The Morning Prayers/Recitation of Shema')],
      sef: [R('ykSef', 'The Morning Prayers/The King'), R('ykSef', 'The Morning Prayers/Blessings of the Shema')],
    },
  },
  {
    id: 'chazara-yk', region: 'yk', title: 'חזרת הש״ץ ופיוטיה', k: 'core', imp: 2,
    d: 'שליח הציבור חוזר על העמידה בקול ומשבץ בה פיוטים, קדושה, סליחות ווידוי. זה לב התפילה בציבור ביום זה.',
    w: 'בשחרית, מוסף, מנחה ונעילה.',
    t: {
      em: R('ykEm', "Shacharit/Reader's Repetition"),
      ash: R('ykAsh', "The Morning Prayers/Reader's Repetition of the Amidah"),
      sef: R('ykSef', "The Morning Prayers/Reader's Repetition", { count: 120 }),
    },
  },
  {
    id: 'kriat-hatorah-yk', region: 'yk', title: 'קריאת התורה: אחרי מות', k: 'core', imp: 2,
    d: 'בשחרית קוראים את עבודת הכהן הגדול ביום הכיפורים (ויקרא טז) ומפטיר מפרשת פנחס, והפטרה מישעיהו: ״הלוא זה צום אבחרהו״.',
    w: 'בשחרית של יום הכיפורים.',
    t: {
      em: [R('ykEm', 'Shacharit/Opening of the Ark'), R('ykEm', 'Shacharit/Reading of the Torah'), R('ykEm', 'Shacharit/Haftarah')],
      ash: R('ykAsh', 'Reading of the Torah'),
      sef: R('ykSef', 'Reading of the Torah'),
    },
  },
  {
    id: 'yizkor', region: 'taaniot', title: 'יזכור והשכבה', k: 'custom', imp: 2,
    d: 'הזכרת נשמות קרובים שנפטרו, בהתחייבות לצדקה לעילוי נשמתם. בסיום — ״אל מלא רחמים״ ו״אב הרחמים״.',
    w: 'באשכנז ובנוסח ספרד — ביום הכיפורים ובימים האחרונים של הרגלים.',
    v: 'בעדות המזרח אין סדר ״יזכור״ בנוסח זה; נוהגים לומר ״השכבה״ ולהתנדב לעילוי נשמה, וכן ביום השנה.',
    t: {
      ash: R('ykAsh', 'Memorial Services'),
      sef: R('ykSef', 'Memorial Services'),
    },
    gen: R('yizkor', ''),
    rel: [['varies', 'hashkava', 'המקבילה הספרדית']],
  },
  {
    id: 'hineni', region: 'yk', title: 'הנני העני ממעש', k: 'custom', imp: 1,
    d: 'תפילתו האישית של שליח הציבור לפני מוסף — ״הנני העני ממעש, נרעש ונפחד״.',
    w: 'לפני מוסף של ראש השנה ויום הכיפורים.',
    t: {
      ash: R('ykAsh', 'Musaf for Yom Kippur/Hineni'),
      sef: R('ykSef', 'Musaf Service/Hineni'),
    },
  },
  {
    id: 'avoda', region: 'yk', title: 'סדר העבודה', k: 'core', imp: 3,
    d: 'פיוט המשחזר את עבודת הכהן הגדול בבית המקדש ביום הכיפורים: הווידויים, הגורלות, הכניסה לקודש הקודשים — ו״והכהנים והעם… כורעים ומשתחווים״. בסופו ״מה נהדר היה כהן גדול״.',
    w: 'במוסף של יום הכיפורים, בחזרת הש״ץ.',
    v: 'בעדות המזרח — ״אתה כוננת עולם מראש״ (המיוחס ליוסי בן יוסי); באשכנז — ״אמיץ כח״ (ר׳ משולם בר קלונימוס). רבים נוהגים לכרוע על הארץ ב״והכהנים״.',
    t: {
      em: R('ykEm', "Mussaf/Reader's Repetition", { start: 'סדר עבודה', end: 'ובכן כמו ששמעת', endInclusive: true }),
      ash: R('ykAsh', 'Musaf for Yom Kippur/The Avodah Service'),
      sef: R('ykSef', 'Musaf Service/The Avodah Service', { count: 120 }),
    },
  },
  {
    id: 'eleh-ezkera', region: 'yk', title: 'אלה אזכרה', k: 'custom', imp: 1,
    d: 'קינה על עשרת הרוגי מלכות — רבי עקיבא, רבי ישמעאל כהן גדול וחבריהם — שנהרגו בידי רומא.',
    w: 'ביום הכיפורים; מקומה בתפילה משתנה לפי המנהג.',
    t: { ash: R('ykAsh', 'Musaf for Yom Kippur/The Ten Martyrs') },
  },
  {
    id: 'mincha-yk', region: 'yk', title: 'מנחה וקריאת יונה', k: 'core', imp: 2,
    d: 'במנחה קוראים בתורה את פרשת העריות (ויקרא יח) ומפטירים בספר יונה — סיפור תשובתה של נינוה — ובפסוקי ״מי אל כמוך״.',
    w: 'אחר הצהריים ביום הכיפורים.',
    t: {
      em: R('ykEm', 'Mincha/Reading of the Torah'),
      ash: R('ykAsh', 'Mincha/Torah Reading for Mincha Service'),
      sef: [R('ykSef', 'Mincha Service/Torah Reading'), R('ykSef', 'Mincha Service/Haftarah')],
    },
  },
  {
    id: 'el-nora-alila', region: 'yk', title: 'אל נורא עלילה', k: 'custom', imp: 2,
    d: 'פיוטו של ר׳ משה אבן עזרא, שחוזר בו הפזמון ״המצא לנו מחילה בשעת הנעילה״.',
    w: 'בפתיחת תפילת נעילה.',
    v: 'פותח את הנעילה בעדות המזרח; בקהילות אשכנז רבות לא נאמר.',
    t: { em: R('ykEm', 'Neilah/El Nora Alilah') },
  },
  {
    id: 'neila', region: 'yk', title: 'נעילה', k: 'core', imp: 3,
    d: 'התפילה החמישית והאחרונה, ״בשעת נעילת שערים״. במקום ״כתבנו״ אומרים ״חתמנו״; וידוי קצר ו״אתה נותן יד לפושעים״. ארון הקודש פתוח, ורבים עומדים עד סופה.',
    w: 'לקראת שקיעת החמה בסוף יום הכיפורים.',
    t: {
      em: [R('ykEm', 'Neilah/Ashrei'), R('ykEm', "Neilah/Reader's Repetition")],
      ash: [R('ykAsh', 'Neilah; Concluding Service/Ashrei'), R('ykAsh', "Neilah; Concluding Service/Reader's Repetition of the Amidah")],
      sef: [R('ykSef', 'Neilah Service/Ashrei'), R('ykSef', "Neilah Service/Reader's Repetition")],
    },
    kav: R('shaarKavanot', 'Sermons on Yom Kippur', { from: 4, count: 4 }),
  },
  {
    id: 'neila-closing', region: 'yk', title: 'שמע ישראל ותקיעת שופר', k: 'core', imp: 3,
    d: 'סיום היום: ״שמע ישראל״ פעם אחת, ״ברוך שם כבוד מלכותו״ שלוש פעמים, ״ה׳ הוא האלוהים״ שבע פעמים — ותקיעת שופר אחת וקריאת ״לשנה הבאה בירושלים״.',
    w: 'בסוף נעילה, עם צאת הכוכבים.',
    t: {
      em: R('ykEm', 'Neilah/Slichot', { start: 'שמע ישראל', count: 2 }),
      sef: R('ykSef', 'Neilah Service/Avinu Malkenu', { start: 'שמע ישראל', count: 12 }),
      ash: R('ykAsh', 'Neilah; Concluding Service/Avinu Malkenu', { start: 'שמע ישראל', count: 12 }),
    },
  },
  {
    id: 'motzaei-yk', region: 'yk', title: 'מוצאי יום הכיפורים', k: 'core', imp: 1,
    d: 'ערבית של חול עם ״אתה חוננתנו״, הבדלה על היין ועל ״נר ששבת״ (בלי בשמים), ונוהגים לקדש את הלבנה ולהתחיל בבניית הסוכה.',
    w: 'במוצאי יום הכיפורים.',
    t: {
      em: R('ykEm', 'Motzei Yom Kippur'),
      ash: R('ykAsh', 'Motzei Yom Kippur'),
      sef: [R('ykSef', 'Maariv Service for Motzei Yom Kippur'), R('ykSef', 'Havdalah')],
    },
  },

  // ───────────────────────────── תעניות ואבל ─────────────────────────────
  {
    id: 'aneinu', region: 'taaniot', title: 'עננו', k: 'conditional', imp: 1,
    d: 'תוספת לעמידה בימי תענית: ״עננו ה׳ עננו ביום צום תעניתנו״.',
    w: 'בתענית ציבור — היחיד בברכת ״שומע תפילה״, ושליח הציבור כברכה בפני עצמה.',
    t: {
      em: R('em', 'Weekday Mincha/Amida', { start: 'עננו', count: 1 }),
      sef: R('sef', 'Weekday Mincha/Amidah', { start: 'עננו', count: 1 }),
      ash: R('ash', 'Weekday/Minchah/Amida/Response to Prayer'),
    },
    rel: [['adds', 'amidah', 'בברכת שומע תפילה']],
  },
  {
    id: 'selichot-taanit', region: 'taaniot', title: 'סליחות לתעניות', k: 'conditional', imp: 1,
    d: 'סליחות מיוחדות לכל צום: צום גדליה, עשרה בטבת, תענית אסתר, י״ז בתמוז.',
    w: 'בשחרית של ימי התענית.',
    t: {
      em: R('em', 'Fast Days and Mourning/Seventeenth of Tammuz'),
      ash: R('ash', 'Festivals/Selichot/Seventeen of Tamuz'),
      sef: R('sef', 'Fast Days/Selichot for 17 Tamuz'),
    },
  },
  {
    id: 'arvit-tisha', region: 'taaniot', title: 'ליל תשעה באב', k: 'core', imp: 2,
    d: 'יושבים על הארץ באור עמום; ערבית בקול נמוך, ופיוטי קינה — ״על נהרות בבל״, ״אוי כי ירד אש״.',
    w: 'בליל ט׳ באב.',
    t: {
      em: [R('tishaEm', "Tisha B'Av Night/Al Naharot Bavel"), R('tishaEm', "Tisha B'Av Night/Arvit")],
      ash: R('kinnot', "Kinot for Tisha B'Av Night", { count: 40 }),
    },
  },
  {
    id: 'eicha', region: 'taaniot', title: 'מגילת איכה', k: 'core', imp: 3,
    d: 'קריאת מגילת איכה בניגון הקינה — ״איכה ישבה בדד העיר רבתי עם״ — על חורבן ירושלים.',
    w: 'בליל ט׳ באב (ויש הקוראים שוב בבוקר).',
    t: { em: R('tishaEm', "Tisha B'Av Night/Megillat Eichah") },
  },
  {
    id: 'kinot', region: 'taaniot', title: 'קינות', k: 'core', imp: 2,
    d: 'פיוטי קינה על החורבנות ועל גזרות שבאו על ישראל לאורך הדורות — ״בצאתי ממצרים / בצאתי מירושלים״, ״אלי ציון״.',
    w: 'בבוקר ט׳ באב, עד חצות היום.',
    t: {
      em: R('tishaEm', "Tisha B'Av Day"),
      ash: R('kinnot', "Kinot for Tisha B'Av Day", { count: 120 }),
    },
  },
  {
    id: 'nachem', region: 'taaniot', title: 'נחם', k: 'conditional', imp: 1,
    d: 'תוספת לברכת ״בונה ירושלים״: ״נחם ה׳ אלוהינו את אבלי ציון ואת אבלי ירושלים״.',
    w: 'בט׳ באב — באשכנז במנחה בלבד; לפי השולחן ערוך בכל תפילות היום.',
    t: { ash: R('ash', 'Weekday/Minchah/Amida/Rebuilding Jerusalem') },
    rel: [['adds', 'amidah', 'בברכת בונה ירושלים']],
  },
  {
    id: 'kriah', region: 'taaniot', title: 'קריעה ודיין האמת', k: 'core', imp: 2,
    d: 'האבל קורע את בגדו בעמידה ומברך ״ברוך דיין האמת״ — קבלת הדין ברגע השבר.',
    w: 'על אחד משבעת הקרובים, בשעת הפטירה או לפני הקבורה.',
    t: { em: R('em', 'Fast Days and Mourning/Mourning', { count: 3 }) },
  },
  {
    id: 'tziduk-hadin', region: 'taaniot', title: 'צידוק הדין', k: 'core', imp: 1,
    d: 'פסוקי הצדקת הדין — ״הצור תמים פעלו״ / ״צדיק אתה ה׳״ — בשעת הקבורה.',
    w: 'בהלוויה.',
    t: { em: R('em', 'Fast Days and Mourning/Mourning', { from: 3, count: 5 }) },
  },
  {
    id: 'kaddish-yatom', region: 'taaniot', title: 'קדיש יתום', k: 'core', imp: 2,
    d: 'הקדיש שאומרים האבלים — לא תפילה על המת אלא קידוש השם מתוך האבל — בכל תפילה בציבור.',
    w: 'אחר הקבורה, בשבעה, כ־11 חודשים (ויש מנהגים שונים) ובכל יום שנה.',
    v: 'באשכנז אחר הקבורה אומרים ״קדיש דאתחדתא״ המיוחד.',
    t: {
      ash: [R('ash', "Kaddish/Mourner's Kaddish"), R('ash', 'Kaddish/Kaddish achar HaKevura')],
      chabad: R('chabad', "Shacharit/Mourner's Kaddish"),
      em: R('em', 'Weekday Shacharit/Song of the Day', { start: 'יתגדל', count: 1 }),
    },
    rel: [['varies', 'kaddish', 'אחת מצורות הקדיש']],
  },
  {
    id: 'birkat-avelim', region: 'taaniot', title: 'ברכת המזון לאבלים', k: 'conditional', imp: 1,
    d: 'זימון מיוחד בבית האבל — ״נברך מנחם אבלים״ — ותוספת ״נחם״ בברכת המזון.',
    w: 'בסעודות בבית האבל בימי השבעה.',
    t: { em: R('em', 'Fast Days and Mourning/Mourning', { start: 'ברכת המזון לאבלים', end: 'השכבה לאיש' }) },
  },
  {
    id: 'hashkava', region: 'taaniot', title: 'השכבה', k: 'custom', imp: 2,
    d: 'תפילת ״מנוחה נכונה״ לעילוי נשמת הנפטר, המקבילה הספרדית ל״אל מלא רחמים״. יש נוסח לאיש ונוסח לאישה.',
    w: 'בהלוויה, בשבעה, ביום השנה ובעליות לתורה.',
    t: { em: R('em', 'Fast Days and Mourning/Mourning', { start: 'השכבה לאיש' }) },
    rel: [['varies', 'yizkor', 'המקבילה האשכנזית']],
  },
  {
    id: 'mishnayot-avel', region: 'taaniot', title: 'לימוד משניות לעילוי נשמה', k: 'custom', imp: 1,
    d: 'לימוד משניות (״משנה״ באותיות ״נשמה״) לעילוי נשמת הנפטר, בשבעה וביום השנה.',
    w: 'בבית האבל ובאזכרה.',
    t: { chabad: R('chabad', 'Mishnayot for a Mourner') },
  },
  {
    id: 'maavar-yabbok', region: 'sod', title: 'מעבר יבק', k: 'optional', imp: 1,
    d: 'ספר תפילות ומנהגים קבליים ללוויית חולים ונוטים למות, לטהרה ולקבורה, מאת ר׳ אהרן ברכיה ממודנה (מנטובה, 1626).',
    w: 'סביב המוות והקבורה, לנוהגים על פיו (בעיקר חברות קדישא).',
    tags: ['kabbalah'],
    gen: R('maavarYabbok', 'Siftei Tzedek', { count: 20 }),
  },

  // ───────────────────────────── סוד ותיקונים ─────────────────────────────
  {
    id: 'tikkun-chatzot', region: 'sod', title: 'תיקון חצות', k: 'optional', imp: 2,
    d: 'קימה בחצות הלילה לאבל על החורבן ולתפילה לגאולה: ״תיקון רחל״ — קינות ווידוי — ו״תיקון לאה״ — מזמורי נחמה. נתקן בידי האר״י ותלמידיו בצפת.',
    w: 'בחצות הלילה; ״תיקון רחל״ אין אומרים בימים שאין בהם תחנון.',
    tags: ['kabbalah'],
    t: { em: [R('em', 'The Midnight Rite/Tikkun Rachel'), R('em', 'The Midnight Rite/Tikkun Leah')] },
    kav: R('shaarKavanot', 'Sermons on Midnight Reparations'),
  },
  {
    id: 'leshem-yichud', region: 'sod', title: 'לשם יחוד', k: 'custom', imp: 2,
    d: 'נוסח הכוונה שלפני מצוות ותפילות — ״לשם יחוד קודשא בריך הוא ושכינתיה״ — שהפיצו המקובלים. בסידור עדות המזרח הוא מופיע לפני מצוות רבות.',
    w: 'לפני מצוות ותפילות, לנוהגים.',
    v: 'נפוץ מאוד בעדות המזרח ובחסידות; ר׳ יחזקאל לנדא (״נודע ביהודה״) ואחרים התנגדו לאמירתו.',
    tags: ['kabbalah'],
    t: { em: R('em', 'The Midnight Rite/LeShem Yichud') },
    kav: R('shaarKavanot', 'Sermons on the Intentions of Blessings', { count: 4 }),
  },
  {
    id: 'petichat-eliyahu', region: 'sod', title: 'פתח אליהו', k: 'custom', imp: 1,
    d: 'פתיחת תיקוני הזוהר — ״פתח אליהו ואמר: ריבון עלמין דאנת הוא חד ולא בחושבן״ — הנאמרת בעדות המזרח לפני התפילה.',
    w: 'בפתיחת שחרית (ויש האומרים גם לפני מנחה בערב שבת).',
    tags: ['kabbalah'],
    t: { em: R('em', 'Weekday Shacharit/Petichat Eliyahu') },
  },
  {
    id: 'ana-bekoach', region: 'sod', title: 'אנא בכח', k: 'custom', imp: 2,
    d: 'תפילה בת שבע שורות של שש מילים, שראשי תיבותיהן מרכיבים את ״שם בן מ״ב אותיות״. מיוחסת לר׳ נחוניה בן הקנה.',
    w: 'בקבלת שבת, בפרשת הקרבנות, בספירת העומר ובקריאת שמע שעל המיטה.',
    tags: ['kabbalah'],
    t: {
      em: R('em', 'Weekday Shacharit/Incense Offering', { start: '^אנא בכח', count: 8 }),
      sef: R('sef', 'Kabbalat Shabbat', { start: '^אנא בכח', count: 1 }),
      ash: R('ash', 'Shabbat/Kabbalat Shabbat/Ana Bekoach'),
    },
  },
  {
    id: 'tikkun-leil-shavuot', region: 'sod', title: 'תיקון ליל שבועות', k: 'custom', imp: 1,
    d: 'לימוד כל הלילה בליל שבועות מתוך ״תיקון״ — קטעים מכל ספרי התנ״ך, המשנה והזוהר — מנהג שהתפשט מחוג ר׳ שלמה אלקבץ והאר״י. הטקסט אינו זמין כאן.',
    w: 'בליל שבועות.',
    tags: ['kabbalah'],
    kav: R('shaarKavanot', 'Sermons on the Festival of Shavuot', { count: 4 }),
  },
];
