// "Why it matters" — background and virtues, ONLY from cited sources.
// Each point is a SUMMARY OF MEANING (not the hadith's exact wording); open the link to read
// the narration itself. Where no authentic, widely cited virtue specific to a surah is known,
// the entry says so rather than inventing one. Items needing checking are in docs/TO-VERIFY.md.

import { h, q, book } from './refs.js';

const none = {
  en: 'No authentic hadith specific to the virtue of this surah is widely cited. Its value is in understanding it and living by it; read its meaning above. The general virtues of reciting the Quran below apply.',
  ar: 'لا يُعرف حديث صحيح مشهور في فضل هذه السورة خاصة. وقيمتها في فهمها والعمل بها؛ اقرأ معناها أعلاه. وتنطبق عليها فضائل تلاوة القرآن العامة أدناه.',
  he: 'לא מצוטט באופן רחב חדית׳ אמין על מעלתה המיוחדת של סורה זו. ערכה בהבנתה ובחיים לפיה; קרא את משמעותה למעלה. מעלות קריאת הקוראן הכלליות שלמטה חלות גם עליה.',
};

export const GENERAL_VIRTUES = [
  {
    text: {
      en: 'Each letter you recite from the Book of Allah earns a good deed, and a good deed is multiplied by ten.',
      ar: 'لكل حرف تقرؤه من كتاب الله حسنة، والحسنة بعشر أمثالها.',
      he: 'על כל אות שאתה קורא מספר אללה מקבלים מעשה טוב, ומעשה טוב מוכפל פי עשרה.',
    },
    refs: [h('tirmidhi', '2910', 'sahih', { en: 'Tirmidhi: hasan sahih', ar: 'قال الترمذي: حسن صحيح', he: 'א-תירמד׳י: חסן צחיח' })],
  },
  {
    text: {
      en: 'The one skilled in the Quran is with the noble, righteous scribes, and the one who recites it with difficulty, stumbling over it, has two rewards. Struggling while you learn is rewarded.',
      ar: 'الماهر بالقرآن مع السفرة الكرام البررة، والذي يقرؤه ويتتعتع فيه وهو عليه شاق له أجران. فمشقة التعلم مأجورة.',
      he: 'המיומן בקוראן נמצא עם הסופרים הנכבדים והישרים, ומי שקורא אותו בקושי ומגמגם בו — לו שני שכרים. המאמץ בזמן הלימוד מתוגמל.',
    },
    refs: [h('bukhari', '4937'), h('muslim', '798')],
  },
];

export const VIRTUES = {
  s1: [
    {
      text: { en: 'The Prophet ﷺ called it the greatest surah in the Quran: the "seven oft-repeated" ayahs and the great Quran given to him.', ar: 'وصفها النبي ﷺ بأنها أعظم سورة في القرآن، وهي السبع المثاني والقرآن العظيم الذي أوتيه.', he: 'הנביא ﷺ כינה אותה הסורה הגדולה ביותר בקוראן: "שבעת הפסוקים החוזרים" והקוראן הגדול שניתן לו.' },
      refs: [h('bukhari', '4474')],
    },
    {
      text: { en: 'There is no prayer for the one who does not recite it.', ar: 'لا صلاة لمن لم يقرأ بها.', he: 'אין תפילה למי שאינו קורא אותה.' },
      refs: [h('bukhari', '756'), h('muslim', '394')],
      note: { en: 'Scholars differ about the follower praying behind an imam who recites aloud.', ar: 'اختلف العلماء في قراءة المأموم لها خلف الإمام في الجهرية.', he: 'החכמים חלוקים לגבי המתפלל מאחורי אימאם הקורא בקול.' },
    },
    {
      text: { en: 'In a hadith qudsi, Allah says He has divided the prayer between Himself and His servant: as you recite each ayah of al-Fatihah, He responds, e.g. "My servant has praised Me." Pause and feel this conversation.', ar: 'في الحديث القدسي: قسم الله الصلاة بينه وبين عبده نصفين، فإذا قرأ العبد آيات الفاتحة أجابه الله، كقوله: حمدني عبدي. فتوقّف واستشعر هذه المناجاة.', he: 'בחדית׳ קודסי אללה אומר שחילק את התפילה בינו לבין עבדו: כשאתה קורא כל פסוק של אל-פאתחה הוא עונה, למשל "עבדי שיבח אותי". עצור והרגש את השיחה הזו.' },
      refs: [h('muslim', '395')],
    },
    {
      text: { en: 'An angel told the Prophet ﷺ of two lights given to him that no prophet before was given: al-Fatihah and the closing ayahs of al-Baqarah.', ar: 'بشّر ملكٌ النبيَّ ﷺ بنورين أوتيهما لم يؤتهما نبي قبله: فاتحة الكتاب وخواتيم سورة البقرة.', he: 'מלאך בישר לנביא ﷺ על שני אורות שניתנו לו ולא ניתנו לשום נביא לפניו: אל-פאתחה וסוף סורת אל-בקרה.' },
      refs: [h('muslim', '806')],
    },
  ],

  s108: [
    {
      text: { en: 'Revealed while the Prophet ﷺ sat with his companions; he smiled, recited it, and explained al-Kawthar as a river his Lord promised him, with abundant good.', ar: 'نزلت والنبي ﷺ بين أصحابه، فتبسم وقرأها، وبيّن أن الكوثر نهر وعده ربه، عليه خير كثير.', he: 'נגלתה כשהנביא ﷺ ישב עם חבריו; הוא חייך, קרא אותה והסביר שאל-כות׳ר הוא נהר שאדונו הבטיח לו, ובו טוב רב.' },
      refs: [h('muslim', '400')],
    },
  ],

  s103: [
    {
      text: { en: 'Imam ash-Shafi\'i is reported to have said that if people reflected on this surah alone, it would be enough for them.', ar: 'يُروى عن الإمام الشافعي أنه قال: لو تدبر الناس هذه السورة لكفتهم.', he: 'מסופר שהאימאם א-שאפעי אמר שאילו התבוננו בני האדם בסורה זו בלבד, היה בה די להם.' },
      refs: [book({ en: "Tafsir Ibn Kathir, introduction to Surat al-'Asr", ar: 'تفسير ابن كثير، مقدمة سورة العصر', he: "תפסיר אבן כת׳יר, מבוא לסורת אל-עסר" }, 'scholar')],
    },
    { text: none, none: true },
  ],

  s112: [
    {
      text: { en: 'It is equal to a third of the Quran.', ar: 'تعدل ثلث القرآن.', he: 'היא שקולה לשליש מהקוראן.' },
      refs: [h('bukhari', '5013'), h('muslim', '811')],
    },
    {
      text: { en: 'A companion who led prayer used to end his recitation with it because it describes ar-Rahman, and he loved it. The Prophet ﷺ said: tell him that Allah loves him.', ar: 'كان صحابي يؤم أصحابه فيختم قراءته بها لأنها صفة الرحمن وهو يحبها، فقال النبي ﷺ: أخبروه أن الله يحبه.', he: 'חבר שהוביל תפילה נהג לסיים בה את קריאתו כי היא מתארת את הרחמן והוא אהב אותה. הנביא ﷺ אמר: אמרו לו שאללה אוהב אותו.' },
      refs: [h('bukhari', '7375'), h('muslim', '813')],
    },
    {
      text: { en: 'Recited with Al-Kafirun in the two sunnah rak\'ahs before Fajr.', ar: 'كان يقرؤها مع سورة الكافرون في ركعتي سنة الفجر.', he: 'נקראה יחד עם אל-כאפירון בשתי רכעות הסונה שלפני הפג׳ר.' },
      refs: [h('muslim', '726')],
    },
    {
      text: { en: 'Before sleeping, the Prophet ﷺ recited Al-Ikhlas, Al-Falaq and An-Nas into his cupped hands and wiped over his body, three times.', ar: 'كان ﷺ إذا أوى إلى فراشه جمع كفيه ونفث فيهما وقرأ الإخلاص والفلق والناس ثم مسح جسده، ثلاث مرات.', he: 'לפני השינה קרא הנביא ﷺ את אל-אח׳לאס, אל-פלק ואן-נאס לתוך כפות ידיו המקופלות, ומסח על גופו, שלוש פעמים.' },
      refs: [h('bukhari', '5017')],
    },
  ],

  s106: [{ text: none, none: true }],

  s110: [
    {
      text: { en: 'Ibn \'Abbas understood it as a sign that the Prophet\'s ﷺ life was nearing its end, and \'Umar agreed with him.', ar: 'فهم ابن عباس منها أنها إشارة إلى قرب أجل النبي ﷺ، ووافقه عمر.', he: 'אבן עבאס הבין ממנה שהיא סימן לכך שחיי הנביא ﷺ קרבו לסיומם, ועומר הסכים איתו.' },
      refs: [h('bukhari', '4970')],
    },
    {
      text: { en: 'After it, the Prophet ﷺ often said in ruku\' and sujud: "Subhanaka Allahumma rabbana wa bihamdika, Allahumma-ghfir li" (Glory be to You, O Allah our Lord, and praise; O Allah, forgive me), acting on the surah\'s command.', ar: 'كان ﷺ يُكثر أن يقول في ركوعه وسجوده: سبحانك اللهم ربنا وبحمدك، اللهم اغفر لي، يتأول القرآن.', he: 'אחריה נהג הנביא ﷺ לומר הרבה בכריעה ובהשתחוויה: "סובחאנכ אללהומ רבנא ובחמדכ, אללהומ אע׳פר לי" (שבח לך אללה אדוננו ובהלל; אללה, סלח לי), כמימוש ציווי הסורה.' },
      refs: [h('bukhari', '817'), h('muslim', '484')],
    },
  ],

  s113: [
    {
      text: { en: '"Have you not seen ayahs revealed tonight the like of which have never been seen?" — Al-Falaq and An-Nas.', ar: 'قال ﷺ: ألم تر آيات أنزلت الليلة لم يُر مثلهن قط؟ يعني المعوذتين.', he: '"הלא ראית פסוקים שנגלו הלילה שכמותם לא נראו מעולם?" — אל-פלק ואן-נאס.' },
      refs: [h('muslim', '814')],
    },
    {
      text: { en: 'The Prophet ﷺ told \'Uqbah ibn \'Amir to recite the two surahs of refuge (al-Mu\'awwidhatayn) after every prayer.', ar: 'أمر النبي ﷺ عقبة بن عامر أن يقرأ المعوذتين دبر كل صلاة.', he: 'הנביא ﷺ ציווה על עוקבה בן עאמר לקרוא את שתי סורות המקלט אחרי כל תפילה.' },
      refs: [h('abudawud', '1523', 'sahih')],
    },
    {
      text: { en: 'Recited before sleeping with Al-Ikhlas (see Al-Ikhlas).', ar: 'تُقرأ قبل النوم مع الإخلاص (انظر سورة الإخلاص).', he: 'נקראת לפני השינה יחד עם אל-אח׳לאס.' },
      refs: [h('bukhari', '5017')],
    },
  ],

  get s114() { return this.s113; },

  s105: [
    {
      text: { en: 'At al-Hudaybiyah, when his camel al-Qaswa\' stopped and would not move, the Prophet ﷺ said she was held back by the One who held back the Elephant — the event this surah describes.', ar: 'في الحديبية بركت ناقته القصواء فقال ﷺ: حبسها حابس الفيل — وهي الحادثة التي تذكرها السورة.', he: 'באל-חודייביה, כשהגמלה אל-קסוואא נעצרה, אמר הנביא ﷺ שעצר אותה מי שעצר את הפיל — האירוע שהסורה מתארת.' },
      refs: [h('bukhari', '2731')],
    },
    {
      text: { en: 'Historians of the sirah report that the Year of the Elephant was the year the Prophet ﷺ was born.', ar: 'يذكر أهل السيرة أن عام الفيل هو العام الذي وُلد فيه النبي ﷺ.', he: 'היסטוריוני הסירה מדווחים ששנת הפיל היא השנה שבה נולד הנביא ﷺ.' },
      refs: [book({ en: 'Sirat Ibn Hisham (from Ibn Ishaq)', ar: 'سيرة ابن هشام (عن ابن إسحاق)', he: 'סירת אבן השאם (מאבן אסחאק)' }, 'history')],
    },
  ],

  s111: [
    {
      text: { en: 'When the command to warn his closest kin was revealed, the Prophet ﷺ climbed as-Safa and called the clans of Quraysh to faith. Abu Lahab cursed him, and this surah was revealed.', ar: 'لما نزل الأمر بإنذار عشيرته الأقربين صعد النبي ﷺ الصفا ونادى بطون قريش، فردّ عليه أبو لهب بالسب، فنزلت السورة.', he: 'כשנגלה הציווי להזהיר את קרוביו, עלה הנביא ﷺ על א-צפא וקרא לשבטי קורייש לאמונה. אבו להב קילל אותו, ואז נגלתה הסורה.' },
      refs: [h('bukhari', '4971'), h('muslim', '208')],
    },
  ],

  s107: [{ text: none, none: true }],

  s109: [
    {
      text: { en: 'Recited with Al-Ikhlas in the two sunnah rak\'ahs before Fajr.', ar: 'كان يقرؤها مع الإخلاص في ركعتي سنة الفجر.', he: 'נקראה עם אל-אח׳לאס בשתי רכעות הסונה שלפני הפג׳ר.' },
      refs: [h('muslim', '726')],
    },
    {
      text: { en: 'Recited in Witr: Al-A\'la, then Al-Kafirun, then Al-Ikhlas.', ar: 'كان يوتر بسورة الأعلى، ثم الكافرون، ثم الإخلاص.', he: 'נקראה בתפילת הוויתר: אל-אעלא, אל-כאפירון, אל-אח׳לאס.' },
      refs: [h('abudawud', '1423', 'sahih')],
    },
    {
      text: { en: 'Recited with Al-Ikhlas in the two rak\'ahs after tawaf, in the description of the Prophet\'s ﷺ Hajj.', ar: 'قرأها مع الإخلاص في ركعتي الطواف، في صفة حجة النبي ﷺ.', he: 'נקראה עם אל-אח׳לאס בשתי הרכעות שאחרי הטוואף, בתיאור החג׳ של הנביא ﷺ.' },
      refs: [h('muslim', '1218')],
    },
  ],

  s94: [{ text: none, none: true }],

  s102: [
    {
      text: { en: 'A companion came while the Prophet ﷺ was reciting it; he said the son of Adam says "my wealth, my wealth," yet all he truly keeps is what he ate, wore out, or gave in charity and sent ahead.', ar: 'جاء صحابي والنبي ﷺ يقرؤها فقال: يقول ابن آدم: مالي مالي، وهل لك من مالك إلا ما أكلت فأفنيت، أو لبست فأبليت، أو تصدقت فأمضيت.', he: 'חבר הגיע כשהנביא ﷺ קרא אותה; הוא אמר שבן האדם אומר "רכושי, רכושי", אך כל מה שבאמת נשאר לו הוא מה שאכל, מה שבלה, או מה שנתן כצדקה ושלח לפניו.' },
      refs: [h('muslim', '2958')],
    },
  ],

  s97: [
    {
      text: { en: 'Whoever stands in prayer on Laylat al-Qadr out of faith and hoping for reward, his past sins are forgiven.', ar: 'من قام ليلة القدر إيمانًا واحتسابًا غُفر له ما تقدم من ذنبه.', he: 'מי שעומד בתפילה בליל אל-קדר מתוך אמונה ותקווה לשכר, נסלחים לו חטאיו הקודמים.' },
      refs: [h('bukhari', '1901'), h('muslim', '760')],
    },
  ],

  s104: [{ text: none, none: true }],

  s95: [
    {
      text: { en: 'Al-Bara\' ibn \'Azib heard the Prophet ﷺ recite it in \'Isha and said he never heard anyone with a more beautiful voice or recitation.', ar: 'سمع البراء بن عازب النبي ﷺ يقرؤها في العشاء، وقال: ما سمعت أحدًا أحسن صوتًا أو قراءة منه.', he: 'אל-בראא בן עאזב שמע את הנביא ﷺ קורא אותה בתפילת העישאא ואמר שלא שמע מעולם קול או קריאה יפים יותר.' },
      refs: [h('bukhari', '769'), h('muslim', '464')],
    },
  ],

  s99: [
    {
      text: { en: 'A man heard the Prophet ﷺ recite it in both rak\'ahs of Fajr — showing that repeating one surah in two rak\'ahs is allowed.', ar: 'سمع رجل النبي ﷺ يقرؤها في الركعتين كلتيهما من الفجر، وفيه جواز تكرار السورة في الركعتين.', he: 'אדם שמע את הנביא ﷺ קורא אותה בשתי רכעות הפג׳ר — מה שמראה שמותר לחזור על סורה אחת בשתי רכעות.' },
      refs: [h('abudawud', '816', 'hasan')],
    },
  ],

  s101: [{ text: none, none: true }],

  'p2:1-5': [
    {
      text: { en: 'About the whole of Al-Baqarah: do not make your houses like graveyards; Shaytan flees from a house in which Surat al-Baqarah is recited.', ar: 'في سورة البقرة كلها: لا تجعلوا بيوتكم مقابر، إن الشيطان ينفر من البيت الذي تُقرأ فيه سورة البقرة.', he: 'על סורת אל-בקרה כולה: אל תהפכו את בתיכם לבתי קברות; השטן בורח מבית שבו נקראת סורת אל-בקרה.' },
      refs: [h('muslim', '780')],
    },
  ],

  s93: [
    {
      text: { en: 'Revealed after a pause in revelation, when it was taunted that his Lord had abandoned him; it reassures him that his Lord has neither left him nor become displeased.', ar: 'نزلت بعد فترة من انقطاع الوحي حين قيل إن ربه تركه، فطمأنته بأن ربه لم يتركه ولم يُبغضه.', he: 'נגלתה אחרי הפסקה בהתגלות, כשלגלגו שאדונו נטש אותו; היא מרגיעה אותו שאדונו לא עזב אותו ולא כעס עליו.' },
      refs: [h('bukhari', '4950'), h('muslim', '1797')],
    },
  ],

  s100: [{ text: none, none: true }],

  'p59:22-24': [
    {
      text: { en: 'These ayahs bring together many of Allah\'s beautiful names — a strong reason to understand each name as you recite.', ar: 'تجمع هذه الآيات كثيرًا من أسماء الله الحسنى، فتأمل كل اسم وأنت تقرؤها.', he: 'פסוקים אלה מאגדים רבים משמותיו היפים של אללה — סיבה טובה להבין כל שם בזמן הקריאה.' },
      refs: [q('59:22-24')],
    },
    {
      text: { en: 'A frequently shared hadith promising 70,000 angels for reciting these ayahs morning and evening is graded weak by many scholars, including al-Albani, so it is not relied on here.', ar: 'الحديث المشهور في أن من قرأها صباحًا ومساءً وكّل الله به سبعين ألف ملك ضعّفه كثير من العلماء ومنهم الألباني، فلا نعتمد عليه هنا.', he: 'חדית׳ נפוץ המבטיח 70,000 מלאכים למי שקורא פסוקים אלה בבוקר ובערב דורג חלש בידי חכמים רבים, ובהם אל-אלבאני, ולכן אין מסתמכים עליו כאן.' },
      refs: [h('tirmidhi', '2922', 'daif')],
    },
  ],

  'p2:255-255': [
    {
      text: { en: 'The Prophet ﷺ asked Ubayy ibn Ka\'b which ayah of the Book of Allah is greatest; he answered Ayat al-Kursi, and the Prophet ﷺ congratulated him on his knowledge.', ar: 'سأل النبي ﷺ أُبيَّ بن كعب: أي آية في كتاب الله أعظم؟ فقال: آية الكرسي، فقال: ليهنك العلم أبا المنذر.', he: 'הנביא ﷺ שאל את אוביי בן כעב איזה פסוק בספר אללה הוא הגדול ביותר; הוא ענה אית אל-כורסי, והנביא ﷺ בירך אותו על ידיעתו.' },
      refs: [h('muslim', '810')],
    },
    {
      text: { en: 'Recited when going to bed, a guardian from Allah stays with you and Shaytan does not come near you until morning.', ar: 'من قرأها إذا أوى إلى فراشه لم يزل عليه من الله حافظ ولا يقربه شيطان حتى يصبح.', he: 'מי שקורא אותה בלכתו לישון — שומר מאת אללה נשאר עמו והשטן אינו מתקרב אליו עד הבוקר.' },
      refs: [h('bukhari', '2311')],
    },
    {
      text: { en: 'Reciting it after every obligatory prayer: nothing prevents one from entering Paradise except death.', ar: 'من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت.', he: 'מי שקורא אותה אחרי כל תפילת חובה — דבר אינו מונע ממנו להיכנס לגן העדן מלבד המוות.' },
      refs: [book({ en: "an-Nasa'i, as-Sunan al-Kubra (no. 9928; numbering differs by edition)", ar: 'النسائي، السنن الكبرى (رقم 9928، ويختلف الترقيم باختلاف الطبعات)', he: "א-נסאאי, א-סונן אל-כוברא (מס׳ 9928; המספור משתנה בין מהדורות)" }, 'sahih')],
    },
  ],

  s91: [
    {
      text: { en: 'The Prophet ﷺ told Mu\'adh, who had made the prayer too long for people, to recite surahs such as Al-A\'la, Ash-Shams and Al-Layl when leading.', ar: 'قال النبي ﷺ لمعاذ لما أطال بالناس: هلّا صليت بسورة الأعلى وسورة الشمس وسورة الليل.', he: 'הנביא ﷺ אמר למועאד׳, שהאריך את התפילה מדי לאנשים, לקרוא סורות כמו אל-אעלא, א-שמס ואל-לייל כשהוא מוביל.' },
      refs: [h('bukhari', '705'), h('muslim', '465')],
    },
  ],

  'p23:1-11': [
    {
      text: { en: 'The believers who succeed are described first by khushu\' in their prayer, and these ayahs end with guarding the prayers — the theme of this whole app.', ar: 'أول ما وُصف به المؤمنون المفلحون الخشوعُ في صلاتهم، وتُختم الآيات بالمحافظة على الصلوات.', he: 'המאמינים המצליחים מתוארים קודם כל בח׳ושוע בתפילתם, והפסוקים מסתיימים בשמירה על התפילות — נושא האפליקציה כולה.' },
      refs: [q('23:1-11')],
    },
  ],

  'p67:1-5': [
    {
      text: { en: 'About the whole of Al-Mulk: a surah of thirty ayahs interceded for a man until he was forgiven.', ar: 'في سورة الملك كلها: سورة من القرآن ثلاثون آية شفعت لرجل حتى غُفر له.', he: 'על סורת אל-מולך כולה: סורה של שלושים פסוקים השתדלה למען אדם עד שנסלח לו.' },
      refs: [h('abudawud', '1400', 'hasan'), h('tirmidhi', '2891', 'hasan')],
    },
  ],

  s86: [
    {
      text: { en: 'The Prophet ﷺ recited At-Tariq and Al-Buruj, and similar surahs, in Dhuhr and \'Asr.', ar: 'كان ﷺ يقرأ في الظهر والعصر بسورة الطارق وسورة البروج ونحوهما.', he: 'הנביא ﷺ קרא את א-טארק ואל-בורוג׳ וסורות דומות בתפילות הצהריים והעסר.' },
      refs: [h('abudawud', '805', 'sahih'), h('tirmidhi', '307', 'sahih')],
    },
  ],

  s92: [
    {
      text: { en: 'Recited by the Prophet ﷺ in Dhuhr (and similar in \'Asr), with longer recitation in Fajr.', ar: 'كان ﷺ يقرأ في الظهر بسورة الليل، وفي العصر نحو ذلك، وفي الصبح أطول من ذلك.', he: 'הנביא ﷺ קרא אותה בתפילת הצהריים (וכדומה בעסר), ובפג׳ר קריאה ארוכה יותר.' },
      refs: [h('muslim', '459')],
    },
    {
      text: { en: 'Recommended to Mu\'adh for leading prayer (see Ash-Shams).', ar: 'مما أرشد إليه النبي ﷺ معاذًا عند إمامة الناس (انظر سورة الشمس).', he: 'הומלצה למועאד׳ להובלת תפילה (ראה א-שמס).' },
      refs: [h('bukhari', '705')],
    },
    {
      text: { en: 'When told that each person\'s place is already written, the Prophet ﷺ said: act, for each is made easy for what he was created for — and recited ayahs 5–10 of this surah.', ar: 'لما أخبر ﷺ أن مقعد كل أحد مكتوب قال: اعملوا فكلٌّ ميسر لما خُلق له، ثم قرأ الآيات من الخامسة إلى العاشرة من هذه السورة.', he: 'כשנאמר שמקומו של כל אחד כבר כתוב, אמר הנביא ﷺ: עשו, כי כל אחד מוקל לו מה שלשמו נברא — וקרא את פסוקים 5–10 של סורה זו.' },
      refs: [h('bukhari', '4949'), h('muslim', '2647')],
    },
  ],

  s87: [
    {
      text: { en: 'Recited by the Prophet ﷺ with Al-Ghashiyah in the two Eid prayers and in Jumu\'ah.', ar: 'كان ﷺ يقرأ في العيدين والجمعة بسورة الأعلى وسورة الغاشية.', he: 'הנביא ﷺ קרא אותה עם אל-ע׳אשיה בשתי תפילות החג ובתפילת יום שישי.' },
      refs: [h('muslim', '878')],
    },
    {
      text: { en: 'Recited in the first rak\'ah of Witr (with Al-Kafirun and Al-Ikhlas).', ar: 'كان يوتر بها في الركعة الأولى مع الكافرون والإخلاص.', he: 'נקראה ברכעה הראשונה של הוויתר (עם אל-כאפירון ואל-אח׳לאס).' },
      refs: [h('abudawud', '1423', 'sahih')],
    },
    {
      text: { en: 'Recommended to Mu\'adh for leading prayer (see Ash-Shams).', ar: 'مما أرشد إليه النبي ﷺ معاذًا (انظر سورة الشمس).', he: 'הומלצה למועאד׳ (ראה א-שמס).' },
      refs: [h('bukhari', '705')],
    },
    {
      text: { en: 'It is reported that after reciting its first ayah the Prophet ﷺ said "Subhana rabbiya al-a\'la". Al-Albani graded it sahih; some scholars hold it is Ibn \'Abbas\'s own practice.', ar: 'رُوي أنه ﷺ كان إذا قرأ أول آية منها قال: سبحان ربي الأعلى. صححه الألباني، ورجّح بعض العلماء أنه موقوف على ابن عباس.', he: 'מסופר שאחרי קריאת הפסוק הראשון אמר הנביא ﷺ "סובחאן רבייא אל-אעלא". אל-אלבאני דירג זאת צחיח; יש חכמים הסבורים שזה מנהגו של אבן עבאס עצמו.' },
      refs: [h('abudawud', '883', 'differed')],
    },
  ],

  s96: [
    {
      text: { en: 'Its opening ayahs were the first revelation, in the cave of Hira\'.', ar: 'أوائلها أول ما نزل من الوحي في غار حراء.', he: 'פסוקי הפתיחה שלה היו ההתגלות הראשונה, במערת חירא.' },
      refs: [h('bukhari', '3'), h('muslim', '160')],
    },
    {
      text: { en: 'It ends with an ayah of prostration; the companions prostrated with the Prophet ﷺ when he recited it.', ar: 'تُختم بآية سجدة، وقد سجد الصحابة مع النبي ﷺ فيها.', he: 'היא מסתיימת בפסוק השתחוויה; החברים השתחוו עם הנביא ﷺ כשקרא אותו.' },
      refs: [h('muslim', '578')],
    },
  ],

  'p2:285-286': [
    {
      text: { en: 'Whoever recites the last two ayahs of Al-Baqarah at night, they will suffice him.', ar: 'من قرأ بالآيتين من آخر سورة البقرة في ليلة كفتاه.', he: 'מי שקורא בלילה את שני הפסוקים האחרונים של אל-בקרה — הם יספיקו לו.' },
      refs: [h('bukhari', '5009'), h('muslim', '807')],
    },
    {
      text: { en: 'One of the "two lights" given to the Prophet ﷺ (with al-Fatihah).', ar: 'من النورين اللذين أوتيهما النبي ﷺ مع الفاتحة.', he: 'אחד מ"שני האורות" שניתנו לנביא ﷺ (יחד עם אל-פאתחה).' },
      refs: [h('muslim', '806')],
    },
    {
      text: { en: 'When the companions recited the du\'as at the end of 2:286, Allah answered each one: "I have done so."', ar: 'لما قرأ الصحابة الأدعية في آخرها قال الله عند كل دعوة: قد فعلت.', he: 'כשהחברים קראו את התפילות שבסוף 2:286, ענה אללה על כל אחת: "עשיתי זאת".' },
      refs: [h('muslim', '126')],
    },
  ],

  'p3:190-194': [
    {
      text: { en: 'When the Prophet ﷺ woke at night for prayer, he looked at the sky and recited these ayahs — the beginning of the last ten ayahs of Al \'Imran.', ar: 'كان ﷺ إذا قام من الليل نظر إلى السماء وقرأ هذه الآيات، وهي أول العشر الأواخر من آل عمران.', he: 'כשהנביא ﷺ קם בלילה לתפילה, הביט בשמים וקרא פסוקים אלה — תחילת עשרת הפסוקים האחרונים של אאל עמראן.' },
      refs: [h('bukhari', '4569'), h('bukhari', '4570')],
    },
  ],

  s82: [
    {
      text: { en: 'Whoever would like to see the Day of Resurrection as if with his own eyes, let him recite At-Takwir, Al-Infitar and Al-Inshiqaq.', ar: 'من سرّه أن ينظر إلى يوم القيامة كأنه رأي عين فليقرأ التكوير والانفطار والانشقاق.', he: 'מי שרוצה לראות את יום התחייה כאילו בעיניו, שיקרא את א-תכוויר, אל-אנפיטאר ואל-אנשקאק.' },
      refs: [h('tirmidhi', '3333', 'sahih')],
    },
  ],

  s90: [{ text: none, none: true }],

  s88: [
    {
      text: { en: 'Recited by the Prophet ﷺ with Al-A\'la in the Eid prayers and Jumu\'ah.', ar: 'كان ﷺ يقرؤها مع الأعلى في العيدين والجمعة.', he: 'הנביא ﷺ קרא אותה עם אל-אעלא בתפילות החג ובתפילת יום שישי.' },
      refs: [h('muslim', '878')],
    },
  ],

  s98: [
    {
      text: { en: 'The Prophet ﷺ told Ubayy ibn Ka\'b that Allah had commanded him to recite this surah to him, naming Ubayy — and Ubayy wept.', ar: 'قال النبي ﷺ لأُبي بن كعب: إن الله أمرني أن أقرأ عليك هذه السورة، قال: وسمّاني؟ قال: نعم، فبكى.', he: 'הנביא ﷺ אמר לאוביי בן כעב שאללה ציווה עליו לקרוא לו סורה זו, ואף נקב בשמו — ואוביי בכה.' },
      refs: [h('bukhari', '4959'), h('muslim', '799')],
    },
  ],

  s81: [
    {
      text: { en: 'Named with Al-Infitar and Al-Inshiqaq: recite them to "see" the Day of Resurrection.', ar: 'ذُكرت مع الانفطار والانشقاق: من أراد أن ينظر إلى يوم القيامة فليقرأها.', he: 'מוזכרת עם אל-אנפיטאר ואל-אנשקאק: קרא אותן כדי "לראות" את יום התחייה.' },
      refs: [h('tirmidhi', '3333', 'sahih')],
    },
    {
      text: { en: 'Among the surahs the Prophet ﷺ said had "made him grey" (with Hud, Al-Waqi\'ah, Al-Mursalat and An-Naba\').', ar: 'من السور التي قال ﷺ إنها شيّبته: هود والواقعة والمرسلات والنبأ والتكوير.', he: 'בין הסורות שהנביא ﷺ אמר ש"הלבינו את שערו" (עם הוד, אל-ואקעה, אל-מורסלאת ואן-נבאא).' },
      refs: [h('tirmidhi', '3297', 'differed', { en: 'Tirmidhi: hasan gharib; al-Albani: sahih; others weakened the chain', ar: 'قال الترمذي: حسن غريب، وصححه الألباني، وضعف إسناده آخرون', he: 'א-תירמד׳י: חסן ע׳ריב; אל-אלבאני: צחיח; אחרים החלישו את השרשרת' })],
    },
  ],

  s84: [
    {
      text: { en: 'Named with At-Takwir and Al-Infitar (see Al-Infitar).', ar: 'ذُكرت مع التكوير والانفطار (انظر سورة الانفطار).', he: 'מוזכרת עם א-תכוויר ואל-אנפיטאר.' },
      refs: [h('tirmidhi', '3333', 'sahih')],
    },
    {
      text: { en: 'Contains an ayah of prostration; Abu Hurayrah prostrated in it, saying he saw the Prophet ﷺ do so.', ar: 'فيها سجدة تلاوة، وقد سجد فيها أبو هريرة وقال إنه رأى النبي ﷺ يسجد فيها.', he: 'יש בה פסוק השתחוויה; אבו הוריירה השתחווה בו ואמר שראה את הנביא ﷺ עושה זאת.' },
      refs: [h('muslim', '578')],
    },
  ],

  s85: [
    {
      text: { en: 'Recited by the Prophet ﷺ in Dhuhr and \'Asr (with At-Tariq).', ar: 'كان ﷺ يقرؤها في الظهر والعصر مع الطارق.', he: 'הנביא ﷺ קרא אותה בתפילות הצהריים והעסר (עם א-טארק).' },
      refs: [h('abudawud', '805', 'sahih'), h('tirmidhi', '307', 'sahih')],
    },
  ],

  s80: [
    {
      text: { en: 'Its opening was revealed about the blind companion Ibn Umm Maktum, who came seeking guidance.', ar: 'نزل أولها في ابن أم مكتوم الأعمى حين جاء يسترشد.', he: 'פתיחתה נגלתה על החבר העיוור אבן אום מכתום, שבא לבקש הדרכה.' },
      refs: [h('tirmidhi', '3331', 'sahih')],
    },
  ],

  s89: [{ text: none, none: true }],
  s83: [{ text: none, none: true }],

  s78: [
    {
      text: { en: 'Among the surahs the Prophet ﷺ said had "made him grey" (see At-Takwir).', ar: 'من السور التي قال ﷺ إنها شيّبته (انظر سورة التكوير).', he: 'בין הסורות שהנביא ﷺ אמר ש"הלבינו את שערו" (ראה א-תכוויר).' },
      refs: [h('tirmidhi', '3297', 'differed')],
    },
  ],

  s79: [{ text: none, none: true }],
};
