// Czysta logika, bez DOM. Ładowana przez index.html i sw.js; `node logic.js` uruchamia autotest.

// Klatki animacji ćwiczenia: 'Folder' → dwie, 'Folder/1' → jedna.
function frames(e) {
  if (!e?.img) return [];
  return e.img.includes('/') ? [`img/${e.img}.jpg`] : [0, 1].map(n => `img/${e.img}/${n}.jpg`);
}

// Rozpiska (jeden trening albo tablica, np. wklejona od Claude) → tablica treningów z domyślnymi wartościami.
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

// Podsumowanie do wklejenia Claude'owi. log: {indeks serii: wynik}.
function summaryText(plan, log, note, t0, t1) {
  const st = steps(plan);
  const lines = [`Trening: ${plan.name} (${new Date(t0).toISOString().slice(0, 10)}, ${Math.round((t1 - t0) / 60000)} min)`];
  const skipped = [];
  plan.items.forEach((it, item) => {
    const vals = st.map((s, i) => s.item === item && log[i] != null ? log[i] + (it.time ? ' s' : '') : null).filter(v => v != null);
    if (vals.length) lines.push(`${exName(it)} (cel ${it.sets}×${it.time ? it.time + ' s' : it.reps}): ${vals.join(', ')}`);
    else skipped.push(exName(it));
  });
  if (skipped.length) lines.push(`Pominięte: ${skipped.join(', ')}`);
  if (note?.trim()) lines.push(`Uwagi: ${note.trim()}`);
  return lines.join('\n');
}

// Instrukcja dla dowolnego czatu z Claude, żeby oddał rozpiskę w formacie aplikacji.
function claudePrompt(exercises, history) {
  return [
    'Przygotuj rozpiskę treningu do mojej aplikacji. Odpowiedz samym JSON-em: jeden trening albo tablica treningów, w formacie:',
    '{"name":"T2 · Góra A","note":"...","items":[{"ex":"podciaganie","sets":5,"reps":2,"rest":120,"note":"..."},{"ex":"plank","sets":3,"time":40,"rest":45}]}',
    'reps: liczba albo tekst (np. "8/noga"); time: sekundy (zamiast reps); rest: przerwa po serii w sekundach.',
    'Dostępne ćwiczenia (ex): ' + Object.entries(exercises).map(([id, e]) => `${id} (${e.name})`).join(', ') + '.',
    'Ćwiczenie spoza listy: własne "ex" i "name".',
    ...(history.length ? ['', 'Moje ostatnie treningi:', ...history.slice(0, 3)] : []),
  ].join('\n');
}

if (typeof module !== 'undefined' && require.main === module) {
  const assert = require('node:assert'), fs = require('node:fs'), path = require('node:path');
  require('./exercises.js');
  const plans = normalize(JSON.parse(fs.readFileSync(path.join(__dirname, 'plans.json'), 'utf8')));
  for (const p of plans) for (const it of p.items) assert(EXERCISES[it.ex], `${p.name}: nieznane ćwiczenie "${it.ex}"`);
  for (const [id, e] of Object.entries(EXERCISES)) for (const f of frames(e)) assert(fs.existsSync(path.join(__dirname, f)), `${id}: brak ${f}`);

  const p = normalize({ name: 'x', items: [{ ex: 'pompki', sets: 2, reps: 5, rest: 60 }, { ex: 'plank', sets: 1, time: 30 }] })[0];
  assert.deepStrictEqual(steps(p), [{ item: 0, set: 1, rest: 60 }, { item: 0, set: 2, rest: 60 }, { item: 1, set: 1, rest: 0 }]);
  assert.throws(() => normalize({ name: 'x', items: [{ ex: 'a', sets: 3 }] }), /reps/);
  assert.strictEqual(fmt(125), '2:05');
  const sum = summaryText(p, { 0: 5, 1: 4 }, 'ok', 0, 60000);
  assert.match(sum, /Pompki \(cel 2×5\): 5, 4/);
  assert.match(sum, /Pominięte: Deska/);
  console.log(`OK: ${plans.length} treningi, ${Object.keys(EXERCISES).length} ćwiczeń, zdjęcia na miejscu`);
}
