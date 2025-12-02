# Copilot Instructions for Agency Matching Funnel MVP

## Project Overview
A React + TypeScript onboarding platform that matches businesses with marketing agencies based on strategic signals. Users complete a multi-step onboarding flow, and a matching engine generates agency recommendations with compatibility scores.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (via CDN)
- **Backend:** Supabase (Auth, PostgreSQL, RLS)
- **Routing:** React Router DOM v7
- **No testing framework configured**

## Architecture

### Data Flow
1. User authenticates via `AuthContext` → Supabase Auth
2. Onboarding (`pages/Onboarding.tsx`) collects answers → stored in `user_profiles`
3. `MatchingEngine.generateMatches()` scores agencies and creates top 3 `deals`
4. Dashboard pages (`Deals`, `Ongoing`, `Agencies`) display and manage deals

### Key Files
- `types.ts` - All TypeScript interfaces and union types (use these, don't create duplicates)
- `lib/matchingEngine.ts` - Agency scoring algorithm (weighted: platforms 30%, budget 25%, industry 20%, objectives 15%, ops 10%)
- `lib/supabase.ts` - Supabase client (uses `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `supabase/schema.sql` - Complete database schema with RLS policies
- `config/theme.ts` - Centralized colors and design tokens

### Database Schema (snake_case)
- `user_profiles` - User onboarding data (platforms[], objectives[], spend_bracket, etc.)
- `agencies` - Agency profiles with capabilities and verified status
- `deals` - User-agency matches with `match_score` and status (`new`|`active`|`review`|`ongoing`)

⚠️ **Database uses snake_case**, TypeScript uses camelCase. Map fields when querying:
```typescript
// Example from Deals.tsx
const mapped = data.map(deal => ({
  matchScore: deal.match_score,
  agencyId: deal.agency_id,
  // ...
}));
```

## Conventions

### UI Components
- Use existing components from `components/ui/` (Button, Card, Input, Select, MultiSelect, Toast, Checkbox)
- `Button` variants: `primary`, `secondary`, `outline`, `ghost`
- `Card` with `hover` prop for interactive cards
- Icons: Material Icons Outlined via `<Icon name="icon_name" />`

### Styling
- Tailwind classes with dark mode support (`dark:` prefix)
- Glass effect: `glass` class for frosted backgrounds
- Primary color: `#EF2E6E` (use `text-primary`, `bg-primary`, `from-primary`)
- Gradients: `bg-gradient-to-r from-primary to-pink-600`
- Always include responsive variants (`sm:`, `md:`, `lg:`)

### Auth & Protected Routes
```tsx
// Wrap protected content with ProtectedRoute
<ProtectedRoute>
  <DashboardLayout><YourPage /></DashboardLayout>
</ProtectedRoute>
```
Access user/profile via `useAuth()` hook.

### Toast Notifications
```typescript
const { showToast } = useToast();
showToast("Success message", "success");
showToast("Error message", "error");
```

## Commands
```bash
npm run dev     # Start dev server on port 3000
npm run build   # Production build
npm run preview # Preview production build
```

## Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Common Tasks

### Adding a New Page
1. Create component in `pages/`
2. Add route in `App.tsx` (wrap with `ProtectedRoute` + `DashboardLayout` if authenticated)
3. Add nav item in `components/Sidebar.tsx`

### Modifying Matching Algorithm
Edit `lib/matchingEngine.ts` - adjust weights in `calculateMatchScore()`. Current weights sum to 100.

### Adding Onboarding Questions
1. Add type to `types.ts` (e.g., new union type)
2. Add options array and step UI in `pages/Onboarding.tsx`
3. Update `user_profiles` schema in `supabase/schema.sql`
