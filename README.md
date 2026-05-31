# Flatly - Platforma do zarządzania wynajmem nieruchomości

> **Projekt Inżynierski**  
> Kompleksowa aplikacja webowa wspierająca proces wynajmu i zarządzania nieruchomościami.

---

## Spis treści

- [O projekcie](#-o-projekcie)
- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [Struktura projektu](#-struktura-projektu)
- [Instalacja i uruchomienie](#-instalacja-i-uruchomienie)
- [Konfiguracja](#-konfiguracja)
- [Użytkowanie](#-użytkowanie)
- [API](#-api)
- [Baza danych](#-baza-danych)

---

## O projekcie

**Flatly** to nowoczesna platforma do zarządzania wynajmem nieruchomości, która łączy właścicieli, najemców i administratorów w jednym systemie. Aplikacja umożliwia publikowanie ofert, składanie wniosków o wynajem, zarządzanie umowami, obsługę płatności oraz komunikację między stronami.

---

## Funkcjonalności

### Dla wszystkich użytkowników
- **Wyszukiwarka nieruchomości** - zaawansowane filtrowanie po lokalizacji, typie, cenie
- **Przeglądanie ofert** - szczegółowe informacje o nieruchomościach z galerią zdjęć
- **Blog** - artykuły o nieruchomościach i poradach
- **Formularz kontaktowy** - możliwość wysłania wiadomości do administracji
- **Rejestracja i logowanie** - bezpieczny system autoryzacji

### Dla właścicieli nieruchomości
- **Dodawanie i edycja ogłoszeń** - pełne zarządzanie ofertami
- **Zarządzanie wnioskami** - akceptacja/odrzucenie zgłoszeń najemców
- **Generowanie umów** - automatyczne tworzenie dokumentów umowy najmu
- **Zarządzanie płatnościami** - śledzenie opłat i faktur
- **Komunikacja z najemcami** - wiadomości w ramach rezerwacji

### Dla najemców
- **Składanie wniosków** - aplikowanie o wynajem nieruchomości
- **Śledzenie rezerwacji** - status wniosków i umów
- **Płatności online** - opłacanie czynszu i kaucji
- **Komunikacja** - wiadomości z właścicielami i administracją
- **Dokumenty** - dostęp do umów i dokumentów

### Dla administratorów
- **Panel administracyjny** - kompleksowe zarządzanie platformą
- **Moderacja ogłoszeń** - przeglądanie i usuwanie ofert
- **Zarządzanie użytkownikami** - nadawanie uprawnień administratora
- **Status umów** - monitorowanie wszystkich rezerwacji
- **Zarządzanie blogiem** - dodawanie i usuwanie artykułów
- **Skrzynka odbiorcza** - odpowiedzi na wiadomości kontaktowe
- **Wiadomości do użytkowników** - możliwość wysyłania wiadomości systemowych
=======
## Flatly – platforma do zarządzania wynajmem nieruchomości

> **Projekt inżynierski**  
> Aplikacja webowa usprawniająca proces wynajmu nieruchomości – od przeglądania ofert, przez zarządzanie ogłoszeniami, po obsługę najemców.  
> Planowana jest integracja z asystentem AI (OpenAI API).

---

### Główne funkcjonalności

### Frontend
- **React 19** - biblioteka UI
- **Vite** - narzędzie do budowania
- **React Router DOM** - routing
- **Tailwind CSS** - framework CSS
- **Supabase Client** - klient bazy danych

### Backend
- **Node.js** - środowisko wykonawcze
- **Express** - framework webowy
- **Supabase** - backend-as-a-service (PostgreSQL)

### Baza danych
- **PostgreSQL** (via Supabase)
- **Row Level Security (RLS)** - bezpieczeństwo danych
- **Realtime subscriptions** - aktualizacje w czasie rzeczywistym

### Narzędzia deweloperskie
- **ESLint** - linting kodu
- **PostCSS** - przetwarzanie CSS
- **Autoprefixer** - automatyczne prefiksy CSS

---

## Struktura projektu

```
Zarzadzanie-wynajmem-nieruchomosci/
├── client/                 # Frontend (React)
│   ├── public/            # Pliki statyczne
│   ├── src/
│   │   ├── components/    # Komponenty React
│   │   │   ├── Hero.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── TenantDashboard.jsx
│   │   │   └── ...
│   │   ├── pages/        # Strony aplikacji
│   │   │   ├── Home.jsx
│   │   │   ├── AllOffers.jsx
│   │   │   ├── PropertyDetails.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ...
│   │   ├── App.jsx       # Główny komponent
│   │   ├── AuthContext.jsx
│   │   └── supabaseClient.js
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Backend (Express)
│   ├── index.js          # Główny plik serwera
│   └── package.json
│
└── README.md
```

---

## Instalacja i uruchomienie

### Wymagania wstępne
- **Node.js** (wersja 18 lub nowsza)
- **npm** lub **yarn**
- Konto **Supabase** z utworzonym projektem

### Krok 1: Klonowanie repozytorium
```bash
git clone <url-repozytorium>
cd Zarzadzanie-wynajmem-nieruchomosci
```

### Krok 2: Instalacja zależności

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd server
npm install
```

### Krok 3: Konfiguracja

#### Frontend - Supabase Client
W folderze `client/src` utwórz plik `supabaseClient.js` (jeśli nie istnieje) z konfiguracją:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Backend - Zmienne środowiskowe
W folderze `server` utwórz plik `.env`:

```env
PORT=5000
SUPABASE_URL=twoj_url_supabase
SUPABASE_SERVICE_KEY=twoj_klucz_service_role
```

### Krok 4: Uruchomienie

**Terminal 1 - Frontend:**
```bash
cd client
npm run dev
```
Aplikacja będzie dostępna pod adresem: `http://localhost:5173`

**Terminal 2 - Backend (opcjonalnie):**
```bash
cd server
node index.js
```
Serwer będzie dostępny pod adresem: `http://localhost:5000`

---

## Konfiguracja

### Konfiguracja Supabase

1. **Utwórz projekt** na [supabase.com](https://supabase.com)
2. **Skonfiguruj tabele** w bazie danych:
   - `profiles` - profile użytkowników
   - `properties` - nieruchomości
   - `property_images` - zdjęcia nieruchomości
   - `bookings` - rezerwacje/umowy
   - `messages` - wiadomości między użytkownikami
   - `articles` - artykuły blogowe
   - `contact_messages` - wiadomości kontaktowe
   - `payments` - płatności

3. **Skonfiguruj Row Level Security (RLS)**:
   - Włącz RLS dla wszystkich tabel
   - Utwórz polityki dostępu dla użytkowników, właścicieli i administratorów

4. **Pobierz klucze API**:
   - URL projektu
   - Anon Key (dla frontendu)
   - Service Role Key (dla backendu - NIE UDOSTĘPNIAJ PUBLICZNIE!)

### Konfiguracja autoryzacji

Aplikacja używa Supabase Auth do zarządzania użytkownikami:
- Rejestracja przez email/hasło
- Automatyczne tworzenie profilu w tabeli `profiles`
- Rola administratora ustawiana w kolumnie `is_admin` w tabeli `profiles`

---

## Użytkowanie

### Rejestracja i logowanie
1. Przejdź do `/register` aby utworzyć konto
2. Wypełnij formularz rejestracyjny
3. Zaloguj się przez `/login`
4. Administratorzy są automatycznie przekierowywani do `/admin`

### Dodawanie nieruchomości (Właściciel)
1. Zaloguj się jako właściciel
2. Przejdź do `/dodaj-ogloszenie`
3. Wypełnij formularz z danymi nieruchomości
4. Dodaj zdjęcia
5. Opublikuj ogłoszenie

### Składanie wniosku (Najemca)
1. Przeglądaj oferty na `/oferty`
2. Wybierz interesującą nieruchomość
3. Kliknij "Złóż wniosek"
4. Wypełnij formularz rezerwacji

### Panel administratora
1. Zaloguj się jako administrator
2. Automatyczne przekierowanie do `/admin`
3. Zarządzaj:
   - Ogłoszeniami (moderacja)
   - Użytkownikami (nadawanie uprawnień)
   - Umowami (monitorowanie statusu)
   - Blogiem (dodawanie artykułów)
   - Skrzynką odbiorczą (odpowiedzi na wiadomości)

---

## API

### Endpointy backendu (Express)

#### GET `/api/properties`
Pobiera listę nieruchomości z filtrowaniem.

**Query parameters:**
- `city` - filtrowanie po mieście
- `minPrice` - minimalna cena
- `maxPrice` - maksymalna cena
- `type` - typ (rent/sale)

**Przykład:**
```bash
GET /api/properties?city=Warszawa&minPrice=1000&maxPrice=5000&type=rent
```

---

## Baza danych

### Główne tabele

#### `profiles`
- `id` (UUID) - ID użytkownika (powiązane z auth.users)
- `email` (text)
- `full_name` (text)
- `is_admin` (boolean) - flaga administratora
- `created_at` (timestamp)

#### `properties`
- `id` (UUID)
- `owner_id` (UUID) - właściciel
- `title` (text)
- `description` (text)
- `address_city` (text)
- `address_street` (text)
- `price_per_month` (numeric)
- `type` (text) - 'rent' lub 'sale'
- `status` (text) - 'available', 'rented'
- `created_at` (timestamp)

#### `bookings`
- `id` (UUID)
- `property_id` (UUID)
- `tenant_id` (UUID) - najemca
- `status` (text) - 'pending', 'accepted', 'signed', 'completed', 'rejected'
- `created_at` (timestamp)

#### `messages`
- `id` (UUID)
- `sender_id` (UUID)
- `receiver_id` (UUID)
- `booking_id` (UUID) - opcjonalne, dla wiadomości związanych z rezerwacją
- `content` (text)
- `is_read` (boolean)
- `created_at` (timestamp)

#### `articles`
- `id` (UUID)
- `title` (text)
- `excerpt` (text)
- `content` (text)
- `image_url` (text)
- `created_at` (timestamp)

#### `contact_messages`
- `id` (UUID)
- `full_name` (text)
- `email` (text)
- `subject` (text)
- `message` (text)
- `status` (text) - 'new', 'read', 'replied'
- `created_at` (timestamp)

---

## Bezpieczeństwo

- **Row Level Security (RLS)** - kontrola dostępu na poziomie wierszy
- **Autoryzacja** - Supabase Auth z JWT tokenami
- **Service Role Key** - używany tylko po stronie serwera
- **Walidacja danych** - sprawdzanie danych wejściowych
- **HTTPS** - wymagane w produkcji

---

## Licencja

Projekt inżynierski - do użytku edukacyjnego.

---

## Autor

Projekt realizowany w ramach pracy inżynierskiej.

---

## Znane problemy / TODO

- [ ] Integracja z OpenAI API (planowane)
- [ ] Powiadomienia email
- [ ] System ocen i recenzji
- [ ] Eksport dokumentów do PDF
- [ ] Integracja płatności online (Stripe/PayPal)

---

## Kontakt

W razie pytań lub problemów, skontaktuj się przez formularz kontaktowy w aplikacji lub utwórz issue w repozytorium.

---

**Ostatnia aktualizacja:** 2024
=======
- **Przeglądanie ofert**: lista nieruchomości z filtrowaniem (miasto, cena, typ), podgląd szczegółów oferty i zdjęć.
- **Panel najemcy (`/dashboard`)**: dostęp do podstawowych informacji o koncie i wynajmie (rozszerzalne w przyszłości).
- **Panel administratora (`/admin`)**: dodawanie, edycja i zarządzanie ofertami.
- **Autoryzacja z Supabase**: logowanie, rejestracja i zarządzanie sesją użytkownika (role przechowywane w metadanych użytkownika).
- **Strony marketingowo-informacyjne**: blog, cennik, kontakt, regulamin, polityka prywatności, ochrona danych.
- **Specjalne widoki dokumentów**: podstrony dla umowy najmu i wizyty u notariusza (do dalszego rozwijania).

---

### Architektura i technologie

Projekt jest zorganizowany w stylu **monorepo** z podziałem na `client` i `server`:

- **Frontend (`client/`)**
  - **Technologie**: React 19, Vite, React Router, Tailwind CSS.
  - **Integracje**: `@supabase/supabase-js` (autoryzacja i dane użytkownika).
  - **Główne elementy**:
    - `src/App.jsx` – konfiguracja routingu i layoutu,
    - `src/AuthContext.jsx` – kontekst uwierzytelniania (Supabase),
    - `src/pages/*` – widoki stron (oferty, blog, dashboard, itp.),
    - `src/components/*` – komponenty wspólne (navbar, hero, karty ofert, stopka).

- **Backend (`server/`)**
  - **Technologie**: Node.js, Express, `@supabase/supabase-js`, `cors`, `dotenv`.
  - **API**:
    - `GET /api/properties` – pobieranie ofert z tabeli `properties` (zależnie od filtrów: miasto, cena, typ, sortowanie po `created_at`).
  - **Baza danych**: Supabase (PostgreSQL), z relacją do tabeli `property_images`.

---

### Struktura repozytorium

- **`client/`**: aplikacja frontendowa (React + Vite).
- **`server/`**: proste API w Express do pobierania ofert z Supabase.
- **`README.md`**: ten plik – ogólny opis projektu.

---

## Uruchomienie projektu lokalnie

Do uruchomienia potrzebujesz:

- **Node.js** (zalecane: LTS, np. 18+),
- **npm** (instalowany razem z Node).

Zalecane są **dwa oddzielne terminale** – jeden dla frontendu, drugi dla backendu.

---

### Konfiguracja Supabase – backend (`server/`)

1. Wejdź do katalogu `server`:

   ```bash
   cd server
   ```

2. Zainstaluj zależności:

   ```bash
   npm install
   ```

3. Utwórz plik `.env` w folderze `server` i uzupełnij go swoimi danymi z Supabase:

   ```env
   PORT=5000
   SUPABASE_URL=twoj_url_supabase
   SUPABASE_SERVICE_KEY=twoj_klucz_service_role
   ```

   - **`SUPABASE_SERVICE_KEY`**: to klucz typu *service_role* – **nie udostępniaj go w frontencie ani publicznie**.

4. Uruchom serwer (jedna z opcji):

   ```bash
   # klasycznie
   node index.js

   # albo z automatycznym restartem (jeśli korzystasz z nodemon)
   npx nodemon index.js
   ```

   Serwer będzie domyślnie dostępny pod adresem: `http://localhost:5000`.

---

### Konfiguracja Supabase – frontend (`client/`)

1. Wejdź do katalogu `client`:

   ```bash
   cd client
   ```

2. Zainstaluj zależności:

   ```bash
   npm install
   ```

3. Skonfiguruj połączenie z Supabase:

   - Otwórz plik `src/supabaseClient.js`.
   - Podmień wartości:

   ```js
   const supabaseUrl = "https://twoj-projekt.supabase.co";
   const supabaseKey = "TWÓJ_PUBLICZNY_ANON_KEY";
   ```

   - Uwaga: to **klucz publiczny ANON**, inny niż `service_role` używany w backendzie.

4. Uruchom frontend w trybie deweloperskim:

   ```bash
   npm run dev
   ```

   Vite poda adres (np. `http://localhost:5173`), pod którym działa aplikacja.

---

### Typowy workflow uruchomienia

- **Terminal 1** – backend:

  ```bash
  cd server
  npm install        # tylko przy pierwszym uruchomieniu
  node index.js
  ```

- **Terminal 2** – frontend:

  ```bash
  cd client
  npm install        # tylko przy pierwszym uruchomieniu
  npm run dev
  ```

Po poprawnej konfiguracji Supabase i uruchomieniu obu części, aplikacja będzie mogła pobierać oferty z endpointu `GET /api/properties` oraz korzystać z logowania przez Supabase.

---

### Budowanie frontendu (wersja produkcyjna)

W katalogu `client` możesz zbudować produkcyjną wersję aplikacji:

```bash
cd client
npm run build
```

Podgląd builda lokalnie:

```bash
npm run preview
```
>>>>>>> 840aaea1865407673151725644d06c062753f801
