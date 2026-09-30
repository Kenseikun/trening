# Trening: PWA na Androida (GitHub Pages)

Aplikacja treningowa (kalistenika) bez frameworków i bez builda. Nic na ekranie telefonu nie może być ucięte: trening, przerwa i pierwsza strona startu dopasowują się do wysokości ekranu, a przewijanie ma zaczynać nową treść. Repo jest **publiczne**: żadnych danych osobowych (wiek, waga, zdrowie) w plikach. Profil i postępy trzymamy w pamięci Claude.

## Nowa rozpiska (cotygodniowy cykl)
1. Wyniki przychodzą jako tekst z przycisku „Wyślij do Claude” w aplikacji.
2. Nadpisz `plans.json` (tablica treningów = bieżący tydzień):
   `{"name":"T2 · Góra A","note":"...","items":[{"ex":"podciaganie","sets":5,"reps":2,"rest":120,"note":"..."}]}`
   - `reps`: liczba albo tekst („8/noga”);
   - `time`: sekundy zamiast `reps`;
   - `rest`: przerwa po serii w sekundach, domyślnie 90.
3. Uruchom `node logic.js`. Musi wypisać `OK`, bo test sprawdza format, id ćwiczeń, mięśnie i animacje.
4. Zrób `git commit` i `git push`. Telefon pobierze rozpiskę przy następnym otwarciu aplikacji.

Progresja: jedna zmiana na ćwiczenie na tydzień (+1 powtórzenie, +1 seria, słabsza guma albo bardziej stromy kąt TRX). Co 5–6 tygodni lżejszy tydzień.

## Nowe ćwiczenie
1. Dodaj wpis w `exercises.js`, razem z mięśniami: `p` (główne) i `s` (pomocnicze), klucze z `MUSCLES`. Z nich powstają postać z mięśniami i udziały w %.
2. Dopisz animację w `moves.js`: wpis w `EX_MOVE` (ćwiczenie → ruch z `MOVES`). Nowy ruch to poza A (luz) i B (spięcie). Podgląd wszystkich (start, połowa ruchu, koniec): `.impeccable/audit.html`, z `?ex=id,id` dla wybranych.
   - Priorytet: ma być dokładnie widać, jak wykonać ćwiczenie, także dla osoby, która nigdy nie trenowała.
   - Widok dobieraj tak, żeby ruch leżał w płaszczyźnie obrazu: drążek i gumy od przodu (`front: true`), reszta z boku.
   - Pokazuj pełny zakres i punkty techniki (np. w podciąganiu głowa nad drążkiem do szyi).
   - Guma jest niebieska, pozostały sprzęt zielony.
   - Ciało proste od kostek (deska, pompka, wiosłowanie): pomiń `h`, biodro wyniknie z `F` i `t`. Proste ręce, które nie trzymają nieruchomego sprzętu: `a` (kąt) zamiast `H`.
   - Taśma TRX się nie rozciąga: dłoń albo stopa w pozie A i B jest w tej samej odległości od zaczepu. Pilnuje tego `node logic.js`.
   - Liczby w animacji mają zgadzać się z instrukcją (np. dipy do 90° w łokciu, tylne kolano we wykroku nad ziemią).
   - Każdą nową pozę obejrzyj w podglądzie na starcie, w połowie ruchu i na końcu.
3. Podbij wersję `C` w `sw.js`. Dotyczy to każdej zmiany w aplikacji, nie tylko nowych ćwiczeń: po zmianie `sw.js` otwarta aplikacja pokazuje komunikat „Nowa wersja” i przeładowuje się po zgodzie.

## Pliki
- `index.html`: interfejs.
- `logic.js`: logika i autotest.
- `exercises.js`: biblioteka ćwiczeń.
- `moves.js`: animacje ćwiczeń (postać z boku albo od przodu, mięśnie czerwienieją przy spięciu, sprzęt zielony, guma niebieska).
- `plans.json`: rozpiska na bieżący tydzień.
- `sw.js`: cache offline.
- `manifest.webmanifest`: instalacja aplikacji.
- Podgląd lokalny: konfiguracja „trening” (port 8080) albo „trening-2” (port 8081, gdy pierwszy port trzyma inny czat) w `C:\Claude\Others\.claude\launch.json`.
