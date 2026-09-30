# 🎓 CampusConnect — Campus Event Discovery & Registration Platform

> 🚀 **Live Demo:** [campus-event-desk.netlify.app](https://campus-event-desk.netlify.app/)

CampusConnect transforms fragmented college campus communication into a unified, real-time event desk. Instead of buried WhatsApp forwards or outdated cork noticeboards, student clubs publish upcoming events directly to the campus community while students discover, register, and manage their spots in seconds.

---

## 🌟 Key Highlights

- ⚡ **Zero-Friction Discovery:** Instant search, category filters, and real-time seat availability.
- 🛡️ **Ironclad Registration Logic:** Built-in validation blocks duplicate signups, overcapacity registrations, and registration on past/cancelled events.
- 🔄 **Full State & Session Persistence:** User accounts, active logins, registrations, and seat counts survive browser refresh via custom hydration-safe `localStorage` synchronization.
- 👥 **Role-Based Access Control:** Distinct, protected workspaces for **Students** and **Organizers** with seamless account switching.
- 🧪 **100% Tested:** 152 automated tests covering unit logic, business rules, edge cases, and persistence lifecycles.

---

## ✨ Features

### 🎓 For Students
- **🔍 Browse & Discover:** Explore campus events spanning Tech, Cultural, Sports, Workshop, Career, and Music. Past and cancelled events are automatically filtered out from public feeds.
- **⚡ Real-Time Search & Filters:** Find events instantly with partial, case-insensitive keyword search combined with category filters and graceful empty states.
- **🎟️ 1-Click Registration:** Reserve seats with atomic seat decrements (`seatsAvailable - 1`).
- **🛡️ Intelligent Registration Guards:** Built-in safeguards prevent duplicate registrations, registrations on full events, past events, or cancelled events.
- **📋 My Registrations & Cancellation:** A personal dashboard organizing active upcoming vs. past registrations. Cancelling an event instantly restores the seat count to the event.
- **🔐 Account Creation & Persistent Auth:** Sign up for new student accounts with email validation, or sign in using seeded accounts with full session persistence across reloads.

### 🛠️ For Organizers
- **➕ Event Creation Studio:** Publish new events with validation for title, description, venue, future dates, valid categories, and positive capacities.
- **✏️ Dynamic Event Management:** Update event details on the fly. Capacity increases open seats immediately, while reductions below active attendee counts are strictly blocked.
- **🚫 Event Cancellation:** Mark events as cancelled, automatically hiding them from student discovery while preserving organizer records.
- **🗑️ Safe Cascading Deletion:** Permanently delete events with automatic cascading removal of associated student registrations.
- **📊 Organizer Command Center:** A role-gated management view restricted to organizer accounts (`org-1`).

---

## 🧰 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **UI Library** | React 18 |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS (CSS custom properties, modern card layouts, responsive grid) |
| **State & Persistence** | React Context (`AuthProvider`) + in-memory store + `localStorage` sync |
| **Testing** | Vitest (152 unit and integration tests) |
| **Hosting** | Netlify ([campus-event-desk.netlify.app](https://campus-event-desk.netlify.app/)) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or later
- npm

### 1. Clone & Install
```bash
git clone https://github.com/forstudypiyush222-tech/CampusConnect.git
cd CampusConnect
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Demo Credentials

Use pre-seeded credentials or create a new student account via the `/login` page:

| Role | Email | Password | Seed ID | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| 🎓 **Student** | `aditi@campus.edu` | `student123` | `stu-1` | Browse, Register, My Registrations |
| 🛠️ **Organizer** | `rohan@campus.edu` | `organizer123` | `org-1` | Create, Edit, Cancel, Delete Events |

> 💡 **Quick Switch:** You can also switch active accounts instantly using the user-switcher dropdown in the top-right navigation bar.

---

## 🧪 Testing & Verification

CampusConnect includes a comprehensive automated test suite testing business rules, data models, state persistence, and regression integrity:

```bash
# Run the complete test suite (152 tests across 11 files)
npm run test

# TypeScript typechecking
npx tsc --noEmit

# Production build verification
npm run build
```

---

## 📂 Project Architecture

```text
CampusConnect/
├── 🌐 app/
│   ├── events/
│   │   ├── [id]/page.tsx      # Event detail & student registration flow
│   │   └── page.tsx           # Public event directory (search & category filters)
│   ├── login/
│   │   └── page.tsx           # Authentication portal (login & student signup)
│   ├── organizer/
│   │   └── page.tsx           # Organizer event command dashboard (CRUD)
│   ├── registrations/
│   │   └── page.tsx           # Student registrations dashboard & cancellation
│   ├── globals.css            # Design tokens, CSS variables & typography
│   ├── layout.tsx             # Root layout with AuthProvider, Navbar & Footer
│   └── page.tsx               # Home landing page with hero & featured events
├── 🧩 components/
│   ├── AuthProvider.tsx       # Auth context, session persistence & hydration guard
│   ├── EmptyState.tsx         # Reusable graceful empty states
│   ├── EventCard.tsx          # Responsive event card with category badge
│   ├── Footer.tsx             # Global application footer
│   ├── Navbar.tsx             # Sticky navigation, role indicators & user switcher
│   └── StatusBadge.tsx        # Event & registration status tags
├── 💾 data/
│   ├── auth.ts                # User store, auth helpers, & account persistence
│   ├── events.ts              # Event store, CRUD operations, & seat persistence
│   └── registrations.ts       # Registration store & cancellation persistence
├── 🧪 tests/                  # 11 test suites covering all features & persistence
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 🌐 Live Deployment

- **Production URL:** [https://campus-event-desk.netlify.app/](https://campus-event-desk.netlify.app/)
