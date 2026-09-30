// Animacje ćwiczeń: postać z obrysów, widok z boku (twarzą w prawo) albo od przodu (front: true).
// Priorytet: ma być dokładnie widać, jak wykonać ćwiczenie. Widok wybieramy tak, żeby ruch leżał w płaszczyźnie obrazu.
// Każdy ruch ma pozę A (luz) i B (spięcie); dłonie i stopy to cele, łokcie i kolana liczy kinematyka odwrotna.
// Pracujące mięśnie (EXERCISES[id].p / .s) czerwienieją przy spięciu i bledną przy rozluźnieniu.
// Poza: h biodra [x,y], t kąt tułowia (°; 0 = w prawo, -90 = w górę), H dłonie, F kostki (jeden punkt albo [prawa/bliższa, lewa/dalsza]),
// fa kąt stóp, eb/kb kierunek zgięcia łokci/kolan (±1), s skrót perspektywiczny ramion [ramię, przedramię], sup = leży na plecach.
// Bez h: ciało proste od kostek (biodro wynika z F i t). a zamiast H: proste ręce pod kątem a (liczba albo [bliższa, dalsza]).
// Taśma TRX się nie rozciąga: w pozie A i B dłoń albo stopa musi być w tej samej odległości od zaczepu (pilnuje tego `node logic.js`).
const SEG = { torso: 58, neck: 7, head: 11, ua: 30, fa: 34, th: 44, sh: 42, ft: 13 };
const WID = { torso: 24, girdle: 13, pelvis: 15, neck: 8, ua: 11, fa: 9, th: 15, sh: 11, ft: 6 };
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
  // Drążek od przodu: pełny zakres, na górze drążek na wysokości szyi, głowa nad drążkiem.
  pullup: { front: true, props: [FBAR], A: FHANG, B: { h: [150, 81], H: FHANG.H, F: [[158, 166], [142, 166]] } },
  // Podchwyt: węższy chwyt, na górze łokcie schodzą w dół wzdłuż tułowia.
  chinup: { front: true, props: [FBAR], A: { ...FHANG, H: FNARROW }, B: { h: [150, 81], H: FNARROW, F: [[158, 166], [142, 166]] } },
  // Podciąganie łopatek: ręce zostają proste, barki schodzą w dół, ciało unosi się o kilka centymetrów.
  scap: { front: true, props: [FBAR], A: FHANG, B: { ...FHANG, h: [150, 134.5], F: [[158, 219.5], [142, 219.5]], s: [[.93, .93], [.93, .93]] } },
  hang: { front: true, props: [FBAR], A: FHANG, B: FHANG },
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
    A: { t: -23, H: [188, 189], F: [52, 182], fa: 40 },
    B: { t: -8, H: [188, 189], F: [52, 182], fa: 40 },
  },
  // Pompki na TRX: tyłem do zaczepu, taśmy biegną zza pleców do dłoni.
  trxpush: {
    props: [['ground', 190], ['strap', 90, -90, 'wr0']],
    A: { t: -50, H: [232, 94], F: [80, 182], fa: 40 },
    B: { t: -35, H: [214, 112], F: [80, 182], fa: 40 },
  },
  declpush: {
    props: [['ground', 190], ['box', 18, 150, 56, 40]],
    A: { t: -9, H: [192, 189], F: [50, 146], fa: 60 },
    B: { t: 5, H: [192, 189], F: [50, 146], fa: 60 },
  },
  inclpush: {
    props: [['ground', 190], ['box', 176, 152, 56, 38]],
    A: { t: -39, H: [198, 152], F: [70, 182], fa: 40 },
    B: { t: -30, H: [198, 152], F: [70, 182], fa: 40 },
  },
  // Guma od przodu: proste ręce z pozycji przed sobą (skrót perspektywiczny) rozchodzą się szeroko na boki, guma się napina.
  pullapart: {
    front: true, props: [['ground', 190], ['band2', 'wr1', 'wr0']],
    A: { ...FSTAND, a: [0, 180], s: [[.3, .3], [.3, .3]] },
    B: { ...FSTAND, a: [0, 180] },
  },
  // Rotacja zewnętrzna od przodu: łokieć przy boku, przedramię obraca się na zewnątrz, guma zaczepiona do słupka z drugiej strony.
  extrot: {
    front: true, props: [['ground', 190], ['post', 64, 36, 190], ['band', 64, 70, 'wr0']],
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
    A: { h: [143, 135], t: -10, H: [200, 189], F: [58, 150], fa: 30 },
    B: { h: [143, 112], t: 13, H: [200, 189], F: [130, 141], fa: 30 },
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
  'guma-uginanie-nog': ['hamcurl'], 'lydki-guma': ['calf'],
};
// Czy ruch używa gumy / innego sprzętu (do legendy pod animacją).
const moveGear = id => {
  const [k, t] = EX_MOVE[id] || [], props = MOVES[k]?.props || [];
  return { band: t === 'band' || props.some(p => p[0] === 'band' || p[0] === 'band2'), tool: props.some(p => !['ground', 'band', 'band2'].includes(p[0])) };
};

// Gdzie leży mięsień: [odcinek, od, do (0–1 wzdłuż), przesunięcie w bok (ułamek szerokości), grubość (ułamek)] albo ['@staw', promień].
// Widok z boku: + to przód ciała, - to tył. Widok od przodu: + to prawa strona obrazu.
const MUS_SIDE = {
  chest: [['torso', .55, .92, .24, .44]], abs: [['torso', .08, .55, .24, .44]], obliques: [['torso', .12, .5, 0, .5]], traps: [['torso', .86, 1, -.24, .44]],
  midback: [['torso', .58, .86, -.24, .44]], lats: [['torso', .3, .74, -.24, .44]], lowerback: [['torso', .04, .32, -.24, .44]],
  biceps: [['ua', .15, .85, .24, .44]], triceps: [['ua', .15, .85, -.24, .44]], forearms: [['fa', .08, .62, 0, .5]],
  quads: [['th', .1, .88, .24, .44]], adductors: [['th', .15, .6, 0, .5]], hamstrings: [['th', .15, .88, -.24, .44]], calves: [['sh', .1, .55, -.24, .44]],
  shoulders: [['@s0', 6.5]], glutes: [['@hb', 8]],
};
const MUS_FRONT = {
  chest: [['torso', .62, .9, .2, .3], ['torso', .62, .9, -.2, .3]], abs: [['torso', .1, .55, 0, .34]],
  obliques: [['torso', .12, .5, .37, .16], ['torso', .12, .5, -.37, .16]], lats: [['torso', .3, .8, .36, .2], ['torso', .3, .8, -.36, .2]],
  midback: [['torso', .58, .9, .14, .22], ['torso', .58, .9, -.14, .22]], traps: [['torso', .9, 1.06, 0, .4]], lowerback: [['torso', .04, .3, 0, .3]],
  biceps: [['ua', .15, .85, 0, .5]], triceps: [['ua', .15, .85, 0, .5]], forearms: [['fa', .08, .62, 0, .5]],
  quads: [['th', .1, .88, 0, .5]], adductors: [['th', .15, .6, 0, .5]], hamstrings: [['th', .15, .88, 0, .5]], calves: [['sh', .1, .55, 0, .5]],
  shoulders: [['@s0', 7], ['@s1', 7]], glutes: [['@h0', 8], ['@h1', 8]],
};
// Warstwy rysowania od najdalszej do najbliższej: [nazwa, odcinki [typ, staw od, staw do]].
const LAYERS_SIDE = [
  ['far', [['ua', 's1', 'el1'], ['fa', 'el1', 'wr1'], ['th', 'h1', 'kn1'], ['sh', 'kn1', 'an1'], ['ft', 'an1', 'to1']]],
  ['core', [['torso', 'hip', 'sh'], ['neck', 'sh', 'nk']]],
  ['leg', [['th', 'h0', 'kn0'], ['sh', 'kn0', 'an0'], ['ft', 'an0', 'to0']]],
  ['arm', [['ua', 's0', 'el0'], ['fa', 'el0', 'wr0']]],
];
const LAYERS_FRONT = [
  ['leg', [['th', 'h0', 'kn0'], ['sh', 'kn0', 'an0'], ['ft', 'an0', 'to0'], ['th', 'h1', 'kn1'], ['sh', 'kn1', 'an1'], ['ft', 'an1', 'to1']]],
  ['core', [['torso', 'hip', 'sh'], ['girdle', 's1', 's0'], ['pelvis', 'h1', 'h0'], ['neck', 'sh', 'nk']]],
  ['arm', [['ua', 's0', 'el0'], ['fa', 'el0', 'wr0'], ['ua', 's1', 'el1'], ['fa', 'el1', 'wr1']]],
];

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
  return { h: P.h, t: P.t ?? -90, H: P.H && pair(P.H), a: P.a == null ? null : two(P.a), F: pair(P.F), fa: two(P.fa, front ? [75, 105] : [12, 12]),
    s: P.s || [[1, 1], [1, 1]], eb: P.eb || (front ? [1, -1] : [1, 1]), kb: P.kb || (front ? [-1, 1] : [-1, -1]) };
}
const lerp = (a, b, p) => typeof a === 'number' ? a + (b - a) * p : a.map((x, i) => lerp(x, b[i], p));

// Stawy dla pozy pośredniej p (0 = A, 1 = B).
function joints(m, p) {
  const A = m.nA, B = m.nB, mix = k => A[k] && lerp(A[k], B[k], p);
  const P = { t: lerp(A.t, B.t, p), H: mix('H'), a: mix('a'), F: lerp(A.F, B.F, p), fa: lerp(A.fa, B.fa, p), s: lerp(A.s, B.s, p) };
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
    if (P.a) { J['el' + i] = at(J['s' + i], P.a[i], SEG.ua * P.s[i][0]); J['wr' + i] = at(J['el' + i], P.a[i], SEG.fa * P.s[i][1]); }
    else [J['el' + i], J['wr' + i]] = ik(J['s' + i], P.H[i], SEG.ua * P.s[i][0], SEG.fa * P.s[i][1], A.eb[i]);
    [J['kn' + i], J['an' + i]] = ik(J['h' + i], P.F[i], SEG.th, SEG.sh, A.kb[i]);
    J['to' + i] = at(J['an' + i], P.fa[i], SEG.ft);
  }
  return J;
}

// fixed = [szer., wys.] wspólnego kadru (miniatury w tej samej skali); bez niego kadr dopasowany do ruchu.
function mountMove(svg, fixed) {
  const [key, tempo] = EX_MOVE[svg.dataset.ex] || [], m = MOVES[key];
  if (!m) return false;
  m.nA ??= norm(m.A, m.front); m.nB ??= norm(m.B, m.front);
  const e = EXERCISES[svg.dataset.ex], NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent = svg) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; };
  const W = m.front ? { ...WID, torso: 30 } : WID;

  // Kadr: obejmuje obie pozy i rekwizyty; ruchy pionowe w kwadracie, reszta 3:2.
  // Zaczep taśmy TRX jest daleko, więc do kadru się nie liczy: taśma wychodzi poza kadr, a postać zostaje duża.
  const pts = [];
  for (const p of [0, .5, 1]) { const J = joints(m, p); for (const k in J) pts.push(J[k]); }
  for (const pr of m.props) {
    if (pr[0] === 'hbar') pts.push([pr[1], pr[3]], [pr[2], pr[3]]);
    else if (pr[0] === 'post') pts.push([pr[1], pr[2]], [pr[1], pr[3]]);
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
  for (const pr of m.props) {
    if (pr[0] === 'ground') mk('line', { x1: x0, x2: x1, y1: pr[1], y2: pr[1], class: 'gr' });
    // Poręcze do dipów biegną wzdłuż kierunku patrzenia, więc z boku to belka na dwóch słupkach.
    if (pr[0] === 'pbar') { for (const x of [pr[1] - 40, pr[1] + 40]) mk('line', { x1: x, x2: x, y1: pr[2], y2: pr[3], class: 'pp' }); mk('line', { x1: pr[1] - 46, x2: pr[1] + 46, y1: pr[2], y2: pr[2], class: 'pbl' }); }
    if (pr[0] === 'box') mk('rect', { x: pr[1], y: pr[2], width: pr[3], height: pr[4], rx: 5, class: 'px' });
    // Słupek: stojak niskiego drążka albo miejsce zaczepienia gumy.
    if (pr[0] === 'post') mk('line', { x1: pr[1], x2: pr[1], y1: pr[2], y2: pr[3], class: 'pp' });
  }

  // Postać: w każdej warstwie najpierw obrys, potem wypełnienie, na końcu mięśnie.
  const segs = [], mus = [], joint = [], musG = [];
  let coreMus; // mięśnie tułowia rysowane nad nogą, żeby unoszone kolano ich nie zasłaniało
  const MUS = m.front ? MUS_FRONT : MUS_SIDE, layers = m.front ? LAYERS_FRONT : LAYERS_SIDE;
  const lvl = mm => e?.p.includes(mm) ? 'p' : e?.s.includes(mm) ? 's' : null;
  for (const [name, list] of layers) {
    const g = mk('g', { class: 'mv-' + name });
    const outl = list.map(s => mk('line', { class: 'o', 'stroke-width': W[s[0]] + 3.4 }, g));
    if (name === 'core') joint.push(['hd', mk('circle', { r: SEG.head + 1.7, class: 'ho' }, g)]);
    const fill = list.map(s => mk('line', { class: 'f', 'stroke-width': W[s[0]] }, g));
    if (name === 'core') joint.push(['hd', mk('circle', { r: SEG.head, class: 'hf' }, g)]);
    list.forEach((s, k) => segs.push([outl[k], fill[k], s[1], s[2]]));
    // Nieprzezroczyste kształty, przezroczystość na całej grupie: zakładki nie ciemnieją.
    const mg = name === 'core' ? (coreMus = document.createElementNS(NS, 'g')) : g;
    const grp = { s: mk('g', {}, mg), p: mk('g', {}, mg) };
    musG.push([grp.p, 'p'], [grp.s, 's']);
    for (const [mm, specs] of Object.entries(MUS)) {
      const l = lvl(mm);
      if (!l) continue;
      for (const spec of specs) {
        if (spec[0][0] === '@') { // mięsień przy stawie: barki w warstwie rąk, pośladki w tułowiu
          if (name === (spec[0][1] === 's' ? 'arm' : 'core')) mus.push([mk('circle', { r: spec[1], class: 'mu-j' }, grp[l]), spec[0].slice(1)]);
        } else for (const seg of list.filter(s => s[0] === spec[0])) mus.push([mk('line', { class: 'mu', 'stroke-width': W[seg[0]] * spec[4] }, grp[l]), seg, spec]);
      }
    }
    if (name === (m.front ? 'core' : 'leg')) svg.appendChild(coreMus);
  }
  // Sprzęt trzymany w dłoniach i gumy rysowane nad postacią, żeby były widoczne.
  const dyn = [];
  for (const pr of m.props) {
    if (pr[0] === 'bar') mk('circle', { cx: pr[1], cy: pr[2], r: 4.5, class: 'pb' });
    if (pr[0] === 'hbar') mk('line', { x1: pr[1], x2: pr[2], y1: pr[3], y2: pr[3], class: 'pbl' });
    if (pr[0] === 'strap' || pr[0] === 'band') dyn.push([mk('line', { class: pr[0] === 'strap' ? 'ps' : 'pg' }), [pr[1], pr[2]], pr[3]]);
    if (pr[0] === 'band2') dyn.push([mk('line', { class: 'pg' }), pr[1], pr[2]]);
  }
  if (tempo === 'band') for (const foot of ['an0', 'an1']) dyn.push([mk('line', { class: 'pg' }), [150, 16], foot]);

  const rot = seg => m.front ? 90 : (m.sup ? -1 : 1) * (seg[0] === 'torso' ? 90 : -90);
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
    for (const [o, f, a, b] of segs) for (const el of [o, f]) { el.setAttribute('x1', J[a][0]); el.setAttribute('y1', J[a][1]); el.setAttribute('x2', J[b][0]); el.setAttribute('y2', J[b][1]); }
    for (const [k, el] of joint) { el.setAttribute('cx', J[k][0]); el.setAttribute('cy', J[k][1]); }
    for (const [el, a, b] of dyn) {
      const A = typeof a === 'string' ? J[a] : a, B = typeof b === 'string' ? J[b] : b;
      el.setAttribute('x1', A[0]); el.setAttribute('y1', A[1]); el.setAttribute('x2', B[0]); el.setAttribute('y2', B[1]);
    }
    for (const [g, l] of musG) g.setAttribute('opacity', (l === 'p' ? .2 + .8 * act : .08 + .42 * act).toFixed(3));
    for (const [el, seg, spec] of mus) {
      if (typeof seg === 'string') { el.setAttribute('cx', J[seg][0]); el.setAttribute('cy', J[seg][1]); continue; }
      const A = J[seg[1]], B = J[seg[2]], n = at([0, 0], ang(A, B) + rot(seg), spec[3] * W[seg[0]]);
      const P0 = lerp(A, B, spec[1]), P1 = lerp(A, B, spec[2]);
      el.setAttribute('x1', P0[0] + n[0]); el.setAttribute('y1', P0[1] + n[1]); el.setAttribute('x2', P1[0] + n[0]); el.setAttribute('y2', P1[1] + n[1]);
    }
  };
}

// Jedna pętla dla wszystkich widocznych animacji; ukryte i odłączone są pomijane.
const moving = new Map();
function moveFig(id) { return EX_MOVE[id] ? `<svg class="move" data-ex="${id}" role="img" aria-label="Animacja ruchu"></svg>` : ''; }
// Miniatury: jedna klatka w fazie spięcia, bez pętli animacji.
function stillMoves(root) { for (const svg of root.querySelectorAll('svg.move:not([data-on])')) { const d = mountMove(svg, [350, 250]); svg.dataset.on = 1; d && d(1450); } }
function mountMoves(root = document) {
  for (const svg of root.querySelectorAll('svg.move:not([data-on])')) { const d = mountMove(svg); svg.dataset.on = 1; if (d) moving.set(svg, d); }
}
if (typeof requestAnimationFrame !== 'undefined') (function loop(ms) {
  for (const [svg, draw] of moving) { if (!svg.isConnected) moving.delete(svg); else if (svg.getClientRects().length) draw(ms); }
  requestAnimationFrame(loop);
})(0);
if (typeof module !== 'undefined') module.exports = { EX_MOVE, MOVES, SEG, joints, norm };
