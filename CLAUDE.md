# Trening: PWA na Androida (GitHub Pages)

Aplikacja treningowa (kalistenika) bez frameworków i bez builda. Repo jest **publiczne**: żadnych danych osobowych (wiek, waga, zdrowie) w plikach. Profil i postępy trzymamy w pamięci Claude.

## Nowa rozpiska (cotygodniowy cykl)
1. Wyniki przychodzą jako tekst z przycisku „Wyślij do Claude” w aplikacji.
2. Nadpisz `plans.json` (tablica treningów = bieżący tydzień):
   `{"name":"T2 · Góra A","note":"...","items":[{"ex":"podciaganie","sets":5,"reps":2,"rest":120,"note":"..."}]}`
   - `reps`: liczba albo tekst („8/noga”);
   - `time`: sekundy zamiast `reps`;
   - `rest`: przerwa po serii w sekundach, domyślnie 90.
3. Uruchom `node logic.js`. Musi wypisać `OK`, bo test sprawdza format, id ćwiczeń i pliki zdjęć.
4. Zrób `git commit` i `git push`. Telefon pobierze rozpiskę przy następnym otwarciu aplikacji.

Progresja: jedna zmiana na ćwiczenie na tydzień (+1 powtórzenie, +1 seria, słabsza guma albo bardziej stromy kąt TRX). Co 5–6 tygodni lżejszy tydzień.

## Nowe ćwiczenie
1. Dodaj wpis w `exercises.js`.
2. Pobierz zdjęcia z free-exercise-db (Unlicense) do `img/<Id>/0.jpg` i `1.jpg`:
   `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<Id>/<n>.jpg`.
   `img: 'Id/1'` oznacza jedną statyczną klatkę.
3. Podbij wersję `C` w `sw.js`, żeby nowe zdjęcia od razu trafiły do cache offline.

## Pliki
- `index.html`: interfejs.
- `logic.js`: logika i autotest.
- `exercises.js`: biblioteka ćwiczeń.
- `plans.json`: rozpiska na bieżący tydzień.
- `sw.js`: cache offline.
- `manifest.webmanifest`: instalacja aplikacji.
- Podgląd lokalny: konfiguracja „trening” w `C:\Claude\Others\.claude\launch.json`.
