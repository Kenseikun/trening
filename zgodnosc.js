// Zgodność rozpiski i diety z ankietą osoby. Używają jej `node logic.js --ankieta ...` (przed oddaniem planu) i panel trenera
// (ostrzeżenia przy podglądzie). Plik definiuje tylko globalThis.ZGODNOSC, żeby nie zderzyć się z nazwami w panelu.
// Każda funkcja zwraca listę { poziom: 'blad' | 'uwaga', tekst }. Błąd trzeba poprawić przed wysłaniem; uwagę trzeba świadomie sprawdzić.
// Dieta jest sprawdzana słowami kluczowymi (początek słowa): fałszywy alarm (np. mleczko kokosowe) jest lepszy niż przeoczone uczulenie.
globalThis.ZGODNOSC = (() => {
  const SPRZET = { DRAZEK: 'drążek', PORECZE: 'poręcze', HANTLE: 'hantle', KETTLE: 'kettlebell', TRX: 'TRX', GUMY: 'gumy', SILOWNIA: 'siłownia' };
  const RODZAJ = { SILOWNIA: 'siłownia', KALISTENIKA: 'kalistenika', DOM: 'trening w domu', OBA: 'różnie' };
  // Ból z ankiety → mięśnie główne ćwiczeń, które go obciążają (do przypomnienia, nie do blokady).
  const BOL = { BARKI: ['barki', ['shoulders', 'chest']], LOKCIE: ['łokcie', ['triceps', 'biceps']], NADGARSTKI: ['nadgarstki', ['forearms', 'chest', 'triceps']],
    PLECY: ['plecy', ['lowerback', 'hamstrings']], KOLANA: ['kolana', ['quads']], BIODRA: ['biodra', ['glutes', 'adductors', 'hamstrings']] };
  const ALERGENY = {
    ORZESZKI: ['orzeszki ziemne', ['arachid', 'orzeszk', 'masło orzechowe', 'masła orzechowego', 'peanut']],
    ORZECHY: ['orzechy', ['orzech', 'migdał', 'nerkowc', 'laskow', 'pistacj', 'pekan', 'makadami', 'marcepan', 'pralin', 'nutell', 'almond', 'cashew', 'walnut', 'hazelnut', 'pistachio', 'pecan']],
    GLUTEN: ['gluten', ['pszen', 'żyt', 'jęczmien', 'orkisz', 'owsian', 'owies', 'makaron', 'chleb', 'kromk', 'pieczyw', 'bułk', 'grzank', 'tortill', 'bulgur', 'kuskus', 'mąk', 'pęczak', 'piw', 'wheat', 'rye', 'barley', 'oat', 'pasta', 'bread', 'couscous', 'flour', 'beer']],
    MLEKO: ['mleko i laktoza', ['mlek', 'mlecz', 'jogurt', 'ser', 'twaróg', 'twarog', 'twaroż', 'kefir', 'skyr', 'śmietan', 'masł', 'fet', 'parmezan', 'mozzarell', 'maślank', 'serwatk', 'odżywk', 'milk', 'yogurt', 'yoghurt', 'cheese', 'butter', 'cream', 'whey']],
    JAJA: ['jaja', ['jaj', 'omlet', 'majonez', 'egg', 'mayo']],
    RYBY: ['ryby', ['ryb', 'łoso', 'dorsz', 'tuńczyk', 'makrel', 'śledź', 'śledzi', 'pstrąg', 'sardyn', 'mintaj', 'halibut', 'morszczuk', 'anchois', 'fish', 'salmon', 'tuna', 'cod']],
    SKORUPIAKI: ['skorupiaki i owoce morza', ['krewet', 'małż', 'kalmar', 'ośmiorni', 'krab', 'homar', 'langust', 'owoce morza', 'owoców morza', 'shrimp', 'prawn', 'mussel', 'squid', 'crab', 'lobster', 'seafood']],
    SOJA: ['soja', ['soj', 'tofu', 'tempeh', 'edamame', 'miso', 'soy']],
    SEZAM: ['sezam', ['sezam', 'tahin', 'hummus', 'chałw', 'sesame', 'halva']],
    SELER: ['seler', ['seler', 'celery']],
    GORCZYCA: ['gorczyca', ['gorczyc', 'musztard', 'mustard']],
    LUBIN: ['łubin', ['łubin', 'lupin']],
    SIARCZYNY: ['siarczyny', ['win', 'suszon', 'rodzyn', 'sulfit', 'sulphit']],
  };
  const MIESO_CZERWONE = ['wołow', 'wieprz', 'cielęc', 'jagnię', 'baranin', 'boczek', 'boczk', 'kiełbas', 'szynk', 'schab', 'karków', 'salami', 'kabanos', 'parówk', 'pasztet', 'stek', 'chili con carne', 'beef', 'pork', 'lamb', 'bacon', 'ham', 'sausage', 'steak'];
  const DROB_I_INNE = ['kurczak', 'kurcza', 'indyk', 'indycz', 'drób', 'drob', 'kacz', 'mięs', 'mielon', 'gulasz', 'rosół', 'żelatyn', 'smalec', 'chicken', 'turkey', 'duck', 'meat', 'gelatin'];
  const ODZYWIANIE = {
    BEZ_CZERWONEGO: ['bez czerwonego mięsa', MIESO_CZERWONE],
    PESKATARIANSKO: ['wegetariańsko z rybami', [...MIESO_CZERWONE, ...DROB_I_INNE]],
    WEGETARIANSKO: ['wegetariańsko', [...MIESO_CZERWONE, ...DROB_I_INNE, ...ALERGENY.RYBY[1], ...ALERGENY.SKORUPIAKI[1]]],
    WEGANSKO: ['wegańsko', [...MIESO_CZERWONE, ...DROB_I_INNE, ...ALERGENY.RYBY[1], ...ALERGENY.SKORUPIAKI[1], ...ALERGENY.MLEKO[1], ...ALERGENY.JAJA[1], 'miód', 'miod', 'honey']],
  };
  const CHOROBY = { CUKRZYCA: 'cukrzyca lub insulinooporność', NADCISNIENIE: 'nadciśnienie', NERKI: 'choroby nerek', TARCZYCA: 'choroby tarczycy',
    JELITA: 'choroby jelit', CIAZA: 'ciąża lub karmienie', ZABURZENIA: 'zaburzenia odżywiania', INNE: 'inna choroba' };
  const DNI = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
  const lista = (v = []) => [].concat(v ?? []).filter(x => x !== 'NIE' && x !== 'BRAK');
  // Pierwsze trafione słowo kluczowe na początku słowa (polskie litery: \p{L}).
  const traf = (tekst, slowa) => slowa.find(s => new RegExp(`(^|[^\\p{L}])${s}`, 'u').test(tekst));
  // Szacowany czas treningu w minutach (jak estimate() w logic.js): ok. 40 s na serię powtórzeń albo czas serii, plus przerwy.
  const minuty = p => { let t = 0, r = 0; for (const it of p.items) { const s = Math.max(1, parseInt(it.sets) || 1); r = it.rest == null ? 90 : +it.rest || 0; t += s * ((+it.time || 40) + r); } return Math.round((t - r) / 60); };
  const skrot = (a, n = 6) => a.slice(0, n).join('; ') + (a.length > n ? `; i jeszcze ${a.length - n}` : '');

  function plan(plans, odp, EX = globalThis.EXERCISES || {}) {
    if (!odp) return [{ poziom: 'blad', tekst: 'Brak ankiety: nie da się sprawdzić, czy rozpiska do niej pasuje.' }];
    const out = [], blad = tekst => out.push({ poziom: 'blad', tekst }), uwaga = tekst => out.push({ poziom: 'uwaga', tekst });
    const silownia = ['SILOWNIA', 'OBA'].includes(odp.rodzaj), ma = new Set(lista(odp.sprzet));
    for (const p of plans) for (const it of p.items || []) {
      const e = EX[it.ex], need = e?.sprzet || [], nazwa = `${p.name}: ${e?.name || it.ex}`;
      if (!e) continue;
      if (need.includes('SILOWNIA') && !silownia) blad(`${nazwa} wymaga siłowni, a osoba wybrała: ${RODZAJ[odp.rodzaj] || odp.rodzaj}.`);
      else if (odp.rodzaj === 'KALISTENIKA' && need.some(s => s === 'HANTLE' || s === 'KETTLE')) blad(`${nazwa}: ciężary przy kalistenice.`);
      const brak = silownia ? [] : need.filter(s => s !== 'SILOWNIA' && !ma.has(s));
      if (brak.length) blad(`${nazwa} wymaga sprzętu, którego osoba nie ma: ${brak.map(s => SPRZET[s]).join(', ')}.`);
    }
    if (odp.dni && plans.length > odp.dni) blad(`W rozpisce jest ${plans.length} treningów, a osoba może trenować ${odp.dni} dni w tygodniu.`);
    if (odp.czas) for (const p of plans) if (minuty(p) > odp.czas + 5) blad(`${p.name}: ok. ${minuty(p)} min, a osoba ma na trening ${odp.czas} min.`);
    for (const b of lista(odp.bol)) {
      if (!BOL[b]) { uwaga('Zgłoszony ból: coś innego. Dopytaj osobę, zanim wyślesz rozpiskę.'); continue; }
      const cw = [...new Set(plans.flatMap(p => (p.items || []).filter(it => EX[it.ex]?.p.some(m => BOL[b][1].includes(m))).map(it => EX[it.ex].name)))];
      uwaga(`Zgłoszony ból: ${BOL[b][0]}. ${cw.length ? `Sprawdź obciążenie w: ${cw.join(', ')}.` : 'W rozpisce nie ma ćwiczeń, które go wprost obciążają.'}`);
    }
    return out;
  }

  function dieta(d, odp) {
    if (!odp) return [{ poziom: 'blad', tekst: 'Brak ankiety: nie da się sprawdzić, czy dieta do niej pasuje.' }];
    const out = [], blad = tekst => out.push({ poziom: 'blad', tekst });
    if (!odp.odzywianie || !odp.alergie || !odp.choroby) blad('Ankieta nie ma pytań o dietę (sposób odżywiania, uczulenia, choroby). Osoba musi ją uzupełnić, zanim dostanie dietę.');
    const choroby = lista(odp.choroby);
    if (choroby.length) blad(`Osoba zgłosiła: ${choroby.map(c => CHOROBY[c] || c).join(', ')}. Dietę układa dietetyk albo lekarz, nie trener.`);
    // Każde danie z dnia i posiłku: nazwa, opis i notatka posiłku.
    const dania = (d.days || []).flatMap((day, i) => (day.meals || []).flatMap(m => (m.options || []).map(o => {
      const name = typeof o === 'string' ? o : o?.name || '', note = typeof o === 'string' ? '' : o?.note || '';
      return { gdzie: `${DNI[i]}, ${m.name}: ${name}`, tekst: `${name} ${note} ${m.note || ''}`.toLowerCase() };
    })));
    const sprawdz = (etykieta, slowa) => {
      const hits = dania.map(x => [x.gdzie, traf(x.tekst, slowa)]).filter(([, s]) => s).map(([g, s]) => `${g} (${s})`);
      if (hits.length) blad(`${etykieta}: ${skrot(hits)}.`);
    };
    for (const a of lista(odp.alergie)) if (ALERGENY[a]) sprawdz(`Uczulenie (${ALERGENY[a][0]})`, ALERGENY[a][1]);
    if (lista(odp.alergie).includes('INNE')) out.push({ poziom: 'uwaga', tekst: `Inne uczulenie: „${odp.alergie_inne || 'nie podano'}”. Sprawdź każde danie ręcznie.` });
    if (ODZYWIANIE[odp.odzywianie]) sprawdz(`Sposób odżywiania (${ODZYWIANIE[odp.odzywianie][0]})`, ODZYWIANIE[odp.odzywianie][1]);
    return out;
  }

  return { plan, dieta };
})();
