// Animacje ćwiczeń: postać z konturem anatomicznym, widok z boku (twarzą w prawo), od przodu (front: true) albo od tyłu (front i back: true).
// Priorytet: ma być dokładnie widać, jak wykonać ćwiczenie. Widok wybieramy tak, żeby ruch leżał w płaszczyźnie obrazu.
// Każdy ruch ma pozę A (luz) i B (spięcie); dłonie i stopy to cele, łokcie i kolana liczy kinematyka odwrotna.
// Pracujące mięśnie (EXERCISES[id].p / .s) czerwienieją przy spięciu i bledną przy rozluźnieniu.
// Poza: h biodra [x,y], t kąt tułowia (°; 0 = w prawo, -90 = w górę), H dłonie, F kostki (jeden punkt albo [prawa/bliższa, lewa/dalsza]),
// fa kąt stóp, eb/kb kierunek zgięcia łokci/kolan (±1), s skrót perspektywiczny ramion [ramię, przedramię], sup = leży na plecach.
// E i ea: łokieć nieruchomy w punkcie E, przedramię pod kątem ea (dłoń zatacza łuk wokół łokcia, np. prostowanie na wyciągu).
// Bez h: ciało proste od kostek (biodro wynika z F i t). a zamiast H: proste ręce pod kątem a (liczba albo [bliższa, dalsza]).
// Taśma TRX się nie rozciąga: w pozie A i B dłoń albo stopa musi być w tej samej odległości od zaczepu (pilnuje tego `node logic.js`).
const SEG = { torso: 58, neck: 7, head: 11, ua: 30, fa: 34, th: 44, sh: 42, ft: 13 };
const HALF = { shoulder: 19, hip: 9 }; // pół szerokości barków i bioder w widoku od przodu

const STAND = { h: [150, 98], t: -90, H: [150, 104], F: [150, 184], fa: 12 };
const HANG = { h: [150, 140], t: -90, H: [157, 18], F: [140, 222], fa: 60 };
const SUPPORT = { h: [148, 94], t: -88, H: [152, 100], F: [120, 160], fa: 70 };
const PLANK = { t: -11, H: [218, 186], F: [46, 182], fa: 40, eb: [1, 1] };
// Widok od przodu: stoi, ręce wzdłuż tułowia / wisi na drążku na prostych rękach.
const FSTAND = { h: [150, 98], H: [[176, 104], [124, 104]], F: [[160, 184], [140, 184]] };
const FHANG = { h: [150, 139], H: [[182, 18], [118, 18]], F: [[158, 224], [142, 224]] };
const FNARROW = [[172, 18], [128, 18]]; // podchwyt: dłonie na szerokość barków
const FBAR = ['hbar', 86, 214, 16];
// Deska bokiem widziana od przodu: podpór na przedramieniu, stopy jedna na drugiej, druga ręka na biodrze.
const SIDEPLANK = { h: [126, 152], t: -16, H: [[199, 185], [124, 143]], F: [[46, 184], [41, 167]], s: [[1, .35], [1, 1]], eb: [1, 1], fa: [164, 164] };

const MOVES = {
  // Drążek od tyłu (widać pracujące plecy): pełny zakres, na górze drążek na wysokości szyi, głowa nad drążkiem.
  pullup: { front: true, back: true, props: [FBAR], A: FHANG, B: { h: [150, 81], H: FHANG.H, F: [[158, 166], [142, 166]] } },
  // Podchwyt: węższy chwyt, na górze łokcie schodzą w dół wzdłuż tułowia.
  chinup: { front: true, back: true, props: [FBAR], A: { ...FHANG, H: FNARROW }, B: { h: [150, 81], H: FNARROW, F: [[158, 166], [142, 166]] } },
  // Podciąganie łopatek: ręce zostają proste, barki schodzą w dół, ciało unosi się o kilka centymetrów.
  scap: { front: true, back: true, props: [FBAR], A: FHANG, B: { ...FHANG, h: [150, 134.5], F: [[158, 219.5], [142, 219.5]], s: [[.93, .93], [.93, .93]] } },
  hang: { front: true, back: true, props: [FBAR], A: FHANG, B: FHANG },
  // Wiosłowanie TRX: twarzą do zaczepu, ciało odchylone do tyłu. Dłonie zostają prawie w miejscu, a klatka podchodzi do dłoni.
  row: {
    props: [['ground', 190], ['strap', 270, -16, 'wr0']],
    A: { t: -130, H: [163, 43], F: [200, 184], fa: -60 },
    B: { t: -109, H: [170, 53], F: [200, 184], fa: -60 },
  },
  // Wiosłowanie australijskie: zwis pod niskim drążkiem klatką do góry, pięty na ziemi; klatka idzie do drążka.
  invrow: {
    props: [['ground', 190], ['post', 131, 88, 190], ['bar', 131, 88]],
    A: { t: -159, H: [131, 89], F: [220, 184], fa: -60 },
    B: { t: -138, H: [131, 89], F: [220, 184], fa: -60 },
  },
  // Dipy: na dole łokieć zgięty do 90° i nie głębiej, przedramię prawie pionowo, tułów lekko pochylony.
  dip: {
    props: [['ground', 232], ['pbar', 152, 100, 232]],
    A: SUPPORT,
    B: { h: [154, 115], t: -70, H: [152, 100], F: [124, 182], fa: 70 },
  },
  support: { props: [['ground', 232], ['pbar', 152, 100, 232]], A: SUPPORT, B: SUPPORT },
  pushup: {
    props: [['ground', 190]],
    A: { t: -25.5, H: [188, 184], F: [52, 182], fa: 40 },
    B: { t: -10, H: [188, 184], F: [52, 182], fa: 40 },
  },
  // Pompki na TRX: tyłem do zaczepu, taśmy biegną zza pleców do dłoni.
  trxpush: {
    props: [['ground', 190], ['strap', 90, -90, 'wr0']],
    A: { t: -50, H: [232, 94], F: [80, 182], fa: 40 },
    B: { t: -35, H: [214, 112], F: [80, 182], fa: 40 },
  },
  declpush: {
    props: [['ground', 190], ['box', 18, 150, 56, 40]],
    A: { t: -10.5, H: [192, 184], F: [50, 146], fa: 60 },
    B: { t: 4, H: [192, 184], F: [50, 146], fa: 60 },
  },
  inclpush: {
    props: [['ground', 190], ['box', 176, 152, 56, 38]],
    A: { t: -41, H: [198, 147], F: [70, 182], fa: 40 },
    B: { t: -31, H: [198, 147], F: [70, 182], fa: 40 },
  },
  // Guma od tyłu (widać tylne barki i środek pleców; guma rysowana na wierzchu, żeby była widoczna): proste ręce z pozycji przed sobą (skrót perspektywiczny) rozchodzą się szeroko na boki, guma się napina.
  pullapart: {
    front: true, back: true, props: [['ground', 199], ['band2', 'wr1', 'wr0']],
    A: { ...FSTAND, a: [0, 180], s: [[.3, .3], [.3, .3]] },
    B: { ...FSTAND, a: [0, 180] },
  },
  // Rotacja zewnętrzna od przodu: łokieć przy boku, przedramię obraca się na zewnątrz, guma zaczepiona do słupka z drugiej strony.
  extrot: {
    front: true, props: [['ground', 199], ['post', 64, 36, 199], ['band', 64, 70, 'wr0']],
    A: { ...FSTAND, H: [[166, 74], [124, 104]], s: [[1, .3], [1, 1]] },
    B: { ...FSTAND, H: [[205, 70], [124, 104]] },
  },
  // Unoszenie kolan: kolana idą wyżej niż biodra, w stronę klatki.
  kneebars: {
    props: [['ground', 232], ['pbar', 152, 100, 232]],
    A: { ...SUPPORT, F: [150, 180] },
    B: { ...SUPPORT, F: [184, 116] },
  },
  kneehang: {
    props: [['bar', 157, 16]],
    A: { ...HANG, F: [148, 226] },
    B: { ...HANG, h: [148, 138], t: -86, F: [184, 160] },
  },
  plank: { props: [['ground', 190]], A: PLANK, B: PLANK },
  sideplank: { front: true, props: [['ground', 190]], A: SIDEPLANK, B: SIDEPLANK },
  // Rollout na TRX: tyłem do zaczepu. Ciało pochyla się jak deska, a proste ręce idą z dołu nad głowę.
  rollout: {
    props: [['ground', 190], ['strap', 60, -110, 'wr0']],
    A: { t: -78, a: 30, F: [110, 184], fa: 12 },
    B: { t: -50, a: -50, F: [110, 184], fa: 12 },
  },
  // Kolana na TRX: stopy w pętlach pod zaczepem, podpór na prostych rękach; kolana idą pod klatkę, biodra lekko w górę.
  trxknees: {
    props: [['ground', 190], ['strap', 58, -150, 'an0']],
    A: { h: [142, 132], t: -12, H: [200, 184], F: [58, 150], fa: 30 },
    B: { h: [143.5, 107], t: 13, H: [200, 184], F: [130, 141], fa: 30 },
  },
  // Dead bug: prosta ręka opada za głowę, przeciwna noga prostuje się nisko nad ziemią.
  deadbug: {
    props: [['ground', 190]], sup: true,
    A: { h: [110, 176], t: 0, a: -90, F: [68, 132], kb: [1, 1], fa: -90 },
    B: { h: [110, 176], t: 0, a: [-3, -90], F: [[68, 132], [24, 170]], kb: [1, 1], fa: -90 },
  },
  squat: {
    props: [['ground', 190]],
    A: { ...STAND, H: [210, 50] },
    B: { h: [112, 146], t: -55, H: [205, 100], F: [150, 184], fa: 12 },
  },
  bandsquat: {
    props: [['ground', 190], ['band2', 'an0', 'sh']],
    A: { ...STAND, H: [158, 40], eb: [1, 1] },
    B: { h: [112, 146], t: -55, H: [152, 98], F: [150, 184], fa: 12 },
  },
  // Przysiad wykroczny: tylna stopa w pętli pod zaczepem, tylne kolano schodzi prawie do ziemi.
  trxsplit: {
    props: [['ground', 190], ['strap', 92, -150, 'an1']],
    A: { h: [150, 100], t: -88, H: [206, 60], F: [[180, 184], [95, 150]], fa: [12, 80] },
    B: { h: [140, 140], t: -80, H: [200, 96], F: [[180, 184], [88, 151]], fa: [12, 80] },
  },
  // Przysiad na jednej nodze: dłonie trzymają uchwyty w jednym miejscu, druga noga zwisa obok skrzyni.
  boxpistol: {
    props: [['ground', 190], ['box', 70, 130, 90, 60], ['strap', 300, -90, 'wr0']],
    A: { h: [150, 38], t: -90, H: [210, 9], F: [[150, 124], [182, 124]], fa: [12, 40] },
    B: { h: [118, 84], t: -60, H: [210, 9], F: [[150, 124], [176, 168]], fa: [12, 60] },
  },
  // Wykrok: tylne kolano tuż nad ziemią, tylna pięta w górze.
  lunge: {
    props: [['ground', 190]],
    A: { h: [150, 108], t: -90, H: [150, 114], F: [[190, 184], [110, 184]], fa: [12, 40] },
    B: { h: [148, 134], t: -88, H: [148, 140], F: [[192, 184], [106, 172]], fa: [12, 65] },
  },
  bridge: {
    props: [['ground', 190]], sup: true,
    A: { h: [100, 176], t: 0, H: [90, 185], F: [60, 184], kb: [1, 1], eb: [-1, -1], fa: 0 },
    B: { h: [104, 140], t: 34, H: [90, 185], F: [60, 184], kb: [1, 1], eb: [-1, -1], fa: 0 },
  },
  bridge1: {
    props: [['ground', 190]], sup: true,
    A: { h: [100, 176], t: 0, H: [90, 185], F: [[60, 184], [39, 115]], kb: [1, 1], eb: [-1, -1], fa: 0 },
    B: { h: [104, 140], t: 34, H: [90, 185], F: [[60, 184], [33, 92]], kb: [1, 1], eb: [-1, -1], fa: 0 },
  },
  goodmorning: {
    props: [['ground', 190], ['band2', 'an0', 'sh']],
    A: { ...STAND, H: [160, 34], eb: [1, 1] },
    B: { h: [128, 104], t: -12, H: [190, 84], F: [150, 184], fa: 12 },
  },
  hamcurl: {
    props: [['ground', 190], ['box', 88, 130, 76, 60], ['post', 276, 158, 190], ['band', 276, 176, 'an0']],
    A: { h: [128, 124], t: -95, H: [100, 128], F: [214, 150], fa: 0, eb: [-1, -1] },
    B: { h: [128, 124], t: -95, H: [100, 128], F: [162, 178], fa: 40, eb: [-1, -1] },
  },
  // Prostowanie ramion na wyciągu: twarzą do maszyny, łokcie przy bokach i nieruchome, przedramię zatacza łuk wokół łokcia.
  // Linka nie zmienia długości: gdy dłonie idą w dół, część płytek stosu jedzie do góry.
  pushdown: {
    props: [['ground', 190], ['cable', 194, -26, 226, 190]],
    A: { h: [150, 98], t: -84, E: [154, 70], ea: -32, F: [150, 184], fa: 12 },
    B: { h: [150, 98], t: -84, E: [154, 70], ea: 78, F: [150, 184], fa: 12 },
  },
  calf: {
    props: [['ground', 190], ['band2', 'an0', 'sh']],
    A: { ...STAND, H: [158, 40] },
    B: { ...STAND, h: [150, 86], H: [158, 28], F: [150, 172], fa: 62 },
  },
};

// Ćwiczenie → [ruch, tempo]; 'neg' = powolne opuszczanie z napięciem przez cały ruch w dół, 'band' = guma od drążka do stóp.
const EX_MOVE = {
  'podciaganie': ['pullup'], 'podciaganie-podchwyt': ['chinup'], 'podciaganie-guma': ['pullup', 'band'], 'podciaganie-negatyw': ['pullup', 'neg'],
  'podciaganie-lopatek': ['scap'], 'zwis': ['hang'], 'trx-wioslowanie': ['row'], 'wioslowanie-australijskie': ['invrow'],
  'dipy': ['dip'], 'dipy-negatyw': ['dip', 'neg'], 'podpor-porecze': ['support'],
  'pompki': ['pushup'], 'pompki-waskie': ['pushup'], 'pompki-trx': ['trxpush'], 'pompki-nogi-wyzej': ['declpush'], 'pompki-na-podwyzszeniu': ['inclpush'],
  'guma-rozciaganie': ['pullapart'], 'guma-odwrotne-rozpietki': ['pullapart'], 'guma-rotacja': ['extrot'],
  'kolana-porecze': ['kneebars'], 'kolana-zwis': ['kneehang'], 'plank': ['plank'], 'deska-bokiem': ['sideplank'],
  'trx-rollout': ['rollout'], 'trx-kolana': ['trxknees'], 'dead-bug': ['deadbug'],
  'przysiad': ['squat'], 'przysiad-guma': ['bandsquat'], 'trx-przysiad-wykroczny': ['trxsplit'], 'przysiad-jednonoz': ['boxpistol'],
  'wykroki': ['lunge'], 'mostek': ['bridge'], 'mostek-jednonoz': ['bridge1'], 'guma-sklon': ['goodmorning'],
  'guma-uginanie-nog': ['hamcurl'], 'lydki-guma': ['calf'], 'wyciag-prostowanie': ['pushdown'],
};
// Czy ruch używa gumy / innego sprzętu (do legendy pod animacją).
const moveGear = id => {
  const [k, t] = EX_MOVE[id] || [], props = MOVES[k]?.props || [];
  return { band: t === 'band' || props.some(p => p[0] === 'band' || p[0] === 'band2'), tool: props.some(p => !['ground', 'band', 'band2'].includes(p[0])) };
};

// --- Sylwetka: każdy odcinek ciała to kształt z profilu szerokości, mięśnie to plamy dopasowane do konturu.
// Profile w widoku z boku. Tułów: przód = brzuch/klatka, tył = plecy/pośladki. Kończyny: przód = biceps/czworogłowy.
const PROF_SIDE = {
  torso: [[-.2, 4, 6], [-.12, 9, 11.6], [0, 11, 14], [.15, 11.4, 13], [.35, 10.4, 10], [.6, 12, 11], [.8, 14.6, 12.6], [.95, 12, 12], [1.06, 8, 9]],
  neck: [[-.2, 5.2, 5.2], [1.1, 4.6, 4.6]],
  ua: [[-.24, 2.6, 2.8], [-.16, 5.6, 6], [-.04, 7.6, 8], [.25, 7.1, 7.6], [.55, 6.6, 6.8], [.9, 4.7, 4.9], [1.08, 3.7, 3.7]],
  fa: [[-.08, 4.4, 4.4], [0, 5.4, 5.6], [.22, 5.8, 5.6], [.7, 3.9, 3.8], [1, 3, 3], [1.06, 2.7, 2.7]],
  hand: [[-.1, 3, 3], [.35, 4, 3.8], [1, 3, 2.6], [1.1, 2, 2]],
  th: [[-.1, 7, 7], [0, 9.6, 10], [.3, 9.6, 8.8], [.7, 7.6, 7], [.95, 5.7, 5.5], [1.06, 4.8, 4.8]],
  sh: [[-.06, 5, 5], [0, 5.4, 5.6], [.25, 5, 7.8], [.5, 4.3, 6.2], [.85, 3.2, 3.4], [1.04, 3, 3]],
  ft: [[-.42, 3, 3], [-.26, 4, 4], [.3, 3.6, 3.2], [1, 2.3, 1.8], [1.12, 1.4, 1.4]],
};
// Widok od przodu: profile symetryczne; tułów rozszerza się w barkach i najszerszych (sylwetka litery V).
const PROF_FRONT = {
  torso: [[-.24, 5, 5], [-.16, 12, 12], [-.04, 16, 16], [.14, 15.6, 15.6], [.36, 13.4, 13.4], [.62, 16.6, 16.6], [.82, 20, 20], [.96, 21, 21], [1.05, 16, 16]],
  neck: [[-.2, 6, 6], [1.1, 5, 5]],
  ua: [[-.26, 3, 3], [-.16, 6.8, 6.8], [-.02, 8.2, 8.2], [.3, 7, 7], [.62, 6.2, 6.2], [.95, 4.8, 4.8], [1.08, 3.8, 3.8]],
  fa: [[-.08, 4.6, 4.6], [0, 5.6, 5.6], [.22, 6, 6], [.7, 4, 4], [1, 3.2, 3.2], [1.06, 2.9, 2.9]],
  hand: [[-.1, 3.4, 3.4], [.4, 4.4, 4.4], [1, 3.4, 3.4], [1.1, 2.4, 2.4]],
  th: [[-.06, 8.4, 8.4], [0, 10, 9.6], [.35, 9.2, 8.8], [.75, 7, 7], [1, 5.4, 5.4], [1.06, 5, 5]],
  sh: [[-.04, 5.2, 5.2], [.25, 6.2, 6.2], [.6, 4.4, 4.4], [1, 3.2, 3.2], [1.04, 3, 3]],
  ft: [[-.2, 3.4, 3.4], [1, 3.8, 3.8], [1.1, 2.8, 2.8]],
};
// Linie podziału mięśni (cienka kreska): [t0, t1, przesunięcie jako ułamek szerokości, + przód].
// Sylwetka kobieca (ankieta: płeć K): węższe barki i klatka, wcięta talia, szersze biodra, pełniejsze pośladki i uda, smuklejsze ręce.
const PROF_SIDE_K = { ...PROF_SIDE,
  torso: [[-.2, 4.4, 7], [-.12, 9.6, 13], [0, 11.4, 15.4], [.15, 11.2, 13.4], [.36, 9.4, 9], [.6, 10.6, 9.8], [.78, 13.6, 11], [.95, 10.6, 10.6], [1.06, 7.4, 8.4]],
  neck: [[-.2, 4.6, 4.6], [1.1, 4, 4]],
  ua: [[-.24, 2.4, 2.6], [-.16, 5, 5.4], [-.04, 6.6, 7], [.25, 6.2, 6.6], [.55, 5.6, 5.8], [.9, 4.2, 4.4], [1.08, 3.4, 3.4]],
  fa: [[-.08, 4, 4], [0, 4.8, 5], [.22, 5, 4.9], [.7, 3.4, 3.3], [1, 2.7, 2.7], [1.06, 2.4, 2.4]],
  th: [[-.1, 7.6, 7.6], [0, 10, 10.8], [.3, 9.6, 9.2], [.7, 7.4, 6.8], [.95, 5.4, 5.2], [1.06, 4.6, 4.6]],
};
const PROF_FRONT_K = { ...PROF_FRONT,
  torso: [[-.24, 6, 6], [-.16, 14, 14], [-.04, 18, 18], [.14, 16.4, 16.4], [.38, 12.2, 12.2], [.62, 14.2, 14.2], [.82, 16.4, 16.4], [.96, 17.4, 17.4], [1.05, 13.6, 13.6]],
  neck: [[-.2, 5.2, 5.2], [1.1, 4.4, 4.4]],
  ua: [[-.26, 2.8, 2.8], [-.16, 6, 6], [-.02, 7.2, 7.2], [.3, 6.2, 6.2], [.62, 5.4, 5.4], [.95, 4.2, 4.2], [1.08, 3.4, 3.4]],
  th: [[-.06, 9.4, 9.4], [0, 10.8, 10.2], [.35, 9.6, 9.2], [.75, 7, 7], [1, 5.2, 5.2], [1.06, 4.8, 4.8]],
};
// Płeć postaci w animacjach: 'M' albo 'K' (ustawia aplikacja z ankiety przez setSex).
let SEX = 'M';
const DET_SIDE = { ua: [[.3, .86, 0]], th: [[.1, .82, .25]], sh: [[.1, .52, -.15]], fa: [[.1, .6, .1]] };
const DET_FRONT = { th: [[.5, .82, -.4]], sh: [[.15, .45, 0]] };
// Mięśnie: [odcinek, t0, t1, strona ('f' przód, 'b' tył, 'c' środek, 'l'/'r' boki od przodu), od, do (ułamek szerokości)].
const AMUS_SIDE = {
  chest: [['torso', .66, .97, 'f', .2, .95]], abs: [['torso', .1, .62, 'f', .25, .95]], obliques: [['torso', .12, .55, 'f', -.2, .3]],
  lats: [['torso', .36, .86, 'b', .1, .95]], midback: [['torso', .6, .9, 'b', .35, .95]], traps: [['torso', .86, 1.08, 'b', .1, .95], ['neck', -.1, .8, 'b', 0, .95]],
  lowerback: [['torso', .04, .34, 'b', .3, .9]], glutes: [['torso', -.14, .2, 'b', .05, .98]],
  shoulders: [['ua', -.12, .36, 'c', -.95, .95]], biceps: [['ua', .2, .88, 'f', -.1, .9]], triceps: [['ua', .1, .88, 'b', -.05, .92]],
  forearms: [['fa', .02, .65, 'c', -.9, .9]],
  quads: [['th', .06, .88, 'f', -.1, .92]], hamstrings: [['th', .12, .88, 'b', -.05, .92]], adductors: [['th', .1, .55, 'c', -.3, .3]],
  calves: [['sh', .08, .62, 'b', -.05, .95]],
};
const AMUS_FRONT = {
  chest: [['torso', .72, .97, 'l', .08, .82], ['torso', .72, .97, 'r', .08, .82]], abs: [['torso', .12, .64, 'c', -.36, .36]],
  obliques: [['torso', .1, .5, 'l', .45, .85], ['torso', .1, .5, 'r', .45, .85]], lats: [['torso', .36, .9, 'l', .62, .97], ['torso', .36, .9, 'r', .62, .97]],
  midback: [['torso', .62, .92, 'l', .1, .6], ['torso', .62, .92, 'r', .1, .6]], traps: [['neck', -.2, .9, 'c', -.95, .95]],
  lowerback: [['torso', .04, .32, 'c', -.3, .3]], glutes: [['torso', -.1, .14, 'l', .3, .9], ['torso', -.1, .14, 'r', .3, .9]],
  shoulders: [['ua', -.14, .32, 'c', -.97, .97]], biceps: [['ua', .25, .9, 'c', -.6, .6]], triceps: [['ua', .2, .9, 'c', -.6, .6]],
  forearms: [['fa', .02, .65, 'c', -.85, .85]],
  quads: [['th', .06, .88, 'c', -.75, .75]], hamstrings: [['th', .12, .88, 'c', -.6, .6]], adductors: [['th', .08, .55, 'c', -.9, -.3]],
  calves: [['sh', .06, .6, 'c', -.85, .85]],
};

// Nogi i tułów w jednej warstwie: najpierw wszystkie obrysy, potem wypełnienia, więc biodro zlewa się z udem w jeden kontur.
// Widok od tyłu (back: true): ta sama geometria co od przodu, inne mięśnie i rysy.
const AMUS_BACK = {
  lats: [['torso', .34, .88, 'l', .45, .98], ['torso', .34, .88, 'r', .45, .98]], midback: [['torso', .6, .9, 'l', .08, .48], ['torso', .6, .9, 'r', .08, .48]],
  traps: [['torso', .86, 1.04, 'c', -.5, .5], ['neck', -.2, .9, 'c', -.95, .95]], lowerback: [['torso', .04, .36, 'l', .06, .34], ['torso', .04, .36, 'r', .06, .34]],
  glutes: [['torso', -.16, .1, 'l', .1, .92], ['torso', -.16, .1, 'r', .1, .92]], shoulders: [['ua', -.16, .3, 'c', -.97, .97]],
  triceps: [['ua', .2, .9, 'c', -.6, .6]], biceps: [['ua', .3, .85, 'c', -.35, .35]], forearms: [['fa', .02, .65, 'c', -.85, .85]],
  hamstrings: [['th', .14, .88, 'c', -.75, .75]], calves: [['sh', .06, .6, 'c', -.9, .9]], adductors: [['th', .08, .5, 'c', -.9, -.35]],
};
const ANAT_LAYERS_SIDE = [
  ['far', [['ua', 's1', 'el1'], ['fa', 'el1', 'wr1'], ['hand', 'wr1', 'hn1'], ['th', 'h1', 'kn1'], ['sh', 'kn1', 'an1'], ['ft', 'an1', 'to1']]],
  ['body', [['th', 'h0', 'kn0'], ['sh', 'kn0', 'an0'], ['ft', 'an0', 'to0'], ['torso', 'hip', 'sh'], ['neck', 'sh', 'nk']]],
  ['arm', [['ua', 's0', 'el0'], ['fa', 'el0', 'wr0'], ['hand', 'wr0', 'hn0']]],
];
const ANAT_LAYERS_FRONT = [
  ['body', [['th', 'h0', 'kn0'], ['sh', 'kn0', 'an0'], ['ft', 'an0', 'to0'], ['th', 'h1', 'kn1'], ['sh', 'kn1', 'an1'], ['ft', 'an1', 'to1'], ['torso', 'hip', 'sh'], ['neck', 'sh', 'nk']]],
  ['arm', [['ua', 's0', 'el0'], ['fa', 'el0', 'wr0'], ['ua', 's1', 'el1'], ['fa', 'el1', 'wr1'], ['hand', 'wr0', 'hn0'], ['hand', 'wr1', 'hn1']]],
];

// Głowa (lokalnie: x w stronę twarzy, y w dół, 0,0 = środek głowy). Czaszka to łuk okręgu, żeby czubek był okrągły.
const arc = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => { const t = (a0 + (a1 - a0) * k / n) * Math.PI / 180; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });
// Z boku: czaszka od potylicy przez czubek do czoła, potem nos, usta, broda i żuchwa.
const HEAD_SIDE = [...arc(-.6, -1.2, 10, 10, 150, 340, 12), [9.6, -1.6], [11.2, 1.6], [9.4, 3.4], [9.6, 5.6], [8.4, 9.2], [4.4, 10.6], [.6, 8.6]];
// Od przodu: owal czaszki, uszy po bokach, żuchwa zwężona do brody.
// Włosy (tylko K): z boku kok z tyłu głowy, od przodu i od tyłu objętość nad czaszką, od tyłu jeszcze kucyk.
const HAIR_BUN = arc(-9.6, -7.4, 4.8, 4.8, 0, 360, 12).slice(0, -1);
const HAIR_CAP = [...arc(0, -1.6, 10.6, 11.8, 165, 375, 14), ...arc(0, -1.4, 8.4, 9.2, 15, -195, 14)];
const HAIR_TAIL = [[-3.4, -3], [3.4, -3], [3, 6], [1.4, 14], [0, 16], [-1.4, 14], [-3, 6]];
const HEAD_FRONT = [...arc(0, -1.4, 9, 10, 180, 360, 12), [9.6, 1], [8.4, 3.4], [7.4, 7], [3.6, 10.8], [0, 11.6], [-3.6, 10.8], [-7.4, 7], [-8.4, 3.4], [-9.6, 1]];
// Interpolacja profilu w punkcie t.
function profAt(prof, t) {
  if (t <= prof[0][0]) return prof[0];
  for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) {
    const [a, b] = [prof[i - 1], prof[i]], k = (t - a[0]) / (b[0] - a[0]);
    return [t, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  return prof[prof.length - 1];
}
// Gładka zamknięta krzywa przez punkty (Catmull-Rom → Bezier).
function smooth(pts) {
  const n = pts.length, P = i => pts[(i + n) % n];
  let d = `M${P(0)[0].toFixed(2)},${P(0)[1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}
// Układ odcinka: punkt na osi w t, przesunięty o off w stronę „przodu” (fs = znak przodu względem normalnej).
function frame(A, B) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
  return (t, off) => [A[0] + dx * t + (-dy / L) * off, A[1] + dy * t + (dx / L) * off];
}
// Strona przodu: tułów ma przód po +normalnej (widok twarzą w prawo); kończyny skierowane w dół po -normalnej.
const frontSign = (type, sup) => (type === 'torso' || type === 'neck' ? 1 : -1) * (sup ? -1 : 1);

function segPath(prof, A, B, fs) {
  const f = frame(A, B), N = 14, t0 = prof[0][0], t1 = prof[prof.length - 1][0], L = [], R = [];
  for (let i = 0; i <= N; i++) { const t = t0 + (t1 - t0) * i / N, w = profAt(prof, t); L.push(f(t, fs * w[1])); R.push(f(t, -fs * w[2])); }
  return smooth([...L, ...R.reverse()]);
}
function musPath(prof, A, B, fs, spec) {
  const [, t0, t1, side, o, i] = spec, f = frame(A, B), N = 10, E1 = [], E2 = [];
  for (let k = 0; k <= N; k++) {
    const t = t0 + (t1 - t0) * k / N, w = profAt(prof, t), taper = Math.sin(Math.PI * k / N) ** .6;
    // Szerokość po stronie mięśnia: przód, tył, albo środek (od -tył do +przód).
    const off = x => side === 'f' ? fs * w[1] * x : side === 'b' ? -fs * w[2] * x : side === 'l' ? -w[2] * x : side === 'r' ? w[1] * x : fs * (x < 0 ? w[2] : w[1]) * x;
    const a = off(o), b = off(i), mid = (a + b) / 2;
    E1.push(f(t, mid + (a - mid) * taper)); E2.push(f(t, mid + (b - mid) * taper));
  }
  return smooth([...E1, ...E2.reverse()]);
}


const rad = d => d * Math.PI / 180;
const at = (p, a, l) => [p[0] + l * Math.cos(rad(a)), p[1] + l * Math.sin(rad(a))];
const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
// Dwuczłonowa kinematyka odwrotna: staw pośredni i koniec kończyny.
function ik(root, target, a, b, bend) {
  let d = Math.hypot(target[0] - root[0], target[1] - root[1]);
  d = Math.min(Math.max(d, Math.abs(a - b) + .01), a + b - .01);
  const off = Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d)))) * 180 / Math.PI;
  const j = at(root, ang(root, target) + bend * off, a);
  return [j, at(j, ang(j, target), b)];
}
const pair = v => Array.isArray(v[0]) ? v : [v, v];
function norm(P, front) {
  const two = (v, d) => Array.isArray(v) ? v : [v ?? d[0], v ?? d[1]];
  return { h: P.h, t: P.t ?? -90, E: P.E, ea: P.ea, H: P.H && pair(P.H), a: P.a == null ? null : two(P.a), F: pair(P.F), fa: two(P.fa, front ? [75, 105] : [12, 12]),
    s: P.s || [[1, 1], [1, 1]], eb: P.eb || (front ? [1, -1] : [1, 1]), kb: P.kb || (front ? [-1, 1] : [-1, -1]) };
}
const lerp = (a, b, p) => typeof a === 'number' ? a + (b - a) * p : a.map((x, i) => lerp(x, b[i], p));

// Stawy dla pozy pośredniej p (0 = A, 1 = B).
function joints(m, p) {
  const A = m.nA, B = m.nB, mix = k => A[k] && lerp(A[k], B[k], p);
  const P = { t: lerp(A.t, B.t, p), E: mix('E'), ea: mix('ea'), H: mix('H'), a: mix('a'), F: lerp(A.F, B.F, p), fa: lerp(A.fa, B.fa, p), s: lerp(A.s, B.s, p) };
  // Poza bez h: ciało proste od kostek do barków (deska, pompka, wiosłowanie). Biodro idzie wtedy po łuku i kolana się nie uginają.
  P.h = mix('h') || at(P.F[0], P.t, SEG.th + SEG.sh);
  const J = { hip: P.h, sh: at(P.h, P.t, SEG.torso) };
  J.hd = at(J.sh, P.t, SEG.neck + SEG.head);
  J.nk = at(J.sh, P.t, SEG.neck);
  J.hb = at(J.hip, P.t + (m.sup ? 90 : -90), 6); // tył bioder (pośladki w widoku z boku)
  for (const i of [0, 1]) {
    const side = m.front ? (i ? -1 : 1) : 0; // od przodu barki i biodra rozchodzą się na boki
    J['s' + i] = at(J.sh, P.t + 90, side * HALF.shoulder);
    J['h' + i] = at(J.hip, P.t + 90, side * HALF.hip);
    // Poza z a: ręka prosta pod kątem a (zatacza łuk wokół barku). Poza z H: dłoń w punkcie H, łokieć liczy kinematyka odwrotna.
    if (P.E) { J['el' + i] = P.E; J['wr' + i] = at(P.E, P.ea, SEG.fa); }
    else if (P.a) { J['el' + i] = at(J['s' + i], P.a[i], SEG.ua * P.s[i][0]); J['wr' + i] = at(J['el' + i], P.a[i], SEG.fa * P.s[i][1]); }
    else [J['el' + i], J['wr' + i]] = ik(J['s' + i], P.H[i], SEG.ua * P.s[i][0], SEG.fa * P.s[i][1], A.eb[i]);
    [J['kn' + i], J['an' + i]] = ik(J['h' + i], P.F[i], SEG.th, SEG.sh, A.kb[i]);
    J['to' + i] = at(J['an' + i], P.fa[i], SEG.ft);
  }
  return J;
}

// Postać w warstwach (od najdalszej): w jednej warstwie najpierw wszystkie obrysy, potem wypełnienia, więc stawy zlewają się w jeden kontur.
// Zwraca draw(J, act): J = stawy, act = spięcie 0–1 (krycie mięśni).
function moveFigure(svg, m, e, mk, groundY) {
  const K = SEX === 'K', front = !!m.front, PROF = front ? (K ? PROF_FRONT_K : PROF_FRONT) : (K ? PROF_SIDE_K : PROF_SIDE), DET = front ? DET_FRONT : DET_SIDE;
  const hairBack = K ? (front ? HAIR_CAP : HAIR_BUN) : null, hairTop = K && m.back ? HAIR_TAIL : null;
  const AM = m.back ? AMUS_BACK : front ? AMUS_FRONT : AMUS_SIDE, layers = front ? ANAT_LAYERS_FRONT : ANAT_LAYERS_SIDE;
  const lvl = mm => e?.p.includes(mm) ? 'p' : e?.s.includes(mm) ? 's' : null;
  const parts = [], muscles = [], groups = [], heads = [], lines = [];
  let detail, edges;
  for (const [name, list] of layers) {
    const g = mk('g', { class: 'an-' + name });
    const outl = list.map(() => mk('path', { class: 'ao' }, g));
    if (name === 'body' && hairBack) heads.push([mk('path', { class: 'aho' }, g), 1.6, hairBack], [mk('path', { class: 'ahf' }, g), 0, hairBack]);
    if (name === 'body') heads.push([mk('path', { class: 'aho' }, g), 1.6]);
    const fill = list.map(() => mk('path', { class: 'af' }, g));
    if (name === 'body') heads.push([mk('path', { class: 'ahf' }, g), 0]);
    if (name === 'body' && hairTop) heads.push([mk('path', { class: 'aho' }, g), 1.6, hairTop], [mk('path', { class: 'ahf' }, g), 0, hairTop]);
    list.forEach((s, k) => parts.push([outl[k], fill[k], s]));
    lines.push([mk('path', { class: 'ad' }, g), list.filter(s => DET[s[0]])]);
    // Z boku udo bliższej nogi bywa przed tułowiem (unoszenie kolan, przysiad): jego brzegi rysujemy jeszcze raz nad wypełnieniem.
    if (name === 'body' && !front) edges = [mk('path', { class: 'ae' }, g), list.find(s => s[0] === 'th')];
    const gp = mk('g', {}, g), gs = mk('g', {}, g);
    groups.push([gp, 'p'], [gs, 's']);
    for (const [mm, specs] of Object.entries(AM)) {
      const l = lvl(mm); if (!l) continue;
      for (const spec of specs) for (const s of list.filter(s => s[0] === spec[0])) muscles.push([mk('path', { class: 'am' }, l === 'p' ? gp : gs), s, spec]);
    }
    if (name === 'body') detail = mk('path', { class: 'ad' }, g);
  }
  const fsOf = s => frontSign(s[0], m.sup), P = q => q.map(v => v.toFixed(1)).join(',');
  return function draw(J, act) {
    // Dłoń przedłuża przedramię; dłoń oparta o ziemię leży płasko.
    for (const i of [0, 1]) {
      const w = J['wr' + i], el = J['el' + i];
      J['hn' + i] = at(w, groundY != null && w[1] > groundY - 10 ? (w[0] >= el[0] ? 0 : 180) : ang(el, w), 8);
    }
    const pos = s => [J[s[1]], s[0] === 'neck' ? J.hd : J[s[2]]];
    for (const [o, f, s] of parts) { const [A, B] = pos(s), d = segPath(PROF[s[0]], A, B, fsOf(s)); o.setAttribute('d', d); f.setAttribute('d', d); }
    // Głowa: oś od barków przez środek głowy, twarz po stronie przodu.
    const up = rad(ang(J.sh, J.hd)), fs = frontSign('torso', m.sup), fx = [-Math.sin(up) * fs, Math.cos(up) * fs], dy = [-Math.cos(up), -Math.sin(up)];
    for (const [h, grow, shape] of heads) {
      const k = 1 + grow / 11;
      h.setAttribute('d', smooth((shape || (front ? HEAD_FRONT : HEAD_SIDE)).map(([x, y]) => [J.hd[0] + (x * fx[0] + y * dy[0]) * k, J.hd[1] + (x * fx[1] + y * dy[1]) * k])));
    }
    for (const [el, list] of lines) el.setAttribute('d', list.map(s => {
      const [A, B] = pos(s), f = frame(A, B), sg = fsOf(s);
      return DET[s[0]].map(([t0, t1, o]) => 'M' + Array.from({ length: 7 }, (_, k) => {
        const t = t0 + (t1 - t0) * k / 6, w = profAt(PROF[s[0]], t);
        return P(f(t, sg * o * (o > 0 ? w[1] : w[2])));
      }).join('L')).join('');
    }).join(''));
    if (edges) {
      const [el, s] = edges, [A, B] = pos(s), f = frame(A, B), sg = fsOf(s), q = side => Array.from({ length: 9 }, (_, k) => {
        const t = .3 + .7 * k / 8, w = profAt(PROF.th, t);
        return P(f(t, side * sg * ((side > 0 ? w[1] : w[2]) + .75)));
      }).join('L');
      el.setAttribute('d', 'M' + q(1) + 'M' + q(-1));
    }
    for (const [el, s, spec] of muscles) { const [A, B] = pos(s); el.setAttribute('d', musPath(PROF[s[0]], A, B, fsOf(s), spec)); }
    for (const [g, l] of groups) g.setAttribute('opacity', (l === 'p' ? .45 + .55 * act : .2 + .4 * act).toFixed(3));
    // Rysy: kręgosłup i łopatki od tyłu, mostek, łuki klatki i kratka brzucha od przodu, dolny brzeg klatki z boku.
    const f = frame(J.hip, J.sh);
    let d = '';
    if (m.back) {
      d += 'M' + P(f(.12, 0)) + 'L' + P(f(.98, 0));
      for (const g of [1, -1]) d += 'M' + P(f(.9, g * 5)) + 'Q' + P(f(.72, g * 6)) + ' ' + P(f(.62, g * 13));
    } else if (front) {
      d += 'M' + P(f(.18, 0)) + 'L' + P(f(.92, 0));
      for (const g of [1, -1]) d += 'M' + P(f(.94, g * 2)) + 'Q' + P(f(.68, g * 9)) + ' ' + P(f(.78, g * 16));
      for (const t of [.3, .42, .54]) d += 'M' + P(f(t, -5)) + 'L' + P(f(t, 5));
    } else d += 'M' + P(f(.94, fs * 4)) + 'Q' + P(f(.7, fs * 10)) + ' ' + P(f(.68, fs * 4));
    detail.setAttribute('d', d);
  };
}

// fixed = [szer., wys.] wspólnego kadru (miniatury w tej samej skali); bez niego kadr dopasowany do ruchu.
function mountMove(svg, fixed) {
  const [key, tempo] = EX_MOVE[svg.dataset.ex] || [], m = MOVES[key];
  if (!m) return false;
  m.nA ??= norm(m.A, m.front); m.nB ??= norm(m.B, m.front);
  const e = EXERCISES[svg.dataset.ex], NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent = svg) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; };

  // Kadr: obejmuje obie pozy i rekwizyty; ruchy pionowe w kwadracie, reszta 3:2.
  // Zaczep taśmy TRX jest daleko, więc do kadru się nie liczy: taśma wychodzi poza kadr, a postać zostaje duża.
  const pts = [];
  for (const p of [0, .5, 1]) { const J = joints(m, p); for (const k in J) pts.push(J[k]); }
  for (const pr of m.props) {
    if (pr[0] === 'hbar') pts.push([pr[1], pr[3]], [pr[2], pr[3]]);
    else if (pr[0] === 'post') pts.push([pr[1], pr[2]], [pr[1], pr[3]]);
    else if (pr[0] === 'cable') pts.push([pr[1] - 8, pr[2] - 10], [pr[3] + 22, pr[4]]);
    else if (typeof pr[1] === 'number' && pr[0] !== 'ground' && pr[0] !== 'strap') {
      pts.push([pr[1], pr[2]]);
      if (pr[0] === 'box') pts.push([pr[1] + pr[3], pr[2] + pr[4]]);
      if (pr[0] === 'pbar') pts.push([pr[1] - 46, pr[2]], [pr[1] + 46, pr[2]]);
    }
  }
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  let x0 = Math.min(...xs) - 20, x1 = Math.max(...xs) + 20, y0 = Math.min(...ys) - 22, y1 = Math.max(...ys) + 12;
  const ground = m.props.find(pr => pr[0] === 'ground');
  if (ground) y1 = Math.max(y1, ground[1] + 8);
  const w = x1 - x0, h = y1 - y0, r = h > w ? 1 : 1.5;
  if (fixed) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; [x0, x1, y0, y1] = [cx - fixed[0] / 2, cx + fixed[0] / 2, cy - fixed[1] / 2, cy + fixed[1] / 2]; }
  else {
    if (w / h > r) { const d = w / r - h; y0 -= d / 2; y1 += d / 2; } else { const d = h * r - w; x0 -= d / 2; x1 += d / 2; }
    svg.style.aspectRatio = r === 1 ? '1' : '3 / 2';
  }
  svg.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);

  // Rekwizyty stałe pod postacią.
  let cable;
  for (const pr of m.props) {
    if (pr[0] === 'ground') mk('line', { x1: x0, x2: x1, y1: pr[1], y2: pr[1], class: 'gr' });
    // Poręcze do dipów biegną wzdłuż kierunku patrzenia, więc z boku to belka na dwóch słupkach.
    if (pr[0] === 'pbar') { for (const x of [pr[1] - 40, pr[1] + 40]) mk('line', { x1: x, x2: x, y1: pr[2], y2: pr[3], class: 'pp' }); mk('line', { x1: pr[1] - 46, x2: pr[1] + 46, y1: pr[2], y2: pr[2], class: 'pbl' }); }
    if (pr[0] === 'box') mk('rect', { x: pr[1], y: pr[2], width: pr[3], height: pr[4], rx: 5, class: 'px' });
    // Słupek: stojak niskiego drążka albo miejsce zaczepienia gumy.
    if (pr[0] === 'post') mk('line', { x1: pr[1], x2: pr[1], y1: pr[2], y2: pr[3], class: 'pp' });
    // Drążek stoi na dwóch słupach, które schodzą poza dół kadru.
    if (pr[0] === 'hbar') for (const x of [pr[1] + 6, pr[2] - 6]) mk('line', { x1: x, x2: x, y1: pr[3] - 8, y2: pr[3] + 600, class: 'pq' });
    // Wyciąg: rama z dwóch słupów, belka, dwa bloczki i stos płytek; linka z uchwytem i ruchome płytki w draw.
    if (pr[0] === 'cable') {
      const [, px, py, rx, base] = pr;
      mk('path', { class: 'pq', d: `M${rx - 16} ${base}V${py - 8}M${rx + 16} ${base}V${py - 8}M${px - 8} ${py - 8}H${rx + 22}M${rx - 22} ${base}H${rx + 24}` });
      for (const x of [px, rx]) mk('circle', { cx: x, cy: py, r: 5, class: 'pw' });
      cable = { px, py, rx, base, plates: Array.from({ length: 9 }, () => mk('rect', { x: rx - 12, width: 24, height: 6.4, rx: 1.2, class: 'pt' })) };
    }
  }

  const fig = moveFigure(svg, m, e, mk, ground?.[1]);
  // Sprzęt trzymany w dłoniach i gumy rysowane nad postacią, żeby były widoczne.
  const dyn = [];
  for (const pr of m.props) {
    if (pr[0] === 'bar') mk('circle', { cx: pr[1], cy: pr[2], r: 4.5, class: 'pb' });
    if (pr[0] === 'hbar') mk('line', { x1: pr[1], x2: pr[2], y1: pr[3], y2: pr[3], class: 'pbl' });
    if (pr[0] === 'strap' || pr[0] === 'band') dyn.push([mk('line', { class: pr[0] === 'strap' ? 'ps' : 'pg' }), [pr[1], pr[2]], pr[3]]);
    if (pr[0] === 'band2') dyn.push([mk('line', { class: 'pg' }), pr[1], pr[2]]);
  }
  if (tempo === 'band') for (const foot of ['an0', 'an1']) dyn.push([mk('line', { class: 'pg' }), [150, 16], foot]);
  if (cable) Object.assign(cable, { rod: mk('line', { class: 'pc' }), line: mk('path', { class: 'pc' }), handle: mk('line', { class: 'pbl', 'stroke-width': 2.6 }) });
  const grip = J => at(J.wr0, ang(J.el0, J.wr0), 4);
  const L0 = cable && Math.hypot(grip(joints(m, 0))[0] - cable.px, grip(joints(m, 0))[1] - cable.py);

  const still = JSON.stringify(m.A) === JSON.stringify(m.B);
  const T = tempo === 'neg' ? [.8, .4, 3, .6] : [1.2, .5, 1.2, .5];
  const ease = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;

  return function draw(ms) {
    const total = T[0] + T[1] + T[2] + T[3]; let x = ms / 1000 % total, p, act;
    if (x < T[0]) p = act = ease(x / T[0]);
    else if ((x -= T[0]) < T[1]) p = act = 1;
    else if ((x -= T[1]) < T[2]) { p = 1 - ease(x / T[2]); act = tempo === 'neg' ? .9 : p; }
    else p = act = 0;
    if (still) { p = 0; act = .78 + .22 * Math.sin(ms / 1000 * Math.PI); }
    const J = joints(m, p);
    fig(J, act);
    for (const [el, a, b] of dyn) {
      const A = typeof a === 'string' ? J[a] : a, B = typeof b === 'string' ? J[b] : b;
      el.setAttribute('x1', A[0]); el.setAttribute('y1', A[1]); el.setAttribute('x2', B[0]); el.setAttribute('y2', B[1]);
    }
    if (cable) {
      // Linka ma stałą długość: o ile dłonie odjadą od bloczka, o tyle podnosi się górna część stosu.
      const { px, py, rx, base, plates, rod, line, handle } = cable, G = grip(J), top = base - 69 - (Math.hypot(G[0] - px, G[1] - py) - L0) * .9;
      plates.forEach((r, i) => r.setAttribute('y', i < 5 ? top + i * 7 : base - (9 - i) * 7));
      rod.setAttribute('x1', rx); rod.setAttribute('x2', rx); rod.setAttribute('y1', py); rod.setAttribute('y2', top);
      line.setAttribute('d', `M${G[0]} ${G[1]}L${px - 4.6} ${py + 1}M${px} ${py - 5}L${rx} ${py - 5}`);
      const a = at(G, -6, 6), b = at(G, 174, 6);
      handle.setAttribute('x1', b[0]); handle.setAttribute('y1', b[1]); handle.setAttribute('x2', a[0]); handle.setAttribute('y2', a[1]);
    }
  };
}

// Jedna pętla dla wszystkich widocznych animacji; ukryte i odłączone są pomijane.
const moving = new Map();
function moveFig(id) { return EX_MOVE[id] ? `<svg class="move" data-ex="${id}" role="img" aria-label="Animacja ruchu"></svg>` : ''; }
// Miniatury: jedna klatka w fazie spięcia, bez pętli animacji.
function stillMoves(root) { for (const svg of root.querySelectorAll('svg.move:not([data-on])')) { const d = mountMove(svg, [350, 250]); svg.dataset.on = svg.dataset.still = 1; d && d(1450); } }
// Płeć z ankiety: animacje już na ekranie rysują się od nowa.
function setSex(sex) {
  sex = sex === 'K' ? 'K' : 'M';
  if (sex === SEX) return;
  SEX = sex;
  if (typeof document === 'undefined') return;
  const all = [...document.querySelectorAll('svg.move[data-on]')];
  for (const svg of all) { svg.replaceChildren(); delete svg.dataset.on; moving.delete(svg); }
  for (const svg of all) if (svg.dataset.still) { delete svg.dataset.still; stillMoves(svg.parentNode); }
  mountMoves();
}
function mountMoves(root = document) {
  for (const svg of root.querySelectorAll('svg.move:not([data-on])')) { const d = mountMove(svg); svg.dataset.on = 1; if (d) moving.set(svg, d); }
}
if (typeof requestAnimationFrame !== 'undefined') (function loop(ms) {
  for (const [svg, draw] of moving) { if (!svg.isConnected) moving.delete(svg); else if (svg.getClientRects().length) draw(ms); }
  requestAnimationFrame(loop);
})(0);
if (typeof module !== 'undefined') module.exports = { EX_MOVE, MOVES, SEG, joints, norm, setSex };
