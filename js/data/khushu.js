// Practical khushu' (presence and humility in prayer) tips, each with its source.
// Text is a summary of meaning, not quoted wording. Not a fatwa.

import { h, q } from './refs.js';

export const KHUSHU_TIPS = [
  {
    id: 'prepare',
    title: { en: 'Prepare before you stand', ar: 'استعد قبل أن تقوم', he: 'התכונן לפני שאתה עומד' },
    body: {
      en: 'The Prophet ﷺ described making wudu carefully and then praying two rak\'ahs without letting the mind wander, and said the previous sins of such a person are forgiven. Presence starts before the takbir.',
      ar: 'وصف النبي ﷺ من توضأ فأحسن الوضوء ثم صلى ركعتين لا يحدّث فيهما نفسه بأنه يُغفر له ما تقدم من ذنبه. فالحضور يبدأ قبل التكبير.',
      he: 'הנביא ﷺ תיאר מי שמבצע את הוודוא בקפידה ואז מתפלל שתי רכעות בלי לתת למחשבה לנדוד, ואמר שחטאיו הקודמים נסלחים. הנוכחות מתחילה לפני התכביר.',
    },
    practice: { en: 'Make wudu slowly, then sit for one quiet minute before you pray.', ar: 'توضأ على مهل، ثم اجلس دقيقة هادئة قبل الصلاة.', he: 'בצע וודוא לאט, ושב דקה אחת בשקט לפני התפילה.' },
    refs: [h('bukhari', '159'), h('muslim', '226')],
  },
  {
    id: 'distractions',
    title: { en: 'Remove what distracts you', ar: 'أزل ما يشغلك', he: 'הסר את מה שמסיח את דעתך' },
    body: {
      en: 'There is no (complete) prayer when food has been served, or while holding back the call of nature. The Prophet ﷺ also returned a patterned garment, saying it had distracted him in prayer.',
      ar: 'لا صلاة بحضرة طعام ولا وهو يدافعه الأخبثان. وردّ النبي ﷺ خميصة ذات أعلام وقال إنها ألهته عن صلاته.',
      he: 'אין תפילה (שלמה) כשהאוכל כבר הוגש, או כשמתאפקים מצרכי הגוף. הנביא ﷺ גם החזיר בגד מעוטר ואמר שהסיח את דעתו בתפילה.',
    },
    practice: { en: 'Silence your phone, eat first if food is ready, and pray facing a plain wall.', ar: 'أسكت هاتفك، وكُل أولًا إن حضر الطعام، وصلِّ أمام جدار خالٍ من الزخارف.', he: 'השתק את הטלפון, אכול קודם אם האוכל מוכן, והתפלל מול קיר פשוט.' },
    refs: [h('muslim', '560'), h('bukhari', '373'), h('muslim', '556')],
  },
  {
    id: 'calm',
    title: { en: 'Walk to prayer calmly', ar: 'امشِ إلى الصلاة بسكينة', he: 'לך לתפילה ברוגע' },
    body: {
      en: 'When the iqamah is called, come walking with tranquillity and dignity, not rushing; pray what you catch and complete what you missed.',
      ar: 'إذا أقيمت الصلاة فأتوها تمشون وعليكم السكينة والوقار ولا تسرعوا، فما أدركتم فصلوا وما فاتكم فأتموا.',
      he: 'כשנקראת האקאמה, בואו בהליכה ברוגע ובכבוד, בלי למהר; התפללו את מה שהשגתם והשלימו את מה שהחמצתם.',
    },
    practice: { en: 'Leave a few minutes early so you arrive unhurried.', ar: 'اخرج مبكرًا بدقائق لتصل دون عجلة.', he: 'צא כמה דקות מוקדם כדי להגיע בלי לחץ.' },
    refs: [h('bukhari', '636'), h('muslim', '602')],
  },
  {
    id: 'ihsan',
    title: { en: 'Pray as though you see Him', ar: 'صلِّ كأنك تراه', he: 'התפלל כאילו אתה רואה אותו' },
    body: {
      en: 'Ihsan is to worship Allah as though you see Him — and if you do not see Him, He surely sees you.',
      ar: 'الإحسان أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك.',
      he: 'אִחְסָאן הוא לעבוד את אללה כאילו אתה רואה אותו — ואם אינך רואה אותו, הוא בוודאי רואה אותך.',
    },
    practice: { en: 'Before the takbir, pause and remind yourself: Allah sees me now.', ar: 'قبل التكبير توقف وذكّر نفسك: الله يراني الآن.', he: 'לפני התכביר, עצור והזכר לעצמך: אללה רואה אותי עכשיו.' },
    refs: [h('bukhari', '50'), h('muslim', '8')],
  },
  {
    id: 'farewell',
    title: { en: 'Pray a farewell prayer', ar: 'صلِّ صلاة مودِّع', he: 'התפלל תפילת פרידה' },
    body: {
      en: 'The Prophet ﷺ advised: when you stand for prayer, pray as one who is bidding farewell.',
      ar: 'أوصى النبي ﷺ: إذا قمت في صلاتك فصلِّ صلاة مودِّع.',
      he: 'הנביא ﷺ יעץ: כשאתה עומד לתפילה, התפלל כמי שנפרד.',
    },
    practice: { en: 'Pray your next prayer as if it could be your last.', ar: 'صلِّ صلاتك القادمة كأنها آخر صلاة لك.', he: 'התפלל את התפילה הבאה כאילו היא עשויה להיות האחרונה.' },
    refs: [h('ibnmajah', '4171', 'hasan')],
  },
  {
    id: 'understand',
    title: { en: 'Understand what you recite', ar: 'افهم ما تقرأ', he: 'הבן את מה שאתה קורא' },
    body: {
      en: 'The Quran was sent down so that its ayahs would be reflected upon (38:29). In al-Fatihah, Allah responds to each ayah you recite (hadith qudsi) — knowing the meaning turns recitation into conversation.',
      ar: 'أُنزل القرآن ليُتدبر (ص: 29). وفي الفاتحة يجيب الله العبد عند كل آية (حديث قدسي)، ومعرفة المعنى تجعل التلاوة مناجاة.',
      he: 'הקוראן הורד כדי שיתבוננו בפסוקיו (38:29). באל-פאתחה אללה עונה על כל פסוק שאתה קורא (חדית׳ קודסי) — הבנת המשמעות הופכת את הקריאה לשיחה.',
    },
    practice: { en: 'Before each prayer, read the meaning of the surahs your planner suggests.', ar: 'قبل كل صلاة اقرأ معنى السور التي يقترحها المخطط.', he: 'לפני כל תפילה, קרא את משמעות הסורות שהמתכנן מציע.' },
    refs: [q('38:29'), q('47:24'), h('muslim', '395')],
    link: '#/pray',
  },
  {
    id: 'tartil',
    title: { en: 'Recite slowly, pausing at each ayah', ar: 'رتّل وقف عند كل آية', he: 'קרא לאט, ועצור בכל פסוק' },
    body: {
      en: 'Allah commands measured recitation (tartil, 73:4). Umm Salamah described the Prophet ﷺ reciting al-Fatihah ayah by ayah, stopping at the end of each.',
      ar: 'أمر الله بترتيل القرآن (المزمل: 4). ووصفت أم سلمة قراءة النبي ﷺ للفاتحة آيةً آية يقف عند رأس كل آية.',
      he: 'אללה מצווה על קריאה מדודה (תרתיל, 73:4). אום סלמה תיארה את הנביא ﷺ קורא את אל-פאתחה פסוק אחר פסוק, ועוצר בסוף כל אחד.',
    },
    note: { en: 'Al-Albani graded the Umm Salamah narration sahih; some scholars consider its chain weak.', ar: 'صحح الألباني حديث أم سلمة، وضعف بعض العلماء إسناده.', he: 'אל-אלבאני דירג את המסורת של אום סלמה צחיח; יש חכמים הרואים את שרשרתה חלשה.' },
    practice: { en: 'In al-Fatihah, pause after each ayah and remember that Allah is answering you.', ar: 'في الفاتحة توقف بعد كل آية واستحضر أن الله يجيبك.', he: 'באל-פאתחה עצור אחרי כל פסוק וזכור שאללה עונה לך.' },
    refs: [q('73:4'), h('abudawud', '4001', 'differed'), h('tirmidhi', '2927', 'differed')],
  },
  {
    id: 'respond',
    title: { en: 'Respond to what you recite', ar: 'تفاعل مع ما تقرأ', he: 'הגב למה שאתה קורא' },
    body: {
      en: 'In his night prayer, when the Prophet ﷺ passed an ayah of glorification he glorified Allah, an ayah of asking he asked, and an ayah of seeking refuge he sought refuge.',
      ar: 'كان النبي ﷺ في صلاة الليل إذا مر بآية فيها تسبيح سبّح، وإذا مر بسؤال سأل، وإذا مر بتعوذ تعوذ.',
      he: 'בתפילת הלילה, כשהנביא ﷺ עבר על פסוק של שבח — שיבח, על פסוק של בקשה — ביקש, ועל פסוק של בקשת מקלט — ביקש מקלט.',
    },
    note: { en: 'This was in voluntary night prayer; scholars differ on doing it in obligatory prayers.', ar: 'كان ذلك في صلاة الليل النافلة، واختلف العلماء في فعله في الفريضة.', he: 'זה היה בתפילת לילה רשות; החכמים חלוקים לגבי עשייתו בתפילות חובה.' },
    practice: { en: 'In a voluntary prayer, pause to ask Allah at an ayah of mercy.', ar: 'في صلاة نافلة توقف عند آية رحمة واسأل الله من فضله.', he: 'בתפילת רשות, עצור ובקש מאללה בפסוק של רחמים.' },
    refs: [h('muslim', '772')],
  },
  {
    id: 'stillness',
    title: { en: 'Be still in every position', ar: 'اطمئن في كل ركن', he: 'היה רגוע בכל תנוחה' },
    body: {
      en: 'The Prophet ﷺ told a man who prayed hastily to go back and pray, "for you have not prayed", and taught him to settle calmly in ruku\', standing, sujud and sitting (tuma\'ninah).',
      ar: 'قال النبي ﷺ للمسيء صلاته: ارجع فصلِّ فإنك لم تصلِّ، وعلّمه الطمأنينة في الركوع والرفع والسجود والجلوس.',
      he: 'הנביא ﷺ אמר לאדם שהתפלל בחיפזון לחזור ולהתפלל, "כי לא התפללת", ולימד אותו להירגע במלואו בכריעה, בעמידה, בהשתחוויה ובישיבה (טומאנינה).',
    },
    practice: { en: 'Stay in ruku\' and sujud until you have said the dhikr slowly, without rushing.', ar: 'ابقَ في الركوع والسجود حتى تقول الذكر بتأنٍّ دون عجلة.', he: 'הישאר בכריעה ובהשתחוויה עד שאמרת את הזִכְר לאט, בלי למהר.' },
    refs: [h('bukhari', '757'), h('muslim', '397')],
  },
  {
    id: 'gaze',
    title: { en: 'Guard your gaze', ar: 'احفظ بصرك', he: 'שמור על המבט' },
    body: {
      en: 'The Prophet ﷺ warned against raising the eyes to the sky in prayer, and described looking around in prayer as something Shaytan snatches from it.',
      ar: 'نهى النبي ﷺ عن رفع البصر إلى السماء في الصلاة، ووصف الالتفات فيها بأنه اختلاس يختلسه الشيطان من صلاة العبد.',
      he: 'הנביא ﷺ הזהיר מפני הרמת העיניים לשמים בתפילה, ותיאר הסתכלות לצדדים בתפילה כדבר שהשטן חוטף ממנה.',
    },
    note: { en: 'Many scholars recommend looking at the place of prostration; there are other views on where to look.', ar: 'استحب كثير من العلماء النظر إلى موضع السجود، وللعلماء أقوال أخرى.', he: 'חכמים רבים ממליצים להביט במקום ההשתחוויה; יש דעות נוספות.' },
    practice: { en: 'Keep your eyes lowered to the place of sujud.', ar: 'اجعل بصرك إلى موضع سجودك.', he: 'השפל את עיניך אל מקום ההשתחוויה.' },
    refs: [h('bukhari', '750'), h('bukhari', '751')],
  },
  {
    id: 'sujud-meaning',
    title: { en: 'Think about the meaning in sujud', ar: 'تأمل المعنى في السجود', he: 'חשוב על המשמעות בהשתחוויה' },
    body: {
      en: 'In sujud the Prophet ﷺ said "Subhana rabbiya al-a\'la" — Glory be to my Lord, the Most High. You place the highest part of your body on the ground before the Most High.',
      ar: 'كان النبي ﷺ يقول في سجوده: سبحان ربي الأعلى. فأنت تضع أعلى ما فيك على الأرض للعليّ الأعلى.',
      he: 'בהשתחוויה אמר הנביא ﷺ "סובחאן רבייא אל-אעלא" — שבח לאדוני, הנעלה מכל. אתה מניח את החלק הגבוה ביותר בגופך על הקרקע לפני הנעלה מכל.',
    },
    practice: { en: 'Say the tasbih of sujud slowly and think about each word.', ar: 'قل تسبيح السجود ببطء وتأمل كل كلمة.', he: 'אמור את שבח ההשתחוויה לאט וחשוב על כל מילה.' },
    refs: [h('muslim', '772'), q('96:19')],
  },
  {
    id: 'sujud-dua',
    title: { en: 'Make du\'a in sujud', ar: 'ادعُ في السجود', he: 'התפלל (דועא) בהשתחוויה' },
    body: {
      en: 'The closest a servant is to his Lord is while in prostration, so increase your supplication. In sujud, strive in du\'a, for it is more likely to be answered.',
      ar: 'أقرب ما يكون العبد من ربه وهو ساجد، فأكثروا الدعاء. وأما السجود فاجتهدوا فيه في الدعاء فقمِنٌ أن يستجاب لكم.',
      he: 'העבד קרוב ביותר לאדונו כשהוא משתחווה, לכן הרבו בתפילה. בהשתחוויה השקיעו בדועא, כי סביר יותר שתיענה.',
    },
    note: { en: 'Scholars differ on du\'a in sujud in a language other than Arabic during obligatory prayers; many allow it in voluntary prayers. Ask a qualified scholar for your case.', ar: 'اختلف العلماء في الدعاء بغير العربية في سجود الفريضة، وأجازه كثير منهم في النافلة. اسأل أهل العلم عن حالك.', he: 'החכמים חלוקים לגבי דועא בהשתחוויה בשפה שאינה ערבית בתפילות חובה; רבים מתירים זאת בתפילות רשות. שאל חכם מוסמך לגבי מקרך.' },
    practice: { en: 'Prepare one personal du\'a before the prayer so you are ready in sujud.', ar: 'جهّز دعاءً خاصًا قبل الصلاة لتكون مستعدًا في السجود.', he: 'הכן דועא אישית אחת לפני התפילה כדי שתהיה מוכן בהשתחוויה.' },
    refs: [h('muslim', '482'), h('muslim', '479')],
  },
  {
    id: 'refuge',
    title: { en: 'When your mind wanders', ar: 'إذا شرد ذهنك', he: 'כשהמחשבה נודדת' },
    body: {
      en: '\'Uthman ibn Abi al-\'As complained that Shaytan confused his prayer and recitation. The Prophet ﷺ told him to seek refuge in Allah from him and to spit lightly to his left three times; he did, and it left him.',
      ar: 'شكا عثمان بن أبي العاص أن الشيطان يلبّس عليه صلاته وقراءته، فأمره النبي ﷺ أن يتعوذ بالله منه ويتفل عن يساره ثلاثًا، ففعل فأذهبه الله عنه.',
      he: 'עות׳מאן בן אבי אל-עאס התלונן שהשטן מבלבל את תפילתו וקריאתו. הנביא ﷺ אמר לו לבקש מקלט באללה מפניו ולירוק קלות לשמאלו שלוש פעמים; הוא עשה זאת, וזה עזב אותו.',
    },
    practice: { en: 'When distracted, gently return to the meaning of what you are saying — no frustration.', ar: 'إذا شردت فعُد بلطف إلى معنى ما تقول، دون ضيق.', he: 'כשדעתך מוסחת, חזור בעדינות למשמעות של מה שאתה אומר — בלי תסכול.' },
    refs: [h('muslim', '2203')],
  },
  {
    id: 'vary',
    title: { en: 'Vary what you recite', ar: 'نوّع ما تقرأ', he: 'גוון את מה שאתה קורא' },
    body: {
      en: 'The Prophet ﷺ recited different surahs in different prayers (e.g. Al-Layl in Dhuhr, At-Tin in \'Isha, Al-A\'la and Al-Ghashiyah on Fridays). New words keep the heart awake.',
      ar: 'كان النبي ﷺ ينوّع القراءة في الصلوات (كسورة الليل في الظهر، والتين في العشاء، والأعلى والغاشية في الجمعة). والكلمات الجديدة توقظ القلب.',
      he: 'הנביא ﷺ קרא סורות שונות בתפילות שונות (למשל אל-לייל בצהריים, א-תין בעישאא, אל-אעלא ואל-ע׳אשיה בימי שישי). מילים חדשות שומרות על הלב ער.',
    },
    practice: { en: 'Use the planner so each prayer brings a different surah.', ar: 'استعمل المخطط لتكون لكل صلاة سورة مختلفة.', he: 'השתמש במתכנן כך שכל תפילה תביא סורה אחרת.' },
    refs: [h('muslim', '459'), h('bukhari', '769'), h('muslim', '878')],
    link: '#/pray',
  },
];

// 60-second "before you pray" checklist (items link back to the tips above).
export const CHECKLIST = [
  { id: 'wudu', tip: 'prepare', text: { en: 'Wudu done calmly', ar: 'توضأت بهدوء', he: 'ביצעתי וודוא ברוגע' } },
  { id: 'phone', tip: 'distractions', text: { en: 'Phone silenced, distractions away', ar: 'أسكتُّ الهاتف وأبعدت المشغلات', he: 'הטלפון מושתק, הסחות הדעת הורחקו' } },
  { id: 'plan', tip: 'vary', text: { en: 'I know which surahs I will recite', ar: 'أعرف السور التي سأقرؤها', he: 'אני יודע אילו סורות אקרא' } },
  { id: 'meaning', tip: 'understand', text: { en: 'I read their meaning once', ar: 'قرأت معناها مرة', he: 'קראתי את משמעותן פעם אחת' } },
  { id: 'sees', tip: 'ihsan', text: { en: 'Allah sees me; this may be my farewell prayer', ar: 'الله يراني، وقد تكون هذه صلاتي الأخيرة', he: 'אללה רואה אותי; ייתכן שזו תפילת הפרידה שלי' } },
  { id: 'dua', tip: 'sujud-dua', text: { en: 'One du\'a ready for sujud', ar: 'دعاء جاهز للسجود', he: 'דועא אחת מוכנה להשתחוויה' } },
];
