// Animacje ćwiczeń: postać z obrysów widziana z boku, twarzą w prawo.
// Każdy ruch ma pozę A (luz) i B (spięcie); dłonie i stopy to cele, łokcie i kolana liczy kinematyka odwrotna.
// Pracujące mięśnie (EXERCISES[id].p / .s) czerwienieją przy spięciu i bledną przy rozluźnieniu.
// Poza: h biodro [x,y], t kąt tułowia (°; 0 = w prawo, -90 = w górę), H dłonie, F kostki (jeden punkt albo [bliższa, dalsza]),
// fa kąt stóp, eb/kb kierunek zgięcia łokci/kolan (±1), s skrót perspektywiczny ramion [ramię, przedramię], sup = leży na plecach.
const SEG = { torso: 58, neck: 7, head: 11, ua: 30, fa: 34, th: 44, sh: 42, ft: 13 };
const WID = { torso: 24, neck: 8, ua: 11, fa: 9, th: 15, sh: 11, ft: 6 };

const STAND = { h: [150, 98], t: -90, H: [150, 104], F: [150, 184], fa: 12 };
const HANG = { h: [150, 140], t: -90, H: [157, 18], F: [140, 222], fa: 60 };
const SUPPORT = { h: [148, 94], t: -88, H: [152, 100], F: [120, 160], fa: 70 };
const PLANK = { h: [130, 165], t: -11, H: [218, 186], F: [46, 182], fa: 40, eb: [1, 1] };

const MOVES = {
  pullup: { props: [['bar', 157, 16]], A: HANG, B: { h: [144, 94], t: -92, H: [157, 18], F: [136, 176], fa: 60 } },
  scap: { props: [['bar', 157, 16]], A: HANG, B: { ...HANG, h: [150, 134], F: [140, 216] } },
  hang: { props: [['bar', 157, 16]], A: HANG, B: HANG },
  row: {
    props: [['ground', 190], ['strap', 250, 18, 'wr0']],
    A: { h: [136, 129], t: -40, H: [225, 46], F: [70, 184], fa: -60 },
    B: { h: [128, 120], t: -48, H: [180, 80], F: [70, 184], fa: -60 },
  },
  invrow: {
    props: [['ground', 190], ['bar', 200, 70]],
    A: { h: [141, 156], t: -19, H: [200, 72], F: [60, 184], fa: -60 },
    B: { h: [128, 131], t: -38, H: [200, 72], F: [60, 184], fa: -60 },
  },
  dip: {
    props: [['ground', 232], ['pbar', 152, 100, 232]],
    A: SUPPORT,
    B: { h: [138, 122], t: -70, H: [152, 100], F: [110, 186], fa: 70 },
  },
  support: { props: [['ground', 232], ['pbar', 152, 100, 232]], A: SUPPORT, B: SUPPORT },
  pushup: {
    props: [['ground', 190]],
    A: { h: [131, 149], t: -23, H: [188, 189], F: [52, 182], fa: 40 },
    B: { h: [137, 170], t: -8, H: [188, 189], F: [52, 182], fa: 40 },
  },
  trxpush: {
    props: [['ground', 190], ['strap', 262, 8, 'wr0']],
    A: { h: [135, 116], t: -50, H: [232, 94], F: [80, 182], fa: 40 },
    B: { h: [150, 133], t: -35, H: [214, 112], F: [80, 182], fa: 40 },
  },
  declpush: {
    props: [['ground', 190], ['box', 18, 150, 56, 40]],
    A: { h: [135, 132], t: -9, H: [192, 189], F: [50, 146], fa: 60 },
    B: { h: [136, 153], t: 5, H: [192, 189], F: [50, 146], fa: 60 },
  },
  inclpush: {
    props: [['ground', 190], ['box', 176, 152, 56, 38]],
    A: { h: [136, 127], t: -39, H: [198, 152], F: [70, 182], fa: 40 },
    B: { h: [144, 139], t: -30, H: [198, 152], F: [70, 182], fa: 40 },
  },
  pullapart: {
    props: [['ground', 190]],
    A: { ...STAND, H: [214, 42] },
    B: { ...STAND, H: [166, 42], s: [[.28, .28], [.28, .28]] },
  },
  extrot: {
    props: [['ground', 190], ['band', 238, 70, 'wr0']],
    A: { ...STAND, H: [184, 70] },
    B: { ...STAND, H: [157, 70], s: [[1, .2], [1, .2]] },
  },
  kneebars: {
    props: [['ground', 232], ['pbar', 152, 100, 232]],
    A: { ...SUPPORT, F: [150, 180] },
    B: { ...SUPPORT, F: [188, 136] },
  },
  kneehang: {
    props: [['bar', 157, 16]],
    A: { ...HANG, F: [148, 226] },
    B: { ...HANG, h: [148, 138], t: -86, F: [190, 182] },
  },
  plank: { props: [['ground', 190]], A: PLANK, B: PLANK },
  sideplank: { props: [['ground', 190]], A: { ...PLANK, H: [[218, 186], [131, 160]] }, B: { ...PLANK, H: [[218, 186], [131, 160]] } },
  rollout: {
    props: [['ground', 190], ['strap', 252, 8, 'wr0']],
    A: { h: [135, 99], t: -80, H: [205, 64], F: [120, 184], fa: 12 },
    B: { h: [166, 111], t: -58, H: [241, 17], F: [120, 184], fa: 12 },
  },
  trxknees: {
    props: [['ground', 190], ['strap', 36, 8, 'an0']],
    A: { h: [143, 135], t: -10, H: [200, 189], F: [58, 150], fa: 30 },
    B: { h: [146, 104], t: 20, H: [200, 189], F: [150, 150], fa: 30 },
  },
  deadbug: {
    props: [['ground', 190]], sup: true,
    A: { h: [110, 176], t: 0, H: [168, 112], F: [68, 132], kb: [1, 1], eb: [-1, -1], fa: -90 },
    B: { h: [110, 176], t: 0, H: [[230, 172], [168, 112]], F: [[68, 132], [24, 170]], kb: [1, 1], eb: [-1, -1], fa: -90 },
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
  trxsplit: {
    props: [['ground', 190], ['strap', 40, 20, 'an1']],
    A: { h: [150, 100], t: -88, H: [206, 60], F: [[180, 184], [70, 150]], fa: [12, 80] },
    B: { h: [140, 140], t: -80, H: [200, 96], F: [[180, 184], [60, 158]], fa: [12, 80] },
  },
  boxpistol: {
    props: [['ground', 190], ['box', 70, 130, 90, 60], ['strap', 270, -30, 'wr0']],
    A: { h: [150, 38], t: -90, H: [214, 0], F: [[150, 124], [182, 124]], fa: [12, 40] },
    B: { h: [118, 84], t: -60, H: [214, 40], F: [[150, 124], [176, 168]], fa: [12, 60] },
  },
  lunge: {
    props: [['ground', 190]],
    A: { h: [150, 100], t: -90, H: [150, 106], F: [[190, 184], [110, 184]], fa: [12, 40] },
    B: { h: [148, 140], t: -88, H: [148, 146], F: [[192, 184], [112, 184]], fa: [12, 40] },
  },
  bridge: {
    props: [['ground', 190]], sup: true,
    A: { h: [100, 176], t: 0, H: [100, 186], F: [60, 184], kb: [1, 1], eb: [-1, -1], fa: 0 },
    B: { h: [104, 140], t: 34, H: [100, 186], F: [60, 184], kb: [1, 1], eb: [-1, -1], fa: 0 },
  },
  bridge1: {
    props: [['ground', 190]], sup: true,
    A: { h: [100, 176], t: 0, H: [100, 186], F: [[60, 184], [44, 118]], kb: [1, 1], eb: [-1, -1], fa: 0 },
    B: { h: [104, 140], t: 34, H: [100, 186], F: [[60, 184], [48, 84]], kb: [1, 1], eb: [-1, -1], fa: 0 },
  },
  goodmorning: {
    props: [['ground', 190], ['band2', 'an0', 'sh']],
    A: { ...STAND, H: [160, 34], eb: [1, 1] },
    B: { h: [128, 100], t: -12, H: [190, 80], F: [150, 184], fa: 12 },
  },
  hamcurl: {
    props: [['ground', 190], ['box', 88, 130, 76, 60], ['band', 276, 176, 'an0']],
    A: { h: [128, 124], t: -95, H: [100, 128], F: [214, 150], fa: 0, eb: [-1, -1] },
    B: { h: [128, 124], t: -95, H: [100, 128], F: [162, 178], fa: 40, eb: [-1, -1] },
  },
  calf: {
    props: [['ground', 190], ['band2', 'an0', 'sh']],
    A: { ...STAND, H: [158, 40] },
    B: { ...STAND, h: [150, 86], H: [158, 28], F: [150, 172], fa: 62 },
  },
};

// Ćwiczenie → [ruch, tempo]; tempo 'neg' = powolne opuszczanie, mięśnie spięte przez cały ruch w dół.
const EX_MOVE = {
  'podciaganie': ['pullup'], 'podciaganie-podchwyt': ['pullup'], 'podciaganie-guma': ['pullup', 'band'], 'podciaganie-negatyw': ['pullup', 'neg'],
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

// Gdzie leży mięsień: [odcinek, od, do (0–1 wzdłuż), strona (+1 przód, -1 tył, 0 środek)] albo [staw].
const MUS_AT = {
  chest: ['torso', .55, .92, 1], abs: ['torso', .08, .55, 1], obliques: ['torso', .12, .5, 0], traps: ['torso', .86, 1, -1],
  midback: ['torso', .58, .86, -1], lats: ['torso', .3, .74, -1], lowerback: ['torso', .04, .32, -1],
  biceps: ['ua', .15, .85, 1], triceps: ['ua', .15, .85, -1], forearms: ['fa', .08, .62, 0],
  quads: ['th', .1, .88, 1], adductors: ['th', .15, .6, 0], hamstrings: ['th', .15, .88, -1], calves: ['sh', .1, .55, -1],
  shoulders: ['sh-joint'], glutes: ['hip-joint'],
};

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
function norm(P) {
  return { h: P.h, t: P.t ?? -90, H: pair(P.H), F: pair(P.F), fa: Array.isArray(P.fa) ? P.fa : [P.fa ?? 12, P.fa ?? 12],
    s: P.s || [[1, 1], [1, 1]], eb: P.eb || [1, 1], kb: P.kb || [-1, -1] };
}
const lerp = (a, b, p) => typeof a === 'number' ? a + (b - a) * p : a.map((x, i) => lerp(x, b[i], p));

// Stawy dla pozy pośredniej p (0 = A, 1 = B).
function joints(m, p) {
  const A = m.nA, B = m.nB, P = { h: lerp(A.h, B.h, p), t: lerp(A.t, B.t, p), H: lerp(A.H, B.H, p), F: lerp(A.F, B.F, p), fa: lerp(A.fa, B.fa, p), s: lerp(A.s, B.s, p) };
  const J = { hip: P.h, sh: at(P.h, P.t, SEG.torso), t: P.t };
  J.hd = at(J.sh, P.t, SEG.neck + SEG.head);
  J.nk = at(J.sh, P.t, SEG.neck);
  for (const i of [0, 1]) {
    [J['el' + i], J['wr' + i]] = ik(J.sh, P.H[i], SEG.ua * P.s[i][0], SEG.fa * P.s[i][1], A.eb[i]);
    [J['kn' + i], J['an' + i]] = ik(J.hip, P.F[i], SEG.th, SEG.sh, A.kb[i]);
    J['to' + i] = at(J['an' + i], P.fa[i], SEG.ft);
  }
  return J;
}

// fixed = [szer., wys.] wspólnego kadru (miniatury w tej samej skali); bez niego kadr dopasowany do ruchu.
function mountMove(svg, fixed) {
  const [key, tempo] = EX_MOVE[svg.dataset.ex] || [], m = MOVES[key];
  if (!m) return false;
  m.nA ??= norm(m.A); m.nB ??= norm(m.B);
  const e = EXERCISES[svg.dataset.ex], NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent = svg) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent.appendChild(el); return el; };

  // Kadr: obejmuje obie pozy i rekwizyty; ruchy pionowe w kwadracie, reszta 3:2.
  const pts = [];
  for (const p of [0, .5, 1]) { const J = joints(m, p); for (const k in J) if (Array.isArray(J[k])) pts.push(J[k]); }
  for (const pr of m.props) if (typeof pr[1] === 'number' && pr[0] !== 'ground') {
    pts.push([pr[1], pr[2]]);
    if (pr[0] === 'box') pts.push([pr[1] + pr[3], pr[2] + pr[4]]);
    if (pr[0] === 'pbar') pts.push([pr[1] - 46, pr[2]], [pr[1] + 46, pr[2]]);
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

  // Rekwizyty statyczne i ruchome (taśma TRX, guma).
  const dyn = [];
  for (const pr of m.props) {
    if (pr[0] === 'ground') mk('line', { x1: x0, x2: x1, y1: pr[1], y2: pr[1], class: 'gr' });
    // Poręcze do dipów biegną wzdłuż kierunku patrzenia, więc z boku to belka na dwóch słupkach.
    if (pr[0] === 'pbar') { for (const x of [pr[1] - 40, pr[1] + 40]) mk('line', { x1: x, x2: x, y1: pr[2], y2: pr[3], class: 'pp' }); mk('line', { x1: pr[1] - 46, x2: pr[1] + 46, y1: pr[2], y2: pr[2], class: 'pbl' }); }
    if (pr[0] === 'box') mk('rect', { x: pr[1], y: pr[2], width: pr[3], height: pr[4], rx: 5, class: 'px' });
    if (pr[0] === 'strap' || pr[0] === 'band') dyn.push([mk('line', { class: pr[0] === 'strap' ? 'ps' : 'pg' }), [pr[1], pr[2]], pr[3]]);
    if (pr[0] === 'band2') dyn.push([mk('line', { class: 'pg' }), pr[1], pr[2]]);
  }
  const bars = m.props.filter(pr => pr[0] === 'bar');
  if (tempo === 'band') dyn.push([mk('line', { class: 'pg' }), [157, 16], 'kn0']);

  // Postać: warstwy od dalszej kończyny do bliższej; w każdej najpierw obrys, potem wypełnienie, na końcu mięśnie.
  const layers = { far: [['ua', 'sh', 'el1'], ['fa', 'el1', 'wr1'], ['th', 'hip', 'kn1'], ['sh', 'kn1', 'an1'], ['ft', 'an1', 'to1']],
    core: [['torso', 'hip', 'sh'], ['neck', 'sh', 'nk']], leg: [['th', 'hip', 'kn0'], ['sh', 'kn0', 'an0'], ['ft', 'an0', 'to0']],
    arm: [['ua', 'sh', 'el0'], ['fa', 'el0', 'wr0']] };
  const segs = [], mus = [], joint = [], musG = [];
  let coreMus; // mięśnie tułowia rysowane nad bliższą nogą, żeby unoszone kolano ich nie zasłaniało
  const lvl = mm => e?.p.includes(mm) ? 'p' : e?.s.includes(mm) ? 's' : null;
  for (const [name, list] of Object.entries(layers)) {
    const g = mk('g', { class: 'mv-' + name });
    const outl = list.map(s => mk('line', { class: 'o', 'stroke-width': WID[s[0]] + 3.4 }, g));
    if (name === 'core') joint.push(['hd', mk('circle', { r: SEG.head + 1.7, class: 'ho' }, g), 0]);
    const fill = list.map(s => mk('line', { class: 'f', 'stroke-width': WID[s[0]] }, g));
    if (name === 'core') joint.push(['hd', mk('circle', { r: SEG.head, class: 'hf' }, g), 0]);
    list.forEach((s, k) => segs.push([outl[k], fill[k], s[1], s[2]]));
    const mg = name === 'core' ? (coreMus = document.createElementNS(NS, 'g')) : g;
    const grp = { s: mk('g', {}, mg), p: mk('g', {}, mg) };
    musG.push([grp.p, 'p'], [grp.s, 's']);
    for (const [mm, spec] of Object.entries(MUS_AT)) {
      const l = lvl(mm);
      if (!l) continue;
      const seg = list.find(s => s[0] === spec[0]);
      if (seg) mus.push([mk('line', { class: 'mu', 'stroke-width': WID[seg[0]] * (spec[3] ? .44 : .5) }, grp[l]), seg, spec]);
      if ((name === 'core' && spec[0] === 'hip-joint') || (name === 'arm' && spec[0] === 'sh-joint')) mus.push([mk('circle', { r: spec[0] === 'hip-joint' ? 8 : 6.5, class: 'mu-j' }, grp[l]), null, spec]);
    }
    if (name === 'leg') svg.appendChild(coreMus);
  }
  for (const pr of bars) mk('circle', { cx: pr[1], cy: pr[2], r: 4.5, class: 'pb' }); // drążek nad dłońmi
  const front = seg => (m.sup ? -1 : 1) * (seg[0] === 'torso' ? 90 : -90);
  const still = JSON.stringify(m.A) === JSON.stringify(m.B);
  const T = tempo === 'neg' ? [.7, .3, 3, .6] : [1.1, .35, 1.1, .45];
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
      if (!seg) {
        const c = spec[0] === 'sh-joint' ? J.sh : at(J.hip, J.t + (m.sup ? 90 : -90), 6);
        el.setAttribute('cx', c[0]); el.setAttribute('cy', c[1]);
        continue;
      }
      const A = J[seg[1]], B = J[seg[2]], a = ang(A, B), n = at([0, 0], a + front(seg), spec[3] * WID[seg[0]] * .24);
      const P0 = lerp(A, B, spec[1]), P1 = lerp(A, B, spec[2]);
      el.setAttribute('x1', P0[0] + n[0]); el.setAttribute('y1', P0[1] + n[1]); el.setAttribute('x2', P1[0] + n[0]); el.setAttribute('y2', P1[1] + n[1]);
    }
  };
}

// Jedna pętla dla wszystkich widocznych animacji; ukryte i odłączone są pomijane.
const moving = new Map();
function moveFig(id) { return EX_MOVE[id] ? `<svg class="move" data-ex="${id}" role="img" aria-label="Animacja ruchu"></svg>` : ''; }
// Miniatury: jedna klatka w fazie spięcia, bez pętli animacji.
function stillMoves(root) { for (const svg of root.querySelectorAll('svg.move:not([data-on])')) { const d = mountMove(svg, [350, 250]); svg.dataset.on = 1; d && d(1250); } }
function mountMoves(root = document) {
  for (const svg of root.querySelectorAll('svg.move:not([data-on])')) { const d = mountMove(svg); svg.dataset.on = 1; if (d) moving.set(svg, d); }
}
if (typeof requestAnimationFrame !== 'undefined') (function loop(ms) {
  for (const [svg, draw] of moving) { if (!svg.isConnected) moving.delete(svg); else if (svg.getClientRects().length) draw(ms); }
  requestAnimationFrame(loop);
})(0);
if (typeof module !== 'undefined') module.exports = { EX_MOVE, MOVES };
