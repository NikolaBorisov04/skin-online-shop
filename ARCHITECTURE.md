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
- **Auth:** Passport.js + JWT strategija, `bcrypt` heširanje lozinki. Sinhronizovana vidljivost lozinki u formama i uslovno onemogućavanje unosa radi sprečavanja grešaka.
- **Sanitizacija & Validacija:** `class-validator` + `ValidationPipe` na svim DTO-ovima.
- **Zaštita od SQL Injection-a:** TypeORM parametrizovani upiti.
- **Rate Limiting:** `@nestjs/throttler` za zaštitu od DDoS/Brute-force napada.
- **HTTP Security:** `helmet` middleware.
- **Kredencijali:** Stroga upotreba `.env` i `.gitignore` (bez hardkodovanja tajni).

================================================================================
5. PLAĆANJE I INTEGRACIJE (ALLSECURE PAYMENT GATEWAY)
================================================================================
- **AllSecure Payment Gateway (Srbija / Dinarski platni promet):**
  * Licencirani regionalni payment gateway sa podrškom za DinaCard, Visa, MasterCard i Maestro kartice domaćih i inostranih banaka u dinarskoj valuti (RSD).
  * Potpuna usklađenost sa PCI-DSS Level 1 i 3D Secure 2.0 (Verified by Visa / MasterCard Identity Check) standardima bezbednosti.

- **Proces i Tok Integracije (Server-to-Server REST / Checkout Flow):**
  1. **Inicijacija porudžbine (Angular Frontend -> NestJS Backend):**
     - Korisnik potvrđuje porudžbinu u korpi. Frontend šalje zahtev `POST /api/orders` sa stavkama i podacima o kupcu.
  2. **Inicijalizacija transakcije sa AllSecure API (NestJS Backend):**
     - NestJS poziva AllSecure API endpoint (`/api/v3/purchase` ili `/checkout`) prosleđujući parametre porudžbine (`amount`, `currency: 'RSD'`, `orderId`, `successUrl`, `cancelUrl`, `callbackUrl`).
     - Zahtev se bezbedno potpisuje generisanjem SHA384/SHA512/HMAC potpisa pomoću `Shared Secret` i `API Key` parametara skladištenih u `.env` fajlu.
  3. **Preusmeravanje ili Hosted Form (Angular Frontend):**
     - AllSecure vraća bezbedni `redirectUrl` ili `paymentToken`. Frontend preusmerava kupca na bezbednu AllSecure 3D Secure stranicu za unos podataka sa kartice.
  4. **Asinhroni Callback / Webhook (AllSecure Server -> NestJS Backend):**
     - Nakon obrade kartice, AllSecure šalje server-to-server obaveštenje na `POST /api/payments/callback`.
     - NestJS validira autentičnost obaveštenja proverom SHA potpisa.
  5. **Poslovna logika nakon uplate (NestJS Backend):**
     - Ako je transakcija odobrena (`status: APPROVED`):
       * Promena statusa porudžbine u baza podataka u `PAID` / `PROCESSING`.
       * Smanjenje lagera proizvoda (`stock`) u bazi.
       * Generisanje Bex Express broja pošiljke (`trackingNumber`) kroz simulirani API servis kurirske službe.
  6. **Završetak i povratak kupca:**
     - AllSecure preusmerava kupca na frontend stranicu za potvrdu porudžbine (`/porudzbina/uspeh`).

================================================================================
6. PRAVILA ZA SVE BUDUĆE ITERACIJE (OPERATIVNI PROTOKOL)
================================================================================
1. Pri svakom zadatku ili izmeni koda, UVEK se konsultuj sa dokumentacionim fajlom koji sada praviš.
2. Kod piši inkrementalno, modul po modul (Clean Code principi).
3. Nemoj preskakati tražene specifične RxJS operatore i NgRx entitete.
4. Razvoj vodimo po principu razdvojenog frontenda i backenda (decoupled architecture).
