# CampusConnect — Project Status & Architecture Documentation

## 1. Project Overview & Current Status

CampusConnect is a campus event discovery, registration, and management application built with Next.js 14 (App Router) and TypeScript.

- **Feature 1 — Event Listing / Search / Filter:** COMPLETE
- **Feature 2 — Student Event Registration & Login Guard:** COMPLETE
- **Feature 3 — My Registrations & Cancellation:** COMPLETE
- **Feature 4 — Organizer Event Management (CRUD):** COMPLETE
- **Feature 5 — Full Application State Persistence Across Refresh:** COMPLETE

---

## 2. Application State Persistence Architecture

### Overview
This repository operates intentionally without an external database or backend service. All user accounts, active sessions, registrations, and event mutations are maintained client-side in memory and persisted across browser reloads using the browser's `localStorage`.

### LocalStorage Keys
1. **`campusconnect_users`**:
   - Stores the serialized JSON array of registered mock accounts (`AppUser[]`).
   - Newly created student accounts are automatically saved to this key.
   - Preserves seeded users (Aditi Rao and Rohan Verma) and prevents duplication.
2. **`campusconnect_current_user`**:
   - Stores the active authenticated user's ID (`string`).
   - Stored upon login, user switch, or account signup.
   - Cleared immediately upon explicit logout or when an invalid/stale session ID is detected.
3. **`campusconnect_registrations`**:
   - Stores the serialized JSON array of registrations (`Registration[]`).
   - New event registrations are appended and persisted.
   - Registration cancellations update status to `'cancelled'` and persist.
   - Deleting an event cleans up associated registrations and persists.
4. **`campusconnect_events`**:
   - Stores the serialized JSON array of campus events (`CampusEvent[]`).
   - Captures seat decrements upon student registration (`seatsAvailable -= 1`).
   - Captures seat restorations upon registration cancellation (`seatsAvailable += 1`).
   - Captures organizer event creations, edits, cancellations, and deletions.

### State Consistency & Invariants
- **Register for Event:** Decrements `seatsAvailable` by 1 and persists both the new registration and the updated event.
- **Cancel Registration:** Validates active ownership, marks registration status as `'cancelled'`, restores exactly 1 seat (capped at capacity), and persists both.
- **Double Cancellation Guard:** Re-attempting to cancel an already cancelled registration is rejected; no extra seats are restored.
- **Duplicate Registration Guard:** Active registrations prevent duplicate signups across page reloads.
- **Event Lifecycle:** Created events survive refresh, edited event attributes remain, cancelled events remain marked as cancelled, and deleted events remain removed.

### Seeded Data Protection & Graceful Fallback
- On first launch (when `localStorage` is empty), the application loads the initial seed data.
- If `localStorage` is missing or corrupted, stores fall back gracefully to the original seed data without crashing.
- Safe developer-only reset functions are provided:
  - `resetUsersToSeed()` in `data/auth.ts`
  - `resetEventsToSeed()` in `data/events.ts`
  - `resetRegistrationsToSeed()` in `data/registrations.ts`

### Session Lifecycle & Hydration Safety
1. **Initial Server Rendering (SSR):**
   - Server renders with `currentUser = null` and `isHydrated = false`.
   - Protects against SSR errors like `window is not defined` or hydration mismatches.
2. **Client-Side Hydration:**
   - On component mount (`useEffect` in `AuthProvider`), `syncUsersFromStorage()`, `syncEventsFromStorage()`, and `syncRegistrationsFromStorage()` restore persisted data.
   - `loadPersistedSession()` reads `campusconnect_current_user` and restores `currentUser`.
   - `isHydrated` is set to `true`, allowing all pages (`/events`, `/events/[id]`, `/registrations`, `/organizer`, `/login`) to render the synced state without layout flashes or race conditions.
3. **Explicit Logout:**
   - Clears `currentUserId` from React state and removes `campusconnect_current_user` from `localStorage`.
   - User remains logged out across subsequent reloads.

---

## 3. Critical Security Limitation Disclaimer

> [!WARNING]
> **HACKATHON MOCK DATA & AUTHENTICATION ONLY — NOT FOR PRODUCTION**
> 
> This persistence and authentication system is an in-browser client-side mock designed solely for prototype demonstration:
> - User credentials and passwords are stored in plain text in browser `localStorage`.
> - There is no password hashing (e.g. bcrypt, Argon2), encryption, or salt.
> - There is no backend authorization, signed JWTs, or secure `httpOnly`, `SameSite=Strict` cookies.
> - Data in `localStorage` can be read or modified by anyone with access to the browser console or device.
> - **NEVER use this architecture for a production, commercial, or real-world application.**

---

## 4. Verification & Testing Status

- **Automated Test Suite:** 152 tests across 11 test files (100% passing)
  - `tests/appPersistence.test.ts` (13 tests) — Registrations persistence, seat decrement persistence, reload survival, duplicate registration block after reload, cancellation persistence, exact seat restoration, no double seat restoration, organizer created/edited/cancelled/deleted event persistence, unrelated event immutability, full end-to-end acceptance flow.
  - `tests/authPersistence.test.ts` (12 tests) — Session persistence, logout cleanup, student persistence, case-insensitive duplicate email protection, invalid session handling, seeded user safety.
  - `tests/signupLogin.test.ts` (25 tests) — Signup validation, email formatting, credential authentication, duplicate protection.
  - `tests/loginRequirement.test.ts` (13 tests) — Auth requirements for registrations and organizer actions.
  - `tests/eventListing.test.ts` (14 tests) — Event filtering, search, and listing.
  - `tests/studentRegistration.test.ts` (20 tests) — Student seat decrements, duplicate prevention, capacity checks.
  - `tests/myRegistrations.test.ts` (18 tests) — Registration listing, status grouping, seat restoration on cancel.
  - `tests/organizerManagement.test.ts` (34 tests) — Event creation, updates, cancellation, deletion, seat validations.
  - `tests/events.tests.ts`, `tests/search.test.ts`, `tests/registrations.test.ts` (3 tests)
- **TypeScript Typecheck:** `npx tsc --noEmit` passed with 0 errors.
- **Production Build:** `npm run build` compiled all routes successfully.
