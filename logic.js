// Czysta logika, bez DOM. Ładowana przez index.html; `node logic.js` uruchamia autotest.

// Rozpiska (jeden trening albo tablica, np. wklejona od trenera) → tablica treningów z domyślnymi wartościami.
function normalize(data) {
  const plans = Array.isArray(data) ? data : [data];
  if (!plans.length) throw Error('Pusta rozpiska');
  return plans.map((p, i) => {
    if (!p?.name || !Array.isArray(p.items) || !p.items.length) throw Error(`Trening ${i + 1}: brak "name" albo "items"`);
    return {
      name: String(p.name), note: p.note ? String(p.note) : '',
      items: p.items.map((it, j) => {
        const where = `${p.name}, pozycja ${j + 1}`;
        if (!it?.ex) throw Error(`${where}: brak "ex"`);
        if (it.reps == null && !(it.time > 0)) throw Error(`${where}: podaj "reps" albo "time"`);
        return {
          ex: String(it.ex), name: it.name ? String(it.name) : '', sets: Math.max(1, parseInt(it.sets) || 1),
          reps: it.reps ?? '', time: Math.max(0, parseInt(it.time) || 0),
          rest: it.rest == null ? 90 : Math.max(0, parseInt(it.rest) || 0), note: it.note ? String(it.note) : '',
          kg: +it.kg > 0 ? +it.kg : 0, // ciężar startowy z rozpiski (0 = nie podano)
        };
      }),
    };
  });
}

// Trening → lista serii; rest = przerwa PO serii (po ostatniej 0).
function steps(plan) {
  const out = [];
  plan.items.forEach((it, item) => { for (let set = 1; set <= it.sets; set++) out.push({ item, set, rest: it.rest }); });
  if (out.length) out[out.length - 1].rest = 0;
  return out;
}

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const exName = it => it.name || globalThis.EXERCISES?.[it.ex]?.name || it.ex;
const goal = it => it.time ? `${it.time} s` : /^\d+$/.test(String(it.reps)) ? `${it.reps} powt.` : String(it.reps);
// Typ treningu bez numeru tygodnia: „T2 · Góra A (…)” i „T1 · Góra A (…)” to ten sam typ.
const planKind = name => String(name).replace(/^T\d+\s*·\s*/, '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();

// Szacowany czas w minutach: ok. 40 s na serię powtórzeń (albo czas serii) plus przerwy.
const estimate = plan => Math.round(steps(plan).reduce((t, s) => t + (plan.items[s.item].time || 40) + s.rest, 0) / 60);

// Obciążenie mięśni: seria liczy się 1 dla mięśnia głównego i 0,5 dla pomocniczego.
// sets(item, index) pozwala liczyć serie zaplanowane albo faktycznie zrobione.
function muscleLoad(items, sets = it => it.sets) {
  const load = {};
  items.forEach((it, k) => {
    const e = globalThis.EXERCISES?.[it.ex], n = sets(it, k);
    if (!e || !n) return;
    for (const m of e.p) load[m] = (load[m] || 0) + n;
    for (const m of e.s) load[m] = (load[m] || 0) + n / 2;
  });
  return load;
}
// Posortowane udziały: [{ m, load, pct }].
function muscleShare(load) {
  const sum = Object.values(load).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(load).sort((a, b) => b[1] - a[1]).map(([m, v]) => ({ m, load: v, pct: Math.round(v / sum * 100) }));
}

// Wyniki treningu: per ćwiczenie + sumy. log: {indeks serii: wynik}, kg: {indeks serii: ciężar} (tylko ćwiczenia z obciążeniem).
function stats(plan, log, kg = {}) {
  const st = steps(plan);
  const per = plan.items.map((it, item) => ({
    ex: it.ex, name: exName(it), time: !!it.time, sets: it.sets, reps: it.reps,
    vals: st.flatMap((s, i) => s.item === item && log[i] != null ? [log[i]] : []),
    kgs: st.flatMap((s, i) => s.item === item && log[i] != null ? [kg[i] ?? null] : []),
  }));
  const sum = f => per.filter(f).flatMap(p => p.vals).reduce((a, b) => a + b, 0);
  return { per, reps: sum(p => !p.time), hold: sum(p => p.time), done: Object.keys(log).length, total: st.length };
}
// Zmiana w % (null, gdy nie ma z czym porównać).
const delta = (now, before) => before > 0 ? Math.round((now - before) / before * 100) : null;
const signed = n => n == null ? '—' : `${n > 0 ? '+' : ''}${n}%`;

// Ciężar po polsku (przecinek), np. 42,5. Największy ciężar w serii ćwiczenia (0, gdy bez obciążenia).
const kgTxt = k => String(Math.round(k * 10) / 10).replace('.', ',');
const topKg = p => Math.max(0, ...(p?.kgs || []).filter(k => k > 0));
// Ocena treningu i zgłoszony ból (pierwsza strona wyników); te same partie co w ankiecie.
const OCENA = { LEKKO: 'za lekko', OK: 'w sam raz', CIEZKO: 'za ciężko' };
const BOL = { BARKI: 'barki', LOKCIE: 'łokcie', NADGARSTKI: 'nadgarstki', PLECY: 'plecy', KOLANA: 'kolana', BIODRA: 'biodra', INNE: 'coś innego' };

// Słowo od trenera po treningu: z liczb, nie ogólnik. name = imię z telefonu (może być puste), sex = płeć z ankiety ('K', 'M' albo brak: forma bezosobowa).
function cheer(s, prev, name, sex) {
  const n = name ? `, ${name}` : '', tot = v => v.reduce((a, b) => a + b, 0);
  const pl = (k, w) => `${k} ${k === 1 ? w[0] : k % 10 > 1 && k % 10 < 5 && (k % 100 < 12 || k % 100 > 14) ? w[1] : w[2]}`;
  if (s.total && s.done / s.total < .8) return `Trening zaliczony${n}. Następnym razem spróbuj dokończyć wszystkie serie.`;
  if (!prev) return `Udało się${n}! Pierwszy taki trening za Tobą.`;
  const byReps = s.reps || prev.reps, w = byReps ? ['powtórzenie', 'powtórzenia', 'powtórzeń'] : ['sekundę', 'sekundy', 'sekund'];
  const d = byReps ? s.reps - prev.reps : s.hold - prev.hold, did = sex === 'K' ? 'Zrobiłaś' : sex === 'M' ? 'Zrobiłeś' : 'Wyszło';
  // Ćwiczenie z największym postępem względem poprzedniego razu.
  let best;
  for (const p of s.per) {
    const q = prev.per?.find(x => x.ex === p.ex);
    const g = q && p.vals.length ? tot(p.vals) - tot(q.vals) : 0;
    if (g > 0 && (!best || g > best.g)) best = { name: p.name.toLowerCase(), g, u: p.time ? ' s' : '' };
  }
  // Ćwiczenie, w którym najbardziej urósł ciężar (największy ciężar serii dziś i poprzednio).
  let up;
  for (const p of s.per) {
    const g = topKg(p) - topKg(prev.per?.find(x => x.ex === p.ex));
    if (topKg(p) && topKg(prev.per?.find(x => x.ex === p.ex)) && g > 0 && (!up || g > up.g)) up = { name: p.name.toLowerCase(), g };
  }
  const plus = best ? ` Największy postęp: ${best.name} (+${best.g}${best.u}).` : '', heavier = up ? ` Ciężar w górę: ${up.name} (+${kgTxt(up.g)} kg).` : '';
  if (d > 0) return `Udało się${n}! ${did} o ${pl(d, w)} więcej niż ostatnio. Tak trzymaj!${plus}${heavier}`;
  if (d === 0) return `Udało się${n}! Tyle samo co ostatnio, solidna robota.${plus}${heavier}`;
  return `Dobra robota${n}. Dziś o ${pl(-d, w)} mniej niż ostatnio, to normalne. Liczy się regularność.${best ? ` Za to ${best.name}: +${best.g}${best.u}.` : ''}${heavier}`;
}

// Serie ćwiczenia jako tekst: „6, 6, 5 × 40 kg”, przy różnych ciężarach „6×40, 5×42,5 kg”; perKg = dopisek, np. „na hantel”.
function setsText(p, perKg) {
  if (!topKg(p)) return p.vals.map(v => v + (p.time ? ' s' : '')).join(', ');
  const tail = ` kg${perKg ? ' ' + perKg : ''}`;
  return new Set(p.kgs).size === 1 ? `${p.vals.join(', ')} × ${kgTxt(p.kgs[0])}${tail}` : p.vals.map((v, i) => p.kgs[i] ? `${v}×${kgTxt(p.kgs[i])}` : v).join(', ') + tail;
}
// Podsumowanie dla trenera; prev = poprzedni trening tego samego typu (z historii); extra = { kg, ocena, bol } z ekranu treningu i wyników.
function summaryText(plan, log, note, t0, t1, prev, extra = {}) {
  const s = stats(plan, log, extra.kg);
  const lines = [`Trening: ${plan.name} (${new Date(t0).toISOString().slice(0, 10)}, ${Math.round((t1 - t0) / 60000)} min)`];
  const skipped = [];
  for (const p of s.per) {
    if (p.vals.length) lines.push(`${p.name} (cel ${p.sets}×${p.time ? plan.items.find(i => i.ex === p.ex).time + ' s' : p.reps}): ${setsText(p, globalThis.EXERCISES?.[p.ex]?.kgOpis)}`);
    else skipped.push(p.name);
  }
  if (skipped.length) lines.push(`Pominięte: ${skipped.join(', ')}`);
  if (extra.ocena) lines.push(`Ocena: ${OCENA[extra.ocena]}`);
  if (extra.bol) lines.push(`Ból: ${extra.bol.length ? extra.bol.map(b => BOL[b]).join(', ') : 'nie'}`);
  lines.push(`Serie: ${s.done}/${s.total}, powtórzenia razem: ${s.reps}` + (s.hold ? `, czas w napięciu: ${s.hold} s` : ''));
  if (prev) lines.push(`Poprzednio (${new Date(prev.t0).toISOString().slice(0, 10)}): powtórzenia ${prev.reps} → ${s.reps} (${signed(delta(s.reps, prev.reps))})`);
  if (note?.trim()) lines.push(`Uwagi: ${note.trim()}`);
  return lines.join('\n');
}

// Opis formatu dla osoby, która układa rozpiskę poza aplikacją.
function planFormat(exercises, history) {
  return [
    'Format rozpiski dla aplikacji (JSON): jeden trening albo tablica treningów:',
    '{"name":"T2 · Góra A","note":"...","items":[{"ex":"podciaganie","sets":5,"reps":2,"rest":120,"note":"..."},{"ex":"plank","sets":3,"time":40,"rest":45}]}',
    'reps: liczba albo tekst (np. "8/noga"); time: sekundy (zamiast reps); rest: przerwa po serii w sekundach; kg: ciężar startowy (ćwiczenia z obciążeniem).',
    'Dostępne ćwiczenia (ex): ' + Object.entries(exercises).map(([id, e]) => `${id} (${e.name})`).join(', ') + '.',
    'Ćwiczenie spoza listy: własne "ex" i "name".',
    ...(history.length ? ['', 'Moje ostatnie treningi:', ...history.slice(0, 3)] : []),
  ].join('\n');
}

if (typeof module !== 'undefined' && require.main === module) {
  const assert = require('node:assert'), fs = require('node:fs'), path = require('node:path');
  require('./exercises.js');
  const { EX_MOVE, MOVES, joints, norm } = require('./moves.js');
  // Pliki rozpisek podane jako argumenty (`node logic.js rozpiska.json`): format, ćwiczenia z biblioteki i animacja dla każdego z nich.
  const files = process.argv.slice(2);
  const plans = files.flatMap(file => normalize(JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))));
  for (const p of plans) for (const it of p.items) {
    assert(EXERCISES[it.ex], `${p.name}: nieznane ćwiczenie "${it.ex}". Dodaj je do exercises.js razem z animacją w moves.js.`);
    assert(MOVES[EX_MOVE[it.ex]?.[0]], `${p.name}: ćwiczenie "${it.ex}" nie ma animacji w moves.js`);
  }
  for (const [id, e] of Object.entries(EXERCISES)) {
    assert(MOVES[EX_MOVE[id]?.[0]], `${id}: brak animacji w moves.js`);
    for (const m of [...e.p, ...e.s]) assert(MUSCLES[m], `${id}: nieznany mięsień "${m}"`);
    assert(e.p.length, `${id}: brak mięśni głównych`);
  }
  // Animacje: każda poza da się policzyć, a taśma TRX ma stałą długość (nie rozciąga się jak guma).
  for (const [key, m] of Object.entries(MOVES)) {
    m.nA = norm(m.A, m.front); m.nB = norm(m.B, m.front);
    const len = [0, .5, 1].map(p => {
      const J = joints(m, p);
      for (const k in J) assert(J[k].every(Number.isFinite), `${key}: nie da się policzyć stawu ${k}`);
      return m.props.filter(pr => pr[0] === 'strap').map(pr => Math.hypot(pr[1] - J[pr[3]][0], pr[2] - J[pr[3]][1]));
    });
    len[0].forEach((l, k) => assert(Math.max(...len.map(x => Math.abs(x[k] - l))) / l < .05, `${key}: taśma TRX zmienia długość`));
  }

  const p = normalize({ name: 'T2 · Góra A (x)', items: [{ ex: 'pompki', sets: 2, reps: 5, rest: 60 }, { ex: 'plank', sets: 1, time: 30 }] })[0];
  assert.deepStrictEqual(steps(p), [{ item: 0, set: 1, rest: 60 }, { item: 0, set: 2, rest: 60 }, { item: 1, set: 1, rest: 0 }]);
  assert.throws(() => normalize({ name: 'x', items: [{ ex: 'a', sets: 3 }] }), /reps/);
  assert.strictEqual(fmt(125), '2:05');
  assert.strictEqual(planKind(p.name), planKind('T1 · Góra A (drążek + dipy)'));
  assert.strictEqual(estimate(p), 4); // 40+60+40+60+30 s = 230 s

  const load = muscleLoad(p.items);
  assert.deepStrictEqual(load, { chest: 2, triceps: 1, shoulders: 1.5, abs: 2, glutes: 0.5 });
  assert.strictEqual(muscleShare(load)[0].pct, 29);

  const s = stats(p, { 0: 5, 1: 4, 2: 30 });
  assert.deepStrictEqual([s.reps, s.hold, s.done, s.total], [9, 30, 3, 3]);
  assert.strictEqual(delta(9, 8), 13);
  assert.strictEqual(signed(delta(9, 8)), '+13%');
  const sum = summaryText(p, { 0: 5, 1: 4 }, 'ok', 0, 60000, { t0: 0, reps: 8 });
  assert.match(sum, /Pompki \(cel 2×5\): 5, 4/);
  assert.match(sum, /Pominięte: Deska/);
  assert.match(sum, /powtórzenia 8 → 9 \(\+13%\)/);
  const was = { reps: 8, hold: 30, per: [{ ex: 'pompki', vals: [4, 4] }, { ex: 'plank', vals: [30] }] };
  assert.strictEqual(cheer(s, was, 'Adrian', 'M'), 'Udało się, Adrian! Zrobiłeś o 1 powtórzenie więcej niż ostatnio. Tak trzymaj! Największy postęp: pompki (+1).');
  assert.strictEqual(cheer(s, { ...was, reps: 12, per: [] }, '', 'K'), 'Dobra robota. Dziś o 3 powtórzenia mniej niż ostatnio, to normalne. Liczy się regularność.');
  assert.match(cheer(s, { ...was, reps: 4 }, 'Ola', 'K'), /^Udało się, Ola! Zrobiłaś o 5 powtórzeń więcej/);
  assert.match(cheer(s, null, 'Ola', 'K'), /Pierwszy taki trening za Tobą/);
  assert.match(cheer({ ...s, done: 1 }, was, '', null), /^Trening zaliczony\. /);
  // Ciężar: z rozpiski (pole kg), w serii, w tekście dla trenera i w słowie po treningu.
  const g = normalize({ name: 'T1 · Siła', items: [{ ex: 'przysiad-sztanga', sets: 3, reps: 6, kg: '40' }, { ex: 'martwy-rumunski', sets: 2, reps: 8 }] })[0];
  assert.deepStrictEqual(g.items.map(i => i.kg), [40, 0]);
  const gs = stats(g, { 0: 6, 1: 6, 2: 5, 3: 8, 4: 8 }, { 0: 40, 1: 40, 2: 42.5, 3: 8, 4: 8 });
  assert.deepStrictEqual(gs.per.map(p => p.kgs), [[40, 40, 42.5], [8, 8]]);
  const gt = summaryText(g, { 0: 6, 1: 6, 2: 5, 3: 8, 4: 8 }, '', 0, 60000, null, { kg: { 0: 40, 1: 40, 2: 42.5, 3: 8, 4: 8 }, ocena: 'CIEZKO', bol: ['KOLANA'] });
  assert.match(gt, /Przysiad ze sztangą \(cel 3×6\): 6×40, 6×40, 5×42,5 kg/);
  assert.match(gt, /Martwy ciąg rumuński z hantlami \(cel 2×8\): 8, 8 × 8 kg na hantel/);
  assert.match(gt, /Ocena: za ciężko\nBól: kolana/);
  assert.match(summaryText(g, { 0: 6 }, '', 0, 60000, null, { bol: [] }), /Ból: nie/);
  const gw = { reps: 30, per: [{ ex: 'przysiad-sztanga', vals: [6, 6, 6], kgs: [37.5, 37.5, 37.5] }] };
  assert.match(cheer(gs, gw, '', 'M'), /Ciężar w górę: przysiad ze sztangą \(\+5 kg\)\.$/);
  assert.doesNotMatch(cheer(gs, { ...gw, per: [{ ex: 'przysiad-sztanga', vals: [6], kgs: [null] }] }, '', 'M'), /Ciężar w górę/); // poprzednio bez ciężaru
  console.log(`OK: ${Object.keys(EXERCISES).length} ćwiczeń, mięśnie i animacje na miejscu` + (files.length ? `; rozpiski: ${plans.map(p => p.name).join(', ')}` : ''));
}
