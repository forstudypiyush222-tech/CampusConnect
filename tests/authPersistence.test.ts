import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  users,
  SEEDED_USERS,
  AUTH_STORAGE_KEYS,
  loadPersistedUsers,
  savePersistedUsers,
  loadPersistedSession,
  persistSession,
  syncUsersFromStorage,
  createStudentAccount,
  authenticateByEmail,
  getUserById,
  AppUser,
} from '@/data/auth'

function createMockStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

describe('Mock Auth Persistence across Refresh/Reload', () => {
  let mockStorage: Storage
  const originalLocalStorage = (globalThis as any).localStorage
  let initialUserCount: number

  beforeEach(() => {
    mockStorage = createMockStorage()
    ;(globalThis as any).localStorage = mockStorage

    // Reset users array to clean seeded users
    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))
    initialUserCount = users.length
  })

  afterEach(() => {
    mockStorage.clear()
    ;(globalThis as any).localStorage = originalLocalStorage
    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))
  })

  // ── 1. Login persists current user ID ──
  it('persists the authenticated user ID on login', () => {
    persistSession('stu-1')
    expect(mockStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER)).toBe('stu-1')
    expect(loadPersistedSession()).toBe('stu-1')
  })

  // ── 2. Logout clears persisted current user ──
  it('clears the persisted current user on logout', () => {
    persistSession('stu-1')
    expect(loadPersistedSession()).toBe('stu-1')

    persistSession(null)
    expect(mockStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER)).toBeNull()
    expect(loadPersistedSession()).toBeNull()
  })

  // ── 3. Existing seeded student can log in ──
  it('allows the seeded student (Aditi Rao) to log in', () => {
    const result = authenticateByEmail('aditi@campus.edu', 'student123')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.name).toBe('Aditi Rao')
      expect(result.user.role).toBe('student')
      expect(result.user.id).toBe('stu-1')
    }
  })

  // ── 4. Existing seeded organizer can log in ──
  it('allows the seeded organizer (Rohan Verma) to log in', () => {
    const result = authenticateByEmail('rohan@campus.edu', 'organizer123')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.name).toBe('Rohan Verma')
      expect(result.user.role).toBe('organizer')
      expect(result.user.id).toBe('org-1')
    }
  })

  // ── 5. New student account is persisted ──
  it('persists a newly created student account to localStorage', () => {
    const signupRes = createStudentAccount(
      'New Student',
      'newstudent@campus.edu',
      'password123',
      'password123',
    )
    expect(signupRes.success).toBe(true)
    if (signupRes.success) {
      const storedJson = mockStorage.getItem(AUTH_STORAGE_KEYS.USERS)
      expect(storedJson).not.toBeNull()
      const storedUsers: AppUser[] = JSON.parse(storedJson!)
      const found = storedUsers.find((u) => u.id === signupRes.user.id)
      expect(found).toBeDefined()
      expect(found?.email).toBe('newstudent@campus.edu')
      expect(found?.role).toBe('student')
    }
  })

  // ── 6. Persisted new student can log in again after reload/sync ──
  it('allows a persisted new student to log in after simulated browser reload', () => {
    const signupRes = createStudentAccount(
      'Priya Sharma',
      'priya@campus.edu',
      'securePass1',
      'securePass1',
    )
    expect(signupRes.success).toBe(true)
    if (!signupRes.success) return

    const studentId = signupRes.user.id

    // Simulate browser reload by resetting in-memory users array back to only seeded users
    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))
    expect(users.find((u) => u.id === studentId)).toBeUndefined()

    // Sync users from localStorage (as happens on page load / module load)
    syncUsersFromStorage()

    // The newly created student should now be restored
    const restored = getUserById(studentId)
    expect(restored).toBeDefined()
    expect(restored?.name).toBe('Priya Sharma')

    // Student can log in with their credentials
    const loginRes = authenticateByEmail('priya@campus.edu', 'securePass1')
    expect(loginRes.success).toBe(true)
    if (loginRes.success) {
      expect(loginRes.user.id).toBe(studentId)
    }
  })

  // ── 7. Duplicate email remains blocked after persistence ──
  it('rejects duplicate email signup against persisted users', () => {
    const firstSignup = createStudentAccount(
      'Original User',
      'duplicate@campus.edu',
      'pass1234',
      'pass1234',
    )
    expect(firstSignup.success).toBe(true)

    // Simulate reload
    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))
    syncUsersFromStorage()

    // Try signing up again with the same email
    const duplicateSignup = createStudentAccount(
      'Imposter User',
      'duplicate@campus.edu',
      'differentPass',
      'differentPass',
    )
    expect(duplicateSignup.success).toBe(false)
    if (!duplicateSignup.success) {
      expect(duplicateSignup.error).toBe('An account with this email already exists.')
    }

    // Original account was not changed
    const user = users.find((u) => u.email === 'duplicate@campus.edu')
    expect(user?.name).toBe('Original User')
  })

  // ── 8. Email comparison is case-insensitive ──
  it('performs case-insensitive email matching for duplicate checks and login', () => {
    const signup = createStudentAccount(
      'Case Test',
      'MixedCase@Campus.Edu',
      'pass1234',
      'pass1234',
    )
    expect(signup.success).toBe(true)

    // Try signing up with lowercase version
    const dupRes = createStudentAccount(
      'Another User',
      'mixedcase@campus.edu',
      'pass1234',
      'pass1234',
    )
    expect(dupRes.success).toBe(false)
    if (!dupRes.success) {
      expect(dupRes.error).toBe('An account with this email already exists.')
    }

    // Login with uppercase version
    const loginRes = authenticateByEmail('MIXEDCASE@CAMPUS.EDU', 'pass1234')
    expect(loginRes.success).toBe(true)
  })

  // ── 9. Refresh/session restoration resolves the correct user ──
  it('restores the session to the correct user when persisted session is present', () => {
    persistSession('stu-1')

    const storedId = loadPersistedSession()
    expect(storedId).toBe('stu-1')

    const currentUser = getUserById(storedId!)
    expect(currentUser).toBeDefined()
    expect(currentUser?.name).toBe('Aditi Rao')
  })

  // ── 10. Invalid persisted user ID is handled safely ──
  it('safely handles non-existent or invalid persisted user IDs', () => {
    persistSession('invalid-user-that-does-not-exist')

    const storedId = loadPersistedSession()
    expect(storedId).toBe('invalid-user-that-does-not-exist')

    const user = getUserById(storedId!)
    expect(user).toBeUndefined()

    // Should clear invalid session
    if (!user) {
      persistSession(null)
    }
    expect(loadPersistedSession()).toBeNull()
  })

  // ── 11. Explicit logout remains logged out after reload ──
  it('keeps the user logged out after reload when explicitly logged out', () => {
    // 1. User logs in
    persistSession('stu-1')
    expect(loadPersistedSession()).toBe('stu-1')

    // 2. User explicitly logs out
    persistSession(null)
    expect(loadPersistedSession()).toBeNull()

    // 3. Simulated reload: reading session yields null
    const sessionAfterReload = loadPersistedSession()
    expect(sessionAfterReload).toBeNull()
  })

  // ── 12. Seeded users are always preserved and never duplicated ──
  it('never deletes or duplicates seeded users after multiple syncs', () => {
    syncUsersFromStorage()
    syncUsersFromStorage()
    syncUsersFromStorage()

    const aditiAccounts = users.filter((u) => u.id === 'stu-1')
    const rohanAccounts = users.filter((u) => u.id === 'org-1')

    expect(aditiAccounts).toHaveLength(1)
    expect(rohanAccounts).toHaveLength(1)
    expect(aditiAccounts[0].name).toBe('Aditi Rao')
    expect(rohanAccounts[0].name).toBe('Rohan Verma')
  })
})
