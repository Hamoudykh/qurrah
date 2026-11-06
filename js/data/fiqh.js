// What to recite in salah — widely agreed points with sources; differences noted briefly.
// This is general information, NOT a fatwa. For rulings, ask a qualified scholar.

import { h } from './refs.js';

export const FIQH_NOTES = [
  {
    id: 'fatiha',
    title: { en: 'Al-Fatihah in every rak\'ah', ar: 'الفاتحة في كل ركعة', he: 'אל-פאתחה בכל רכעה' },
    body: { en: 'There is no prayer for the one who does not recite al-Fatihah.', ar: 'لا صلاة لمن لم يقرأ بفاتحة الكتاب.', he: 'אין תפילה למי שאינו קורא את אל-פאתחה.' },
    differ: { en: 'Scholars differ on whether the follower recites it behind an imam who recites aloud, and Hanafi scholars classify it as wajib rather than a pillar.', ar: 'اختلف العلماء في قراءة المأموم لها خلف الإمام في الجهرية، ويعدّها الحنفية واجبًا لا ركنًا.', he: 'החכמים חלוקים אם המתפלל מאחורי אימאם הקורא בקול קורא אותה, והחנפים מסווגים אותה כוואג׳ב ולא כעמוד יסוד.' },
    refs: [h('bukhari', '756'), h('muslim', '394')],
  },
  {
    id: 'surah',
    title: { en: 'A surah after al-Fatihah in the first two rak\'ahs', ar: 'سورة بعد الفاتحة في الركعتين الأوليين', he: 'סורה אחרי אל-פאתחה בשתי הרכעות הראשונות' },
    body: { en: 'The Prophet ﷺ recited al-Fatihah and a surah in each of the first two rak\'ahs of Dhuhr and \'Asr, and al-Fatihah alone in the last two. He made the first rak\'ah longer than the second.', ar: 'كان النبي ﷺ يقرأ في الركعتين الأوليين من الظهر والعصر بفاتحة الكتاب وسورة، وفي الأخريين بفاتحة الكتاب، ويطيل الأولى على الثانية.', he: 'הנביא ﷺ קרא את אל-פאתחה וסורה בכל אחת משתי הרכעות הראשונות של הצהריים והעסר, ואת אל-פאתחה בלבד בשתי האחרונות. הוא האריך את הרכעה הראשונה יותר מהשנייה.' },
    differ: { en: 'Most scholars consider the extra surah sunnah (recommended); Hanafi scholars consider it wajib in the first two rak\'ahs of obligatory prayers.', ar: 'جمهور العلماء على أن السورة بعد الفاتحة سنة، ويرى الحنفية وجوبها في الركعتين الأوليين من الفريضة.', he: 'רוב החכמים רואים בסורה הנוספת סונה (מומלץ); החנפים רואים בה חובה (ואג׳ב) בשתי הרכעות הראשונות של תפילות החובה.' },
    refs: [h('bukhari', '776')],
  },
  {
    id: 'length',
    title: { en: 'Longer in Fajr, usually shorter in Maghrib', ar: 'الإطالة في الفجر والتخفيف غالبًا في المغرب', he: 'ארוך יותר בפג׳ר, בדרך כלל קצר יותר במגריב' },
    body: { en: 'He ﷺ recited longer in Fajr than in Dhuhr and \'Asr. He recommended surahs like Al-A\'la, Ash-Shams and Al-Layl to an imam leading \'Isha. A report describes short surahs in Maghrib, medium in \'Isha and long in Fajr as his general practice.', ar: 'كان ﷺ يطيل القراءة في الفجر أكثر من الظهر والعصر، وأرشد إمامًا في العشاء إلى سور مثل الأعلى والشمس والليل. وفي رواية أن عادته الغالبة: قصار المفصل في المغرب، وأوساطه في العشاء، وطواله في الصبح.', he: 'הוא ﷺ האריך בקריאה בפג׳ר יותר מאשר בצהריים ובעסר. הוא המליץ לאימאם המוביל את העישאא על סורות כמו אל-אעלא, א-שמס ואל-לייל. מסורת מתארת סורות קצרות במגריב, בינוניות בעישאא וארוכות בפג׳ר כמנהגו הכללי.' },
    differ: { en: 'This is a general pattern, not a rule: he ﷺ also recited long surahs in Maghrib at times, such as At-Tur.', ar: 'هذه عادة غالبة لا قاعدة لازمة؛ فقد قرأ ﷺ أحيانًا في المغرب بسور طويلة كالطور.', he: 'זהו דפוס כללי, לא כלל: לעיתים הוא ﷺ קרא סורות ארוכות גם במגריב, כמו א-טור.' },
    refs: [h('muslim', '459'), h('bukhari', '705'), h('nasai', '982', 'differed', { en: 'grading and numbering: see TO-VERIFY', ar: 'التصحيح والترقيم: انظر قائمة التحقق', he: 'דירוג ומספור: ראה רשימת האימות' }), h('bukhari', '765')],
  },
  {
    id: 'order',
    title: { en: 'Keeping mushaf order', ar: 'الترتيب على ترتيب المصحف', he: 'שמירה על סדר המֻצְחַף' },
    body: { en: 'Many scholars prefer reciting in the order of the mushaf (an earlier surah in the first rak\'ah). Reversing the order is still valid: in a night prayer, the Prophet ﷺ recited Al-Baqarah, then An-Nisa\', then Al \'Imran.', ar: 'استحب كثير من العلماء القراءة على ترتيب المصحف، والتنكيس جائز؛ فقد قرأ النبي ﷺ في صلاة الليل البقرة ثم النساء ثم آل عمران.', he: 'חכמים רבים מעדיפים לקרוא לפי סדר המוצחף (סורה מוקדמת יותר ברכעה הראשונה). היפוך הסדר עדיין תקף: בתפילת לילה קרא הנביא ﷺ את אל-בקרה, אחר כך אן-ניסאא, ואחר כך אאל עמראן.' },
    differ: { en: 'Some scholars consider reversing the order disliked (makruh) without making the prayer invalid.', ar: 'كره بعض العلماء التنكيس مع صحة الصلاة.', he: 'יש חכמים הרואים בהיפוך הסדר דבר לא רצוי (מכרוה) מבלי שהתפילה תיפסל.' },
    refs: [h('muslim', '772')],
  },
  {
    id: 'repeat',
    title: { en: 'Repeating the same surah', ar: 'تكرار السورة نفسها', he: 'חזרה על אותה סורה' },
    body: { en: 'A man heard the Prophet ﷺ recite Az-Zalzalah in both rak\'ahs of Fajr. Repeating a surah is permissible, though variety helps presence.', ar: 'سمع رجل النبي ﷺ يقرأ الزلزلة في الركعتين كلتيهما من الفجر، فتكرار السورة جائز، والتنويع أعون على الحضور.', he: 'אדם שמע את הנביא ﷺ קורא את א-זלזלה בשתי רכעות הפג׳ר. מותר לחזור על סורה, אף שגיוון מסייע לנוכחות.' },
    refs: [h('abudawud', '816', 'hasan')],
  },
  {
    id: 'passages',
    title: { en: 'Reciting a passage from within a surah', ar: 'القراءة من أثناء السورة', he: 'קריאת קטע מתוך סורה' },
    body: { en: 'Reciting ayahs from the middle of a surah is valid: in the two sunnah rak\'ahs of Fajr, the Prophet ﷺ sometimes recited an ayah from Al-Baqarah and one from Al \'Imran.', ar: 'تجوز القراءة من أثناء السورة؛ فقد قرأ النبي ﷺ أحيانًا في ركعتي الفجر بآية من البقرة وآية من آل عمران.', he: 'מותר לקרוא פסוקים מאמצע סורה: בשתי רכעות הסונה של הפג׳ר קרא הנביא ﷺ לעיתים פסוק מאל-בקרה ופסוק מאאל עמראן.' },
    refs: [h('muslim', '727')],
  },
  {
    id: 'sunnah',
    title: { en: 'Sunnah prayers with specific surahs', ar: 'سنن ورد فيها سور معينة', he: 'תפילות סונה עם סורות מסוימות' },
    body: { en: 'Two rak\'ahs before Fajr: Al-Kafirun and Al-Ikhlas. Witr: Al-A\'la, Al-Kafirun, Al-Ikhlas. Fajr on Friday: As-Sajdah and Al-Insan. Jumu\'ah and Eid: Al-A\'la and Al-Ghashiyah (or Al-Jumu\'ah and Al-Munafiqun for Jumu\'ah).', ar: 'ركعتا الفجر: الكافرون والإخلاص. الوتر: الأعلى والكافرون والإخلاص. فجر الجمعة: السجدة والإنسان. الجمعة والعيدان: الأعلى والغاشية (أو الجمعة والمنافقون في الجمعة).', he: 'שתי רכעות לפני הפג׳ר: אל-כאפירון ואל-אח׳לאס. ויתר: אל-אעלא, אל-כאפירון, אל-אח׳לאס. פג׳ר של יום שישי: א-סג׳דה ואל-אנסאן. תפילת יום שישי והחגים: אל-אעלא ואל-ע׳אשיה (או אל-ג׳ומועה ואל-מונאפיקון ביום שישי).' },
    refs: [h('muslim', '726'), h('abudawud', '1423', 'sahih'), h('bukhari', '891'), h('muslim', '880'), h('muslim', '878'), h('muslim', '877')],
  },
  {
    id: 'learning',
    title: { en: 'While you are still learning a surah', ar: 'أثناء حفظك لسورة جديدة', he: 'בזמן שאתה עדיין לומד סורה' },
    body: { en: 'The one who recites with difficulty has two rewards — so keep going. Practical tip (not a ruling): recite a new surah in voluntary prayers first, and use it in obligatory prayers once you can recite it without hesitation.', ar: 'الذي يقرأ القرآن ويتتعتع فيه وهو عليه شاق له أجران، فاستمر. نصيحة عملية (لا حكم شرعي): اقرأ السورة الجديدة في النوافل أولًا، ثم في الفرائض بعد أن تتقنها.', he: 'מי שקורא בקושי — לו שני שכרים, אז המשך. עצה מעשית (לא פסיקה): קרא סורה חדשה קודם בתפילות רשות, והשתמש בה בתפילות חובה כשתוכל לקרוא אותה בלי היסוס.' },
    refs: [h('muslim', '798')],
  },
];

export const FIQH_DISCLAIMER = {
  en: 'This is general guidance based on widely agreed points, with differences noted briefly. It is not a fatwa. For rulings that apply to you, ask a qualified scholar.',
  ar: 'هذه إرشادات عامة مبنية على مسائل مشهورة متفق عليها غالبًا، مع إشارة موجزة إلى الخلاف، وليست فتوى. اسأل أهل العلم فيما يخصك.',
  he: 'זוהי הנחיה כללית המבוססת על נקודות מוסכמות ברובן, עם ציון קצר של מחלוקות. אין זו פסיקה (פתווא). לפסיקות הנוגעות לך, שאל חכם מוסמך.',
};
