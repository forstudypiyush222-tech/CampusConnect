# CampusConnect

CampusConnect is a campus event discovery, registration, and management platform built for college communities. It replaces scattered chat forwards and unmaintained noticeboards with a centralized hub where student clubs and departments publish events and students discover, register for, and manage their event attendance.

## Features

### Students
- **Browse Available Events:** Discover upcoming campus events categorized across Tech, Cultural, Sports, Workshop, Career, and Music. Past and cancelled events are automatically excluded from public listings.
- **Search & Filter:** Find events instantly using case-insensitive search by name and category filtering, working concurrently with responsive empty states.
- **View Event Details:** View complete event metadata including date, time, venue, category, and dynamic real-time seat counts.
- **Register for Events:** Authenticated students can register for events with atomic seat decrements.
- **Registration Protections:** Built-in validation blocks registration for full events, past events, cancelled events, duplicate registrations, and unauthenticated/organizer users.
- **My Registrations & Cancellation:** Dedicated dashboard showing personal registrations grouped by upcoming and past events. Cancelling an active registration immediately restores the seat to the event.
- **Account Creation & Session Persistence:** Create new student accounts with email validation and login persistence across browser reloads via `localStorage`.

### Organizers
- **Create Events:** Publish new events with validation for name, description, venue, valid categories, positive integer capacity, and future dates.
- **Edit Events:** Update event details and dynamically adjust capacity, preventing capacity reductions below existing active registrations.
- **Cancel Events:** Mark events as cancelled, automatically hiding them from public student discovery while preserving organizer records.
- **Delete Events:** Permanently remove events with cascading cleanup of associated registrations.
- **Organizer Dashboard:** Dedicated organizer-only management dashboard restricted from student access.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Library:** React 18
- **Language:** TypeScript
- **Styling:** Vanilla CSS (CSS variables, modern card layouts, responsive grid)
- **State & Persistence:** React Context (`AuthProvider`) backed by in-memory data stores synchronized with browser `localStorage`
- **Testing:** Vitest

## Getting Started

### Prerequisites

- Node.js 18.17+ or later
- npm

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

The application includes pre-seeded accounts for evaluation (or you can create a new student account via the `/login` page):

| Role | Email | Password | Seed ID |
| :--- | :--- | :--- | :--- |
| **Student** | `aditi@campus.edu` | `student123` | `stu-1` |
| **Organizer** | `rohan@campus.edu` | `organizer123` | `org-1` |

*Note: You can also switch users directly from the top-right navbar dropdown for quick testing.*

### Running Tests & Quality Checks

- **Run all automated tests (152 tests):**
  ```bash
  npm run test
  ```

- **Typecheck:**
  ```bash
  npx tsc --noEmit
  ```

- **Production build:**
  ```bash
  npm run build
  ```

## Project Structure

```text
CampusConnect/
├── app/
│   ├── events/
│   │   ├── [id]/page.tsx      # Event detail & student registration
│   │   └── page.tsx           # Event listing with search & category filters
│   ├── login/
│   │   └── page.tsx           # Authentication (login & student signup)
│   ├── organizer/
│   │   └── page.tsx           # Organizer event management dashboard (CRUD)
│   ├── registrations/
│   │   └── page.tsx           # Student registrations dashboard & cancellation
│   ├── globals.css            # Design system, CSS variables & typography
│   ├── layout.tsx             # Root layout with AuthProvider, Navbar & Footer
│   └── page.tsx               # Landing page with hero & upcoming events
├── components/
│   ├── AuthProvider.tsx       # Auth context, user/session state & hydration
│   ├── EmptyState.tsx         # Reusable empty state view
│   ├── EventCard.tsx          # Event card component
│   ├── Footer.tsx             # Application footer
│   ├── Navbar.tsx             # Sticky navigation, role indicators & user switcher
│   └── StatusBadge.tsx        # Event & registration status tags
├── data/
│   ├── auth.ts                # User store, auth helpers, & account persistence
│   ├── events.ts              # Event store, CRUD functions, & seat persistence
│   └── registrations.ts       # Registration store & cancellation persistence
├── tests/                     # 11 test suites covering all features & persistence
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
