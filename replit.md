# APEX by Nick - Fitness Training Tracker

## Overview

APEX by Nick is a German-language fitness studio web application that allows authenticated users to manage their training plans, days, and exercises. Users can create training plans (e.g. Upper/Lower) that contain collapsible training days, add exercises with sets/weights/increments, increment or decrement weights, and view graphical weight-progression charts per exercise. The app features a dark-mode-first aesthetic with neon green accents, designed to feel like a modern fitness studio.

The project follows a full-stack TypeScript monorepo architecture with a React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, dark mode by default
- **Build Tool**: Vite with HMR support
- **Fonts**: DM Sans (body), Outfit (display/headings)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

The frontend has a tab-based layout with bottom navigation for authenticated users:
- **Landing page** (`/`) - Public marketing page shown to unauthenticated users
- **Plans page** (`/plans`) - Manage training plans with collapsible days and exercises
- **Days page** (`/days`) - Manage standalone training days (not assigned to a plan)
- **Active Training page** (`/training`) - Select a training day and work through exercises with rep-completion checkmarks and exercise completion tracking
- **Analytics page** (`/analytics`) - View percentage weight changes over the past 30 days per exercise
- **Profile page** (`/profile`) - User info and logout

**Key Frontend Files:**
- `client/src/components/layout/Shell.tsx` - Layout wrapper with header and bottom navigation bar
- `client/src/components/training.tsx` - Shared training components (ExerciseRow, AddExerciseForm, TrainingDayItem, TrainingPlanSection, WeightHistoryDialog)
- `client/src/pages/ActiveTraining.tsx` - Active workout mode with per-exercise rep-completion toggle and exercise completion flow

### Backend (server/)
- **Framework**: Express.js on Node with TypeScript
- **Runtime**: tsx for development, esbuild for production builds
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Authentication**: Replit Auth via OpenID Connect (OIDC) with Passport.js
- **Session Management**: express-session with connect-pg-simple (PostgreSQL-backed sessions)
- **Server Entry**: `server/index.ts` creates HTTP server, registers routes, sets up Vite dev middleware or static serving

### Database
- **Database**: PostgreSQL (required, referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization
- **Tables**:
  - `users` - User profiles (managed by Replit Auth)
  - `sessions` - Session storage (mandatory for Replit Auth)
  - `training_plans` - Top-level training plan containers per user (e.g. "Upper/Lower")
  - `training_days` - Training day plans per user, optionally nested inside a plan (planId nullable)
  - `exercises` - Individual exercises per training day (name, sets, repsMin, repsMax, weight, increment, order)
  - `weight_history` - Per-exercise weight history log for progress chart tracking
- **Relations**: users → training_plans → training_days → exercises → weight_history

### API Endpoints
- `GET /api/training-plans` - Plans with nested days and exercises
- `POST /api/training-plans` - Create plan
- `DELETE /api/training-plans/:id` - Delete plan (cascading)
- `GET /api/training-days` - Standalone days (no plan) with exercises
- `GET /api/all-training-days` - All training days (with and without plans) for active training
- `POST /api/training-days` - Create day
- `PATCH /api/training-days/:id` - Rename day
- `DELETE /api/training-days/:id` - Delete day (cascading)
- `POST /api/exercises` - Create exercise
- `PATCH /api/exercises/:id` - Update exercise
- `POST /api/exercises/:id/increment` - Increment weight
- `POST /api/exercises/:id/decrement` - Decrement weight
- `GET /api/exercises/:id/history` - Weight history for chart
- `DELETE /api/exercises/:id` - Delete exercise
- `GET /api/analytics` - Weight change analytics (30-day period)

### Shared Code (shared/)
- `shared/schema.ts` - Drizzle table definitions, relations, Zod insert schemas, TypeScript types
- `shared/models/auth.ts` - User and session table definitions for Replit Auth

### Authentication Flow
- Uses Replit Auth (OpenID Connect) — not username/password
- Auth setup in `server/replit_integrations/auth/`
- Login endpoint: `/api/login`, Logout: `/api/logout`
- User info endpoint: `/api/auth/user`
- `isAuthenticated` middleware protects all API routes
- User data is upserted on login (creates or updates user record)
- Sessions stored in PostgreSQL `sessions` table

### Build Process
- **Development**: `npm run dev` runs tsx with Vite dev server middleware
- **Production Build**: `npm run build` runs custom `script/build.ts` that builds client with Vite and server with esbuild
- **Production Start**: `npm start` runs the built output from `dist/index.cjs`
- Server dependencies in an allowlist are bundled to reduce cold start syscalls

### Key Design Decisions
1. **German UI Language**: All user-facing text is in German (e.g., "Trainingstag erstellt", "Abmelden")
2. **Dark Mode Only**: The app uses a fixed dark theme with neon green (electric lime) as the primary accent color — no light mode toggle
3. **Bottom Navigation**: 5-tab bottom hotbar (Pläne, Tage, Training, Statistik, Profil) with center Training tab elevated/larger
4. **Active Training Flow**: Client-side state for rep-completion checkmarks and exercise completion (not persisted to DB)
5. **Monorepo with shared types**: Schema types are defined once in `shared/` and used by both client and server
6. **Storage interface pattern**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation
7. **String-based form inputs**: Numeric fields stored as strings during editing so users can fully clear and retype values; parsed to numbers only on save

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required, connection via `DATABASE_URL` environment variable. Used for all data persistence including sessions
- **Replit Auth (OIDC)**: Authentication provider. Requires `REPL_ID`, `ISSUER_URL` (defaults to `https://replit.com/oidc`), and `SESSION_SECRET` environment variables

### Key NPM Packages
- `drizzle-orm` + `drizzle-kit` — Database ORM and migration tooling
- `express` + `express-session` — HTTP server and session management
- `connect-pg-simple` — PostgreSQL session store
- `passport` + `openid-client` — OIDC authentication
- `@tanstack/react-query` — Client-side data fetching and caching
- `wouter` — Lightweight client-side routing
- `zod` + `drizzle-zod` — Runtime validation and schema generation
- `shadcn/ui` components (Radix UI primitives) — UI component library
- `recharts` — Weight progression charts
- `date-fns` — Date formatting (German locale)
- `lucide-react` — Icon library

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for signing session cookies (required)
- `REPL_ID` — Replit environment identifier (set automatically by Replit)
- `ISSUER_URL` — OIDC issuer URL (defaults to Replit's OIDC endpoint)
