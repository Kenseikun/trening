# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Jeden użytkownik (właściciel repozytorium). Trenuje kalistenikę (drążek, poręcze do dipów, TRX, gumy) cztery razy w tygodniu, głównie **na dworze, w parku do street workoutu, w dziennym świetle, często w słońcu**. Telefon **bierze do ręki między seriami**: czyta z bliska i klika po każdej serii, zwykle spoconymi dłońmi i w trakcie zadyszki.

## Product Purpose
Aplikacja prowadzi przez trening ułożony przez Claude:
- pokazuje, co i ile teraz zrobić, razem z techniką (własna animacja ruchu z pracującymi mięśniami i instrukcja po polsku);
- odlicza przerwę;
- zbiera faktyczne wyniki serii;
- oddaje podsumowanie do Claude, który na jego podstawie układa kolejny tydzień.

Sukces to trening wykonany bez zastanawiania się, co dalej, i rzetelny log do progresji.

## Positioning
To nie jest katalog treningów ani aplikacja fitness z subskrypcją. Plan pisze osobisty trener (Claude) pod wyniki konkretnej osoby, a aplikacja jest wykonawcą tego planu i dziennikiem, który wraca do trenera.

## Operating Context
- **Cotygodniowy cykl:** Claude wysyła `plans.json` (git push, GitHub Pages) → trening w parku → „Wyślij do Claude” (menu udostępniania Androida / schowek) → nowy tydzień.
- **Offline:** aplikacja musi działać bez zasięgu.
- **Rozpiski z czatu:** alternatywnie przez Import (JSON wklejony z czatu Claude).

## Capabilities and Constraints
- Statyczny HTML/CSS/JS, bez frameworków i bez builda.
- PWA instalowana z Chrome na Androidzie.
- Service worker: offline i cache zdjęć.
- Publiczne repo na GitHub Pages, więc żadnych danych osobowych w plikach.
- Interfejs po polsku.
- Animacje ćwiczeń są własne (`moves.js`): postać z obrysów, mięśnie czerwienieją przy spięciu, sprzęt zielony, guma niebieska. Zdjęcia z free-exercise-db usunięto na życzenie użytkownika (2026-09-29).
- **Funkcje:**
  - lista treningów tygodnia;
  - trening seria po serii (licznik powtórzeń, serie na czas z przygotowaniem 5 s);
  - przerwa z −15 s / Pomiń / +15 s, piknięcia, wibracja, Wake Lock;
  - pominięcie ćwiczenia i zakończenie;
  - wznawianie po zamknięciu;
  - podsumowanie z uwagami;
  - historia;
  - biblioteka ćwiczeń;
  - import i instrukcja dla Claude.
- Logika w `logic.js` (z autotestem), biblioteka w `exercises.js`.
- **Na życzenie użytkownika (2026-09-29):**
  - wskazanie pracujących mięśni (postać przód i tył) dla całego treningu i dla każdego ćwiczenia, z udziałem serii w %;
  - statystyki na koniec treningu (liczby, procenty) z porównaniem do poprzedniego treningu tego samego typu (np. „Góra A” z poprzedniego tygodnia);
  - animacja przy otwarciu aplikacji.

## Brand Commitments
Brak wiążących. Nazwa „Trening” i obecna ikona mogą się zmienić.

## Evidence on Hand
- Prawdziwe treści: `plans.json` (tydzień 1, 4 treningi) i `exercises.js` (36 ćwiczeń z instrukcjami).
- Brak statystyk, wykresów i historii poza tym, co użytkownik sam zapisze.

## Product Principles
- Czytelność w słońcu i dla zmęczonego człowieka jest ważniejsza od efektu. Duży tekst, duże cele dotyku.
- Na każdym ekranie jedna oczywista następna czynność.
- Animacje ćwiczeń mają dokładnie pokazywać wykonanie: pełny zakres ruchu i szczegóły techniki, zrozumiałe dla osoby początkującej.
- Żadnej grywalizacji ani motywacyjnego szumu. Aplikacja jest narzędziem trenera, nie rozrywką.
- Nie wyglądać jak typowa aplikacja fitness (gradienty, neon, generyczne kafelki).
- Dane treningu nie mogą przepaść: wznawianie i zapis mają pierwszeństwo przed wygodą.

## Accessibility & Inclusion
Użycie w pełnym słońcu i spoconymi rękami: wysoki kontrast, cele dotyku co najmniej 44–48 px (główny przycisk ok. 54 px), tekst treningowy czytelny bez zbliżania telefonu. Na życzenie użytkownika (2026-09-30) przyciski i zegar są mniejsze, żeby ekrany mieściły się bez uciętych obrazów i tekstu.
