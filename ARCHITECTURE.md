# SKIN - Online Shop za Kožnu Galanteriju
## Arhitektonska Dokumentacija i Specifikacija Projekta

================================================================================
1. PREGLED PROJEKTA I TEMA
================================================================================
- **Aplikacija:** Online shop za prodavnicu kožne galanterije "Skin" (torbe, novčanici, kaiševi...).
- **Cilj:** Produkciono spremna (production-ready) e-commerce web aplikacija sa visokim nivoom bezbednosti.

================================================================================
2. MINIMALNI USLOVI PREDMETA (NEPROMENJIVA PRAVILA - PREPIS)
================================================================================
Brani se jedan projekat, koji pokriva sledeće celine:
· RxJS
· Angular
· NestJS

Potrebno je otvoriti Github nalog i u toku rada ažurirati repozitorijum. Preporučuje se inkrementalno postavljanje koda na Github (tj. u toku same izrade projekta), a ne samo po završetku projekta.

Temu aplikacije za svaki projekat birate sami, uz bitnu napomenu da se originalnost teme (u odnosu na druge projekte) ocenjuje. U ocenu osim originalnosti ulazi i kvalitet obrade teme (detaljnost i složenost same aplikacije), kvalitet napisanog koda (videti "Clean Code" - Robert Martin), kao i demonstriranje upotrebe traženih tehnologija (za svaki projekat je dat spisak).

### RXJS
· Funkcionalno programiranje i rad sa nizovima: `map`, `reduce`, `filter`, `forEach`
· Asinhrono programiranje: `fetch` API, `Promise`
· RxJS, operatori: `switchMap`, `take`, `takeUntil`, `zip`, `merge` (bar jedan combinational op)

### Angular
· Angular komponente i servisi
· Ulazni i izlazni parametri
· Dependency Injection
· NgRx Store, NgRx Entities
· NgRx Effects
· Rutiranje

### NestJS, Docker, DB
· Povezivanje na bazu
· Pokretanje baze preko Docker-a
· CRUD operacije nad entitetima
· Min tri entiteta sa relacijama
· Passport.js za auth

================================================================================
3. TEHNIČKA ARHITEKTURA I BAZA PODATAKA
================================================================================
- **Docker:** `docker-compose.yml` podiže PostgreSQL bazu (port 5432).
- **Backend:** NestJS sa TypeORM-om.
- **Entiteti i relacije (minimum 4 entiteta):**
  * `User` (1:N `Order`)
  * `Product` (1:N `OrderItem`)
  * `Order` (1:N `OrderItem`)
  * `OrderItem` (N:M spojni entitet sa dodatom količinom i cenom)
- **Frontend:** Angular (SCSS, bez SSR-a), NgRx (Store, Entities, Effects), RxJS operatori.

================================================================================
4. BEZBEDNOST (PRODUCTION-READY SECURITY)
================================================================================
- **Auth:** Passport.js + JWT strategija, `bcrypt` heširanje lozinki.
- **Sanitizacija & Validacija:** `class-validator` + `ValidationPipe` na svim DTO-ovima.
- **Zaštita od SQL Injection-a:** TypeORM parametrizovani upiti.
- **Rate Limiting:** `@nestjs/throttler` za zaštitu od DDoS/Brute-force napada.
- **HTTP Security:** `helmet` middleware.
- **Kredencijali:** Stroga upotreba `.env` i `.gitignore` (bez hardkodovanja tajni).

================================================================================
5. PLAĆANJE I INTEGRACIJE
================================================================================
- **Stripe (Test Mode):** Preko Stripe Elements na frontendu (PCI-DSS compliance).
- **Stripe Webhook:** Na backendu (`/api/payments/webhook`) koji obrađuje uspele uplate.
- **Logika nakon uplate:** Promena statusa porudžbine, smanjenje lagera (`stock`), simulacija API poziva kurirskoj službi za dobijanje `trackingNumber`.

================================================================================
6. PRAVILA ZA SVE BUDUĆE ITERACIJE (OPERATIVNI PROTOKOL)
================================================================================
1. Pri svakom zadatku ili izmeni koda, UVEK se konsultuj sa dokumentacionim fajlom koji sada praviš.
2. Kod piši inkrementalno, modul po modul (Clean Code principi).
3. Nemoj preskakati tražene specifične RxJS operatore i NgRx entitete.
4. Razvoj vodimo po principu razdvojenog frontenda i backenda (decoupled architecture).
