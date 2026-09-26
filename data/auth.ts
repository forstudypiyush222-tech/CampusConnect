/**
 * ============================================================================
 * CampusConnect Mock Authentication System
 * ============================================================================
 * 
 * SECURITY DISCLAIMER:
 * This authentication system is an IN-BROWSER CLIENT-SIDE MOCK created solely
 * for a hackathon prototype demonstration. It uses browser localStorage to
 * persist mock user accounts and the active session ID across page refreshes.
 * 
 * THIS IS NOT PRODUCTION-GRADE AUTHENTICATION.
 * - Credentials and session IDs are stored in plain text in browser localStorage.
 * - There is no password hashing, encryption, server-side validation, or secure
 *   token signing (JWT / httpOnly cookies).
 * - Anyone with access to the browser console can inspect or modify localStorage.
 * - NEVER use this architecture for a production, commercial, or real-world app.
 * ============================================================================
 */

export type UserRole = 'student' | 'organizer'

export interface AppUser {
  id: string
  name: string
  role: UserRole
  email: string
  password: string
}

export const AUTH_STORAGE_KEYS = {
  USERS: 'campusconnect_users',
  CURRENT_USER: 'campusconnect_current_user',
} as const

export const SEEDED_USERS: AppUser[] = [
  { id: 'stu-1', name: 'Aditi Rao', role: 'student', email: 'aditi@campus.edu', password: 'student123' },
  { id: 'org-1', name: 'Rohan Verma', role: 'organizer', email: 'rohan@campus.edu', password: 'organizer123' },
]

export const users: AppUser[] = [
  ...SEEDED_USERS,
]

// ── Storage helpers (safe for SSR / Node / Browser) ───────────────────────

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage
  }
  return null
}

export function loadPersistedUsers(): AppUser[] {
  const storage = getLocalStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(AUTH_STORAGE_KEYS.USERS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // ignore parse or storage errors
  }
  return []
}

export function savePersistedUsers(usersToSave: AppUser[]): void {
  const storage = getLocalStorage()
  if (!storage) return
  try {
    storage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(usersToSave))
  } catch {
    // ignore storage quota/security errors
  }
}

export function loadPersistedSession(): string | null {
  const storage = getLocalStorage()
  if (!storage) return null
  try {
    return storage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER)
  } catch {
    return null
  }
}

export function persistSession(userId: string | null): void {
  const storage = getLocalStorage()
  if (!storage) return
  try {
    if (userId) {
      storage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, userId)
    } else {
      storage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER)
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Merges persisted users from localStorage into the in-memory `users` array.
 * Ensures seeded users (Aditi Rao, Rohan Verma) are always preserved and never duplicated.
 */
export function syncUsersFromStorage(): AppUser[] {
  const persisted = loadPersistedUsers()

  // 1. Ensure all seeded users are always present
  for (const seeded of SEEDED_USERS) {
    if (!users.some((u) => u.id === seeded.id)) {
      users.push({ ...seeded })
    }
  }

  // 2. Safely merge persisted users
  for (const pUser of persisted) {
    if (!pUser || !pUser.id || !pUser.email) continue
    const existingIndex = users.findIndex((u) => u.id === pUser.id)
    if (existingIndex === -1) {
      // Prevent duplicate email with an existing user of different id
      const emailConflict = users.some(
        (u) => u.email.toLowerCase() === pUser.email.toLowerCase() && u.id !== pUser.id
      )
      if (!emailConflict) {
        users.push(pUser)
      }
    } else {
      // If it's not a seeded user, keep the stored version
      if (!SEEDED_USERS.some((s) => s.id === pUser.id)) {
        users[existingIndex] = pUser
      }
    }
  }

  return users
}

// Automatically sync on client module load
if (typeof window !== 'undefined') {
  syncUsersFromStorage()
}

export function getUserById(id: string): AppUser | undefined {
  syncUsersFromStorage()
  return users.find((user) => user.id === id)
}

// ── Email validation ──────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isEmailTaken(email: string): boolean {
  syncUsersFromStorage()
  const norm = normalizeEmail(email)
  return users.some((u) => u.email.toLowerCase() === norm)
}

// ── Signup ─────────────────────────────────────────────────────────────
export type SignupResult =
  | { success: true; user: AppUser }
  | { success: false; error: string }

const MIN_PASSWORD_LENGTH = 6

export function createStudentAccount(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): SignupResult {
  syncUsersFromStorage()

  // 1. Name validation
  if (!name || !name.trim()) {
    return { success: false, error: 'Name is required.' }
  }

  // 2. Email validation
  if (!email || !email.trim()) {
    return { success: false, error: 'Email is required.' }
  }
  const normEmail = normalizeEmail(email)
  if (!isValidEmail(normEmail)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }
  if (isEmailTaken(normEmail)) {
    return { success: false, error: 'An account with this email already exists.' }
  }

  // 3. Password validation
  if (!password) {
    return { success: false, error: 'Password is required.' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }

  // 4. Confirm password
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  // 5. Create the student
  const newUser: AppUser = {
    id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    role: 'student',
    email: normEmail,
    password,
  }

  users.push(newUser)
  savePersistedUsers(users)
  return { success: true, user: newUser }
}

// ── Email/password login ───────────────────────────────────────────────
export type LoginResult =
  | { success: true; user: AppUser }
  | { success: false; error: string }

export function authenticateByEmail(
  email: string,
  password: string,
): LoginResult {
  syncUsersFromStorage()

  if (!email || !email.trim()) {
    return { success: false, error: 'Email is required.' }
  }
  if (!password) {
    return { success: false, error: 'Password is required.' }
  }

  const normEmail = normalizeEmail(email)
  const user = users.find((u) => u.email.toLowerCase() === normEmail)

  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid email or password.' }
  }

  return { success: true, user }
}
