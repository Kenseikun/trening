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

// Dieta na tydzień od trenera: 7 dni od poniedziałku, w każdym posiłki z co najmniej dwoma przykładami do wyboru, żeby osoba
// zawsze miała z czego wybrać. Przykład to tekst albo {name, note}; kcal, białko (protein, g), godzina (time) i notatki opcjonalne.
// Te same reguły sprawdza serwis (dietOk) i panel trenera (parseDiet).
function normalizeDiet(d) {
  const txt = v => typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '', num = v => +v > 0 ? Math.round(+v) : 0;
  if (!txt(d?.name)) throw Error('Dieta: brak "name"');
  if (!Array.isArray(d.days) || d.days.length !== 7) throw Error('Dieta: "days" ma mieć 7 dni, od poniedziałku');
  return {
    name: txt(d.name), note: txt(d.note), kcal: num(d.kcal), protein: num(d.protein),
    days: d.days.map((day, i) => {
      if (!Array.isArray(day?.meals) || !day.meals.length) throw Error(`Dieta, dzień ${i + 1}: brak "meals"`);
      return { note: txt(day.note), kcal: num(day.kcal), protein: num(day.protein), meals: day.meals.map((m, j) => {
        const options = (Array.isArray(m?.options) ? m.options : []).map(o => o && typeof o === 'object' ? { name: txt(o.name), note: txt(o.note) } : { name: txt(o), note: '' });
        if (!txt(m?.name)) throw Error(`Dieta, dzień ${i + 1}, posiłek ${j + 1}: brak "name"`);
        if (options.length < 2 || options.some(o => !o.name)) throw Error(`Dieta, dzień ${i + 1}, ${txt(m.name)}: potrzeba co najmniej dwóch przykładów z nazwą ("options")`);
        return { name: txt(m.name), time: txt(m.time), kcal: num(m.kcal), note: txt(m.note), options };
      }) };
    }),
  };
}

// Trening → lista serii; rest = przerwa PO serii (po ostatniej 0).
function steps(plan) {
  const out = [];
  plan.items.forEach((it, item) => { for (let set = 1; set <= it.sets; set++) out.push({ item, set, rest: it.rest }); });
  if (out.length) out[out.length - 1].rest = 0;
  return out;
}

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
// Ćwiczenie i mięsień w języku aplikacji (LANG ze strings.js; bez niego po polsku). Czego nie ma po angielsku, zostaje po polsku.
const exLoc = (e, lang = globalThis.LANG) => lang === 'en' && e?.en ? { ...e, ...e.en } : e;
const exName = (it, lang) => it.name || exLoc(globalThis.EXERCISES?.[it.ex], lang)?.name || it.ex;
const muscleName = (m, lang = globalThis.LANG) => (lang === 'en' && globalThis.MUSCLES_EN?.[m]) || globalThis.MUSCLES?.[m] || m;
const goal = (it, lang = globalThis.LANG) => it.time ? `${it.time} s` : /^\d+$/.test(String(it.reps)) ? `${it.reps} ${lang === 'en' ? 'reps' : 'powt.'}` : String(it.reps);
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
// lang = język nazw ćwiczeń (tekst dla trenera zawsze po polsku).
function stats(plan, log, kg = {}, lang) {
  const st = steps(plan);
  const per = plan.items.map((it, item) => ({
    ex: it.ex, name: exName(it, lang), time: !!it.time, sets: it.sets, reps: it.reps,
    vals: st.flatMap((s, i) => s.item === item && log[i] != null ? [log[i]] : []),
    kgs: st.flatMap((s, i) => s.item === item && log[i] != null ? [kg[i] ?? null] : []),
  }));
  const sum = f => per.filter(f).flatMap(p => p.vals).reduce((a, b) => a + b, 0);
  return { per, reps: sum(p => !p.time), hold: sum(p => p.time), done: Object.keys(log).length, total: st.length };
}
// Zmiana w % (null, gdy nie ma z czym porównać).
const delta = (now, before) => before > 0 ? Math.round((now - before) / before * 100) : null;
const signed = n => n == null ? '—' : `${n > 0 ? '+' : ''}${n}%`;

// Ciężar po polsku z przecinkiem (42,5), po angielsku z kropką (42.5). Największy ciężar w serii ćwiczenia (0, gdy bez obciążenia).
const kgTxt = (k, lang = globalThis.LANG) => { const s = String(Math.round(k * 10) / 10); return lang === 'en' ? s : s.replace('.', ','); };
const topKg = p => Math.max(0, ...(p?.kgs || []).filter(k => k > 0));
// Ostatni ciężar ćwiczenia z historii (najnowszy trening pierwszy): { kg, t0 } albo null. kind = tylko ten typ treningu (planKind).
function lastKg(history, ex, kind) {
  for (const h of history) {
    if (typeof h !== 'object' || (kind && planKind(h.name) !== kind)) continue;
    const k = h.per?.find(p => p.ex === ex)?.kgs?.filter(x => x > 0);
    if (k?.length) return { kg: k[k.length - 1], t0: h.t0 };
  }
  return null;
}
// Ciężar na start serii: ta seria (powrót do treningu) → poprzednia seria tego ćwiczenia → ostatni ukończony ten sam trening, jeśli
// był już robiony z obecną rozpiską (osoba sama zmieniła ciężar) → ciężar z rozpiski (nowa rozpiska od trenera) → ostatni ciężar
// tego samego treningu → tego ćwiczenia w ogóle → 0. plansAt = kiedy trener wysłał obecną rozpiskę.
function startKg({ setKg, prevSetKg, planKg, same, any, plansAt = 0 }) {
  if (setKg != null) return setKg;
  if (prevSetKg != null) return prevSetKg;
  if (same && same.t0 > plansAt) return same.kg;
  return planKg || same?.kg || any?.kg || 0;
}
// Ocena treningu i zgłoszony ból (pierwsza strona wyników); te same partie co w ankiecie.
const OCENA = { LEKKO: 'za lekko', OK: 'w sam raz', CIEZKO: 'za ciężko' };
const BOL = { BARKI: 'barki', LOKCIE: 'łokcie', NADGARSTKI: 'nadgarstki', PLECY: 'plecy', KOLANA: 'kolana', BIODRA: 'biodra', INNE: 'coś innego' };

// Słowo od trenera po treningu: z liczb, nie ogólnik. name = imię z telefonu (może być puste), sex = płeć z ankiety ('K', 'M' albo brak: forma bezosobowa).
// Po angielsku bez form zależnych od płci; nazwy ćwiczeń przychodzą w s.per już w języku aplikacji.
function cheer(s, prev, name, sex, lang = globalThis.LANG) {
  const en = lang === 'en', n = name ? `, ${name}` : '', tot = v => v.reduce((a, b) => a + b, 0), lc = x => x[0].toLowerCase() + x.slice(1);
  const pl = (k, w) => `${k} ${k === 1 ? w[0] : k % 10 > 1 && k % 10 < 5 && (k % 100 < 12 || k % 100 > 14) ? w[1] : w[2]}`;
  if (s.total && s.done / s.total < .8) return en ? `Workout done${n}. Next time try to finish all the sets.` : `Trening zaliczony${n}. Następnym razem spróbuj dokończyć wszystkie serie.`;
  if (!prev) return en ? `You did it${n}! Your first workout of this kind is done.` : `Udało się${n}! Pierwszy taki trening za Tobą.`;
  const byReps = s.reps || prev.reps, w = byReps ? ['powtórzenie', 'powtórzenia', 'powtórzeń'] : ['sekundę', 'sekundy', 'sekund'];
  const many = k => en ? `${k} ${byReps ? 'rep' : 'second'}${k === 1 ? '' : 's'}` : pl(k, w);
  const d = byReps ? s.reps - prev.reps : s.hold - prev.hold, did = sex === 'K' ? 'Zrobiłaś' : sex === 'M' ? 'Zrobiłeś' : 'Wyszło';
  // Ćwiczenie z największym postępem względem poprzedniego razu.
  let best;
  for (const p of s.per) {
    const q = prev.per?.find(x => x.ex === p.ex);
    const g = q && p.vals.length ? tot(p.vals) - tot(q.vals) : 0;
    if (g > 0 && (!best || g > best.g)) best = { name: lc(p.name), g, u: p.time ? ' s' : '' };
  }
  // Ćwiczenie, w którym najbardziej urósł ciężar (największy ciężar serii dziś i poprzednio).
  let up;
  for (const p of s.per) {
    const g = topKg(p) - topKg(prev.per?.find(x => x.ex === p.ex));
    if (topKg(p) && topKg(prev.per?.find(x => x.ex === p.ex)) && g > 0 && (!up || g > up.g)) up = { name: lc(p.name), g };
  }
  if (en) {
    const plus = best ? ` Biggest progress: ${best.name} (+${best.g}${best.u}).` : '', heavier = up ? ` Weight up: ${up.name} (+${kgTxt(up.g, lang)} kg).` : '';
    if (d > 0) return `You did it${n}! ${many(d)} more than last time. Keep it up!${plus}${heavier}`;
    if (d === 0) return `You did it${n}! Same as last time, solid work.${plus}${heavier}`;
    return `Good job${n}. Today ${many(-d)} fewer than last time, and that's normal. Consistency is what counts.${best ? ` And ${best.name} went up: +${best.g}${best.u}.` : ''}${heavier}`;
  }
  const plus = best ? ` Największy postęp: ${best.name} (+${best.g}${best.u}).` : '', heavier = up ? ` Ciężar w górę: ${up.name} (+${kgTxt(up.g, lang)} kg).` : '';
  if (d > 0) return `Udało się${n}! ${did} o ${pl(d, w)} więcej niż ostatnio. Tak trzymaj!${plus}${heavier}`;
  if (d === 0) return `Udało się${n}! Tyle samo co ostatnio, solidna robota.${plus}${heavier}`;
  return `Dobra robota${n}. Dziś o ${pl(-d, w)} mniej niż ostatnio, to normalne. Liczy się regularność.${best ? ` Za to ${best.name}: +${best.g}${best.u}.` : ''}${heavier}`;
}

// Serie ćwiczenia jako tekst dla trenera (po polsku): „6, 6, 5 × 40 kg”, przy różnych ciężarach „6×40, 5×42,5 kg”; perKg = dopisek, np. „na hantel”.
function setsText(p, perKg) {
  if (!topKg(p)) return p.vals.map(v => v + (p.time ? ' s' : '')).join(', ');
  const tail = ` kg${perKg ? ' ' + perKg : ''}`;
  return new Set(p.kgs).size === 1 ? `${p.vals.join(', ')} × ${kgTxt(p.kgs[0], 'pl')}${tail}` : p.vals.map((v, i) => p.kgs[i] ? `${v}×${kgTxt(p.kgs[i], 'pl')}` : v).join(', ') + tail;
}
// Podsumowanie dla trenera, zawsze po polsku; prev = poprzedni trening tego samego typu (z historii); extra = { kg, ocena, bol } z ekranu treningu i wyników.
function summaryText(plan, log, note, t0, t1, prev, extra = {}) {
  const s = stats(plan, log, extra.kg, 'pl');
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
  require('./exercises.js'); require('./strings.js');
  const { EX_MOVE, MOVES, joints, norm, frameAt, cycleOf } = require('./moves.js');
  // Angielski: każdy napis istnieje w obu językach (funkcja w obu albo w żadnym), każde ćwiczenie i mięsień ma tłumaczenie.
  assert.deepStrictEqual(Object.keys(STR.en).sort(), Object.keys(STR.pl).sort(), 'strings.js: różne klucze po polsku i po angielsku');
  for (const k in STR.pl) assert.strictEqual(typeof STR.en[k], typeof STR.pl[k], `strings.js: „${k}” ma inny typ po angielsku`);
  assert.deepStrictEqual(Object.keys(MUSCLES_EN).sort(), Object.keys(MUSCLES).sort(), 'exercises.js: MUSCLES_EN nie zgadza się z MUSCLES');
  for (const [id, e] of Object.entries(EXERCISES)) {
    assert(e.en?.name && e.en.steps?.length === e.steps.length && e.en.tips?.length === e.tips.length, `${id}: brak albo niepełna wersja angielska (en)`);
    assert.strictEqual(!!e.en.kgOpis, !!e.kgOpis, `${id}: kgOpis bez angielskiego odpowiednika`);
  }
  // Pliki podane jako argumenty (`node logic.js rozpiski/T2.json rozpiski/dieta-T2.json`): rozpiska ma ćwiczenia z biblioteki
  // i animację dla każdego z nich; dieta (obiekt z "days") ma 7 dni i przykłady do każdego posiłku.
  // `--ankieta rozpiski/ankieta-XX.json` (odpowiedzi z „Kopiuj komplet” w panelu) sprawdza jeszcze zgodność z ankietą (zgodnosc.js).
  const args = process.argv.slice(2), ai = args.indexOf('--ankieta'), ankietaPlik = ai < 0 ? null : args.splice(ai, 2)[1];
  require('./zgodnosc.js');
  const docs = args.map(file => JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')));
  const diets = docs.filter(d => d?.days).map(normalizeDiet);
  const plans = docs.filter(d => !d?.days).flatMap(d => normalize(d));
  for (const p of plans) for (const it of p.items) {
    assert(EXERCISES[it.ex], `${p.name}: nieznane ćwiczenie "${it.ex}". Dodaj je do exercises.js razem z animacją w moves.js.`);
    assert(MOVES[EX_MOVE[it.ex]?.[0]], `${p.name}: ćwiczenie "${it.ex}" nie ma animacji w moves.js`);
  }
  for (const [id, e] of Object.entries(EXERCISES)) {
    assert(MOVES[EX_MOVE[id]?.[0]], `${id}: brak animacji w moves.js`);
    for (const m of [...e.p, ...e.s]) assert(MUSCLES[m], `${id}: nieznany mięsień "${m}"`);
    assert(e.p.length, `${id}: brak mięśni głównych`);
    // Sprzęt (wartości jak w ankiecie): bez niego kontrola zgodności z ankietą przepuściłaby ćwiczenie bez sprawdzenia.
    assert(Array.isArray(e.sprzet) && e.sprzet.every(s => ['DRAZEK', 'PORECZE', 'HANTLE', 'KETTLE', 'TRX', 'GUMY', 'SILOWNIA'].includes(s)), `${id}: brak albo zły "sprzet"`);
  }
  // Zgodność z ankietą: kalistenika bez sprzętu nie dostaje siłowni ani drążka, uczulenie i weganizm wyłapują dania, zgodny plan przechodzi.
  const kal = { rodzaj: 'KALISTENIKA', sprzet: ['GUMY'], dni: 3, czas: 45, bol: ['KOLANA'], odzywianie: 'WEGANSKO', alergie: ['ORZECHY'], choroby: ['NIE'] };
  const zle = ZGODNOSC.plan([{ name: 'T1 · Góra', items: [{ ex: 'przysiad-sztanga', sets: 3, reps: 5 }, { ex: 'podciaganie', sets: 3, reps: 5 }, { ex: 'przysiad-guma', sets: 3, reps: 10 }] }], kal);
  assert.deepStrictEqual(zle.map(u => u.poziom), ['blad', 'blad', 'uwaga'], JSON.stringify(zle));
  assert.match(zle[0].tekst, /siłowni/); assert.match(zle[1].tekst, /drążek/); assert.match(zle[2].tekst, /kolana.*Przysiad/);
  assert.deepStrictEqual(ZGODNOSC.plan([{ name: 'T1', items: [{ ex: 'pompki', sets: 3, reps: 10 }, { ex: 'guma-rozciaganie', sets: 3, reps: 15 }] }], { ...kal, bol: ['NIE'] }), []);
  const zlaDieta = ZGODNOSC.dieta({ days: Array(7).fill({ meals: [{ name: 'Śniadanie', options: [{ name: 'Skyr z migdałami', note: '15 g migdałów' }, 'Tofu z warzywami'] }] }) }, kal);
  assert.deepStrictEqual(zlaDieta.map(u => u.tekst.split(':')[0]), ['Uczulenie (orzechy)', 'Sposób odżywiania (wegańsko)'], JSON.stringify(zlaDieta));
  assert.deepStrictEqual(ZGODNOSC.dieta({ days: Array(7).fill({ meals: [{ name: 'Obiad', options: ['Tofu z ryżem', 'Ciecierzyca z warzywami'] }] }) }, kal), []);
  assert.match(ZGODNOSC.dieta({ days: [] }, { ...kal, choroby: ['CUKRZYCA'] })[0].tekst, /dietetyk/);
  assert.match(ZGODNOSC.dieta({ days: [] }, { rodzaj: 'DOM' })[0].tekst, /nie ma pytań o dietę/);
  // Animacje: każda poza da się policzyć, a taśma TRX ma stałą długość (nie rozciąga się jak guma).
  // Anatomia w widoku z boku, 21 klatek ruchu (od przodu rzut przekłamuje kąty; skrócone ręce, s < .95, też pomijamy):
  // łokieć i kolano zgięte najwyżej do ok. 150°, łokieć nie przeskakuje na drugą stronę (dłoń nie przechodzi przez bark),
  // kąt goleń–stopa (kostka do czubków palców) 65–158°, przy prostym kolanie od 80° (łydka nie puści dalej),
  // palce po stronie przodu nogi (tam, gdzie wypycha się kolano), czubki palców i pięta nie wchodzą w podłoże ani w skrzynię.
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const kat = (a, b) => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / Math.hypot(...a) / Math.hypot(...b)))) * 180 / Math.PI;
  for (const [key, m] of Object.entries(MOVES)) {
    m.nA = norm(m.A, m.front); m.nB = norm(m.B, m.front);
    const len = [0, .5, 1].map(p => {
      const J = joints(m, p);
      for (const k in J) assert(J[k].every(Number.isFinite), `${key}: nie da się policzyć stawu ${k}`);
      return m.props.filter(pr => pr[0] === 'strap').map(pr => Math.hypot(pr[1] - J[pr[3]][0], pr[2] - J[pr[3]][1]));
    });
    len[0].forEach((l, k) => assert(Math.max(...len.map(x => Math.abs(x[k] - l))) / l < .05, `${key}: taśma TRX zmienia długość`));
    if (m.front) continue;
    const ground = m.props.find(pr => pr[0] === 'ground')?.[1] ?? Infinity, boxes = m.props.filter(pr => pr[0] === 'box'), strona = [0, 0];
    // Ruch z sekwencją póz (wykroki z krokiem): klatki z całego cyklu, co 50 ms. Stopa na ziemi stoi w miejscu względem podłoża
    // (kamera idzie za biodrem, więc liczymy x + cam): czubki palców nie ślizgają się o więcej niż 1,5 między klatkami.
    const N = m.seq ? Math.round(cycleOf(m) * 20) : 20, naZiemi = [null, null];
    for (let k = 0; k <= N; k++) {
      const F = m.seq ? frameAt(m, null, k * 50) : { J: joints(m, k / 20), cam: 0 }, J = F.J, gdzie = `${key}, klatka ${k}/${N}`;
      if (m.seq) for (const i of [0, 1]) {
        const an = J['an' + i], st = [J['to' + i][0] - an[0], J['to' + i][1] - an[1]], q = [an[0] + 1.12 * st[0] + F.cam, an[1] + 1.12 * st[1]];
        const stoi = q[1] >= ground - 3.5;
        if (stoi && naZiemi[i]) assert(Math.abs(q[0] - naZiemi[i]) < 1.5, `${gdzie}: stopa ${i} ślizga się po podłożu (${(q[0] - naZiemi[i]).toFixed(1)})`);
        naZiemi[i] = stoi ? q[0] : null;
      }
      for (const i of [0, 1]) {
        const ua = sub(J['el' + i], J['s' + i]), fa = sub(J['wr' + i], J['el' + i]), lokiec = kat(sub(J['s' + i], J['el' + i]), fa);
        if (Math.min(...m.nA.s[i], ...m.nB.s[i]) >= .95) {
          assert(lokiec >= 28, `${gdzie}: łokieć ${i} zgięty ponad zakres stawu (${lokiec.toFixed(0)}°)`);
          const z = Math.sign(cross(ua, fa));
          if (lokiec < 170 && z) { assert(!strona[i] || z === strona[i], `${gdzie}: łokieć ${i} przeskakuje na drugą stronę (dłoń przechodzi przez bark)`); strona[i] = z; }
        }
        const an = J['an' + i], th = sub(J['kn' + i], J['h' + i]), sh = sub(an, J['kn' + i]), kolano = kat(sub(J['h' + i], J['kn' + i]), sh);
        assert(kolano >= 28, `${gdzie}: kolano ${i} zgięte ponad zakres stawu (${kolano.toFixed(0)}°)`);
        const golen = sub(J['kn' + i], an), stopa = sub(J['to' + i], an), kostka = kat(golen, stopa);
        assert(Math.sign(cross(golen, stopa)) !== -(kolano > 178 ? -m.nA.kb[i] : Math.sign(cross(th, sh))), `${gdzie}: palce stopy ${i} skierowane w stronę łydki`);
        assert(kostka >= (kolano > 160 ? 80 : 65) && kostka <= 158, `${gdzie}: kąt w kostce ${i} poza zakresem stawu (${kostka.toFixed(0)}°)`);
        for (const [nazwa, d] of [['palce', 1.12], ['pięta', -.42]]) {
          const q = [an[0] + d * stopa[0], an[1] + d * stopa[1]];
          const pod = Math.min(ground, ...boxes.filter(b => q[0] > b[1] && q[0] < b[1] + b[3] && an[1] < b[2]).map(b => b[2]));
          assert(q[1] <= pod + 1, `${gdzie}: ${nazwa} stopy ${i} wchodzą w podłoże`);
        }
      }
    }
  }

  const p = normalize({ name: 'T2 · Góra A (x)', items: [{ ex: 'pompki', sets: 2, reps: 5, rest: 60 }, { ex: 'plank', sets: 1, time: 30 }] })[0];
  assert.deepStrictEqual(steps(p), [{ item: 0, set: 1, rest: 60 }, { item: 0, set: 2, rest: 60 }, { item: 1, set: 1, rest: 0 }]);
  assert.throws(() => normalize({ name: 'x', items: [{ ex: 'a', sets: 3 }] }), /reps/);
  // Dieta: przykłady jako tekst albo {name, note}, liczby z tekstu; 7 dni i co najmniej dwa przykłady do każdego posiłku.
  const day = { meals: [{ name: 'Śniadanie', time: '7:30', kcal: '550', options: ['Owsianka', { name: 'Jajecznica', note: '3 jajka' }] }] };
  const dt = normalizeDiet({ name: 'Dieta · tydzień 1', protein: 140, days: Array(7).fill(day) });
  assert.deepStrictEqual([dt.protein, dt.kcal, dt.days[6].meals[0].kcal, dt.days[0].meals[0].options], [140, 0, 550, [{ name: 'Owsianka', note: '' }, { name: 'Jajecznica', note: '3 jajka' }]]);
  assert.throws(() => normalizeDiet({ name: 'x', days: Array(6).fill(day) }), /7 dni/);
  assert.throws(() => normalizeDiet({ name: 'x', days: [...Array(6).fill(day), { meals: [{ name: 'Obiad', options: ['jeden'] }] }] }), /dzień 7, Obiad: .*dwóch/);
  assert.throws(() => normalizeDiet({ name: 'x', days: [...Array(6).fill(day), { meals: [{ name: 'Obiad', options: ['a', { note: 'b' }] }] }] }), /dwóch/);
  assert.throws(() => normalizeDiet({ days: Array(7).fill(day) }), /name/);
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
  // Ciężar na start: rozpiska ustawia, osoba zmienia, przy kolejnym razie z tą samą rozpiską zostaje jej ciężar, nowa rozpiska znów ustawia.
  const hist = [{ name: 'T1 · Siła A', t0: 2000, per: [{ ex: 'wyciskanie-lezac', kgs: [40, 42.5] }] }, { name: 'T1 · Siła C', t0: 1500, per: [{ ex: 'wyciskanie-lezac', kgs: [30] }] }];
  assert.deepStrictEqual(lastKg(hist, 'wyciskanie-lezac', planKind('T2 · Siła A')), { kg: 42.5, t0: 2000 });
  assert.deepStrictEqual(lastKg(hist, 'wyciskanie-lezac', planKind('T1 · Siła C')), { kg: 30, t0: 1500 }); // inny trening, inny ciężar
  assert.equal(lastKg(hist, 'przysiad-sztanga'), null);
  const same = lastKg(hist, 'wyciskanie-lezac', 'siła a'), any = lastKg(hist, 'wyciskanie-lezac');
  assert.equal(startKg({ planKg: 40, plansAt: 3000 }), 40);                    // pierwszy raz: z rozpiski
  assert.equal(startKg({ planKg: 40, same, any, plansAt: 1000 }), 42.5);       // ta sama rozpiska: ciężar z ostatniego razu
  assert.equal(startKg({ planKg: 45, same, any, plansAt: 3000 }), 45);         // nowa rozpiska: ciężar od trenera
  assert.equal(startKg({ planKg: 0, same, any, plansAt: 3000 }), 42.5);        // nowa rozpiska bez ciężaru: ostatni z tego treningu
  assert.equal(startKg({ planKg: 0, any: { kg: 10, t0: 1 } }), 10);
  assert.equal(startKg({ setKg: 47.5, prevSetKg: 50, planKg: 40 }), 47.5);
  assert.equal(startKg({ prevSetKg: 50, planKg: 40, same, plansAt: 1000 }), 50);
  assert.equal(startKg({}), 0);
  // Po angielsku: nazwy, cel, ciężar z kropką i słowo po treningu; tekst dla trenera nadal po polsku.
  assert.strictEqual(exName({ ex: 'pompki' }, 'en'), 'Push-up');
  assert.strictEqual(exName({ ex: 'pompki', name: 'Own name' }, 'en'), 'Own name');
  assert.strictEqual(goal({ reps: 8 }, 'en'), '8 reps');
  assert.strictEqual(muscleName('chest', 'en'), 'chest');
  assert.deepStrictEqual([kgTxt(42.5, 'en'), kgTxt(42.5, 'pl')], ['42.5', '42,5']);
  const se = stats(p, { 0: 5, 1: 4, 2: 30 }, {}, 'en');
  assert.strictEqual(cheer(se, was, 'Adrian', 'M', 'en'), 'You did it, Adrian! 1 rep more than last time. Keep it up! Biggest progress: push-up (+1).');
  assert.strictEqual(cheer(se, { ...was, reps: 12, per: [] }, '', 'K', 'en'), "Good job. Today 3 reps fewer than last time, and that's normal. Consistency is what counts.");
  assert.match(cheer(stats(g, { 0: 6, 1: 6, 2: 5, 3: 8, 4: 8 }, { 0: 40, 1: 40, 2: 42.5, 3: 8, 4: 8 }, 'en'), gw, '', 'M', 'en'), /Weight up: barbell back squat \(\+5 kg\)\.$/);
  globalThis.LANG = 'en';
  assert.match(summaryText(g, { 0: 6, 1: 6, 2: 5 }, '', 0, 60000, null, { kg: { 0: 40, 1: 40, 2: 42.5 } }), /Przysiad ze sztangą \(cel 3×6\): 6×40, 6×40, 5×42,5 kg/);
  globalThis.LANG = 'pl';
  // Zgodność plików z ankietą osoby: błędy kończą test kodem 1, uwagi trzeba świadomie sprawdzić (np. zgłoszony ból).
  if (ankietaPlik) {
    const a = JSON.parse(fs.readFileSync(path.resolve(ankietaPlik), 'utf8')), odp = a.odpowiedzi || a;
    const uw = [...(plans.length ? ZGODNOSC.plan(plans, odp) : []), ...diets.flatMap(d => ZGODNOSC.dieta(d, odp))];
    for (const u of uw) console.log(`${u.poziom === 'blad' ? 'BŁĄD ' : 'UWAGA'} ${u.tekst}`);
    const n = uw.filter(u => u.poziom === 'blad').length;
    console.log(n ? `ZGODNOŚĆ Z ANKIETĄ: ${n} do poprawienia. Nie oddawaj tego planu.` : `ZGODNOŚĆ Z ANKIETĄ: bez błędów${uw.length ? ', sprawdź uwagi' : ''}.`);
    if (n) process.exitCode = 1;
  }
  console.log(`OK: ${Object.keys(EXERCISES).length} ćwiczeń, mięśnie i animacje na miejscu` + (plans.length ? `; rozpiski: ${plans.map(p => p.name).join(', ')}` : '')
    + (diets.length ? `; diety: ${diets.map(d => d.name).join(', ')}` : ''));
}
