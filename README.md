# Emels Tasks

En lugn och mobilanpassad uppgiftsapp som gör vardagens rutiner och städning
lättare att komma igång med. Större uppgifter delas upp i små, tydliga delmål
och användaren får positiv återkoppling när en hel rutin eller task är klar.

> **Liveversion:** Lägg in projektets Vercel-länk här.

## Funktioner

- Dagliga morgon- och kvällsrutiner som återställs automatiskt nästa dag
- Städmallar med mindre, motiverande delmål
- Flera samtidiga tasks med sparade framsteg
- Möjlighet att avsluta och arkivera en task
- Positiva meddelanden när en rutin eller task blir färdig
- Bibliotek där städtasks kan läggas till och färdiga rutiner återställas
- Lösenordsfri inloggning via e-post
- Mobilanpassad navigering och stöd för installation som PWA

## Teknik

| Del | Teknik |
| --- | --- |
| Frontend | Next.js, React och TypeScript |
| Backend | Supabase |
| Databas | PostgreSQL via Supabase |
| Autentisering | Supabase Auth med magic link |
| Säkerhet | Row Level Security (RLS) |
| Hosting | Vercel |

## Arkitektur

Appen har ingen separat traditionell backendserver. Webbläsaren kommunicerar
med Supabase genom dess JavaScript-klient. Supabase ansvarar för autentisering,
databas och åtkomstkontroll.

```text
iPhone eller webbläsare
        ↓
Next.js-app på Vercel
        ↓
Supabase API
        ↓
Auth + PostgreSQL + RLS
```

RLS-reglerna gör att en inloggad användare bara kan läsa och ändra sina egna
tasks, delmål och rutinavbockningar.

## Projektstruktur

```text
app/
  page.tsx                 Sidans state och Supabase-anrop
  globals.css              Global design och mobilanpassning
  layout.tsx               Metadata och grundlayout

components/
  app-navigation.tsx       Navigering mellan appens lägen
  routine-view.tsx         Dagliga rutiner
  task-view.tsx            Aktuella tasks och checklistor
  library-view.tsx         Rutiner och städmallar i biblioteket
  app-dialogs.tsx          Bekräftelse- och gratulationsrutor
  auth-screens.tsx         Inloggning och konfigurationsvy

lib/
  app-data.ts              Standardrutiner, städmallar och meddelanden
  supabase.ts              Supabase-klienten
  types.ts                 Gemensamma TypeScript-typer

supabase/
  schema.sql               Komplett databasschema och RLS-regler
  migrations/              Stegvisa databasändringar
```

## Datamodell

- `tasks` innehåller användarens städuppgifter.
- `subtasks` innehåller delmålen för varje task.
- `routine_completions` sparar vilka rutinsteg som är klara ett visst datum.

Rutiner och städmallar definieras i koden. Supabase sparar användarens val och
framsteg.

## Köra projektet lokalt

### Förutsättningar

- Node.js 20.9 eller senare
- Ett Supabase-projekt

### Installation

```bash
git clone https://github.com/samtius/Emel-tasks.git
cd Emel-tasks
npm install
```

Skapa `.env.local` i projektroten:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ditt-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=din-publishable-key
```

Kör `supabase/schema.sql` i Supabase SQL Editor för en ny databas. För ett
befintligt projekt körs de saknade filerna i `supabase/migrations/` i
nummerordning.

Starta sedan utvecklingsservern:

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## Tillgängliga kommandon

```bash
npm run dev      # Starta lokal utvecklingsserver
npm run lint     # Kontrollera kodkvalitet
npm run build    # Skapa och verifiera produktionsbygget
npm run start    # Starta ett färdigbyggt produktionsbygge
```

## Miljövariabler och säkerhet

`.env.local` ska aldrig läggas till i Git. Projektets publishable key är avsedd
att användas i frontend, men en Supabase `service_role`-nyckel får aldrig läggas
i klientkod eller publiceras på GitHub.

## Bakgrund

Projektet skapades för att göra återkommande vardagsuppgifter mindre
överväldigande. Fokus ligger på enkel mobil användning, små genomförbara steg
och uppmuntrande återkoppling.
