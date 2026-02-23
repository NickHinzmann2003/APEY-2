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

The frontend has two main pages:
- **Landing page** - Public marketing page shown to unauthenticated users
- **Dashboard** - Authenticated view for managing training days and exercises

The app conditionally renders Landing or Dashboard at the root route based on authentication state.

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
  - `exercises` - Individual exercises per training day (name, sets, weight, increment, order)
  - `weight_history` - Per-exercise weight history log for progress chart tracking
- **Relations**: users → training_plans → training_days → exercises → weight_history

### Shared Code (shared/)
- `shared/schema.ts` - Drizzle table definitions, relations, Zod insert schemas, TypeScript types
- `shared/models/auth.ts` - User and session table definitions for Replit Auth
- `shared/routes.ts` - API route definitions with Zod response schemas (typed API contract)

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
3. **Monorepo with shared types**: Schema types are defined once in `shared/` and used by both client and server, ensuring type safety across the stack
4. **Storage interface pattern**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation, allowing for potential alternative storage backends

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
- `date-fns` — Date formatting (German locale)
- `lucide-react` — Icon library

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for signing session cookies (required)
- `REPL_ID` — Replit environment identifier (set automatically by Replit)
- `ISSUER_URL` — OIDC issuer URL (defaults to Replit's OIDC endpoint)