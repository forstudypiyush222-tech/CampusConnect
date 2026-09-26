import { describe, it, expect, beforeEach } from 'vitest'
import {
  users,
  getUserById,
  createStudentAccount,
  authenticateByEmail,
  AppUser,
} from '@/data/auth'
import {
  events,
  createEvent,
  CampusEvent,
} from '@/data/events'
import {
  registrations,
  registerStudentForEvent,
  getRegistrationsForStudent,
} from '@/data/registrations'

describe('New Student Signup & Login', () => {
  // Snapshot the initial user store length before each test so new users
  // added by previous tests don't interfere.
  let initialUserCount: number
  let initialRegCount: number

  beforeEach(() => {
    initialUserCount = users.length
    initialRegCount = registrations.length
  })

  // Cleanup helper: remove users added during the test
  function cleanupNewUsers() {
    users.length = initialUserCount
  }

  function cleanupNewRegistrations() {
    registrations.length = initialRegCount
  }

  // ── 1. New student can create an account ──
  it('creates a new student account with valid inputs', () => {
    const result = createStudentAccount('Piyush Kumar', 'piyush@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.name).toBe('Piyush Kumar')
      expect(result.user.email).toBe('piyush@example.com')
      expect(result.user.role).toBe('student')
    }
    cleanupNewUsers()
  })

  // ── 2. New student receives a unique ID ──
  it('assigns a unique student ID to newly created accounts', () => {
    const r1 = createStudentAccount('User A', 'a@example.com', 'pass1234', 'pass1234')
    const r2 = createStudentAccount('User B', 'b@example.com', 'pass1234', 'pass1234')
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    if (r1.success && r2.success) {
      expect(r1.user.id).not.toBe(r2.user.id)
      expect(r1.user.id).toMatch(/^stu-/)
      expect(r2.user.id).toMatch(/^stu-/)
    }
    cleanupNewUsers()
  })

  // ── 3. New account role is always 'student' ──
  it('always assigns role "student" to new accounts', () => {
    const result = createStudentAccount('Test User', 'test@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.role).toBe('student')
    }
    cleanupNewUsers()
  })

  // ── 4. New account is added to the user store ──
  it('adds the new user to the existing in-memory users array', () => {
    const countBefore = users.length
    const result = createStudentAccount('Store User', 'store@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    expect(users.length).toBe(countBefore + 1)
    if (result.success) {
      expect(getUserById(result.user.id)).toBeDefined()
    }
    cleanupNewUsers()
  })

  // ── 5. New student can be looked up immediately after creation ──
  it('new student is findable by getUserById immediately after creation', () => {
    const result = createStudentAccount('Lookup User', 'lookup@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (result.success) {
      const found = getUserById(result.user.id)
      expect(found).toBeDefined()
      expect(found?.name).toBe('Lookup User')
    }
    cleanupNewUsers()
  })

  // ── 6. Duplicate email is rejected ──
  it('rejects signup with an email that already exists', () => {
    const r1 = createStudentAccount('First', 'dup@example.com', 'pass1234', 'pass1234')
    expect(r1.success).toBe(true)

    const r2 = createStudentAccount('Second', 'dup@example.com', 'pass1234', 'pass1234')
    expect(r2.success).toBe(false)
    if (!r2.success) {
      expect(r2.error).toMatch(/already exists/i)
    }
    cleanupNewUsers()
  })

  // ── 7. Duplicate email check is case-insensitive ──
  it('treats emails case-insensitively when checking for duplicates', () => {
    const r1 = createStudentAccount('Case Test', 'CaseTest@example.com', 'pass1234', 'pass1234')
    expect(r1.success).toBe(true)

    const r2 = createStudentAccount('Case Test 2', 'casetest@example.com', 'pass1234', 'pass1234')
    expect(r2.success).toBe(false)
    if (!r2.success) {
      expect(r2.error).toMatch(/already exists/i)
    }

    // Also test with seeded user email
    const r3 = createStudentAccount('Dup Seeded', 'ADITI@campus.edu', 'pass1234', 'pass1234')
    expect(r3.success).toBe(false)
    if (!r3.success) {
      expect(r3.error).toMatch(/already exists/i)
    }
    cleanupNewUsers()
  })

  // ── 8. Empty name is rejected ──
  it('rejects signup with empty or whitespace-only name', () => {
    const r1 = createStudentAccount('', 'noname@example.com', 'pass1234', 'pass1234')
    expect(r1.success).toBe(false)
    if (!r1.success) expect(r1.error).toMatch(/name/i)

    const r2 = createStudentAccount('   ', 'noname2@example.com', 'pass1234', 'pass1234')
    expect(r2.success).toBe(false)
    if (!r2.success) expect(r2.error).toMatch(/name/i)

    expect(users.length).toBe(initialUserCount)
  })

  // ── 9. Invalid email is rejected ──
  it('rejects signup with invalid email format', () => {
    const r1 = createStudentAccount('Bad Email', 'notanemail', 'pass1234', 'pass1234')
    expect(r1.success).toBe(false)
    if (!r1.success) expect(r1.error).toMatch(/email/i)

    const r2 = createStudentAccount('Bad Email 2', '', 'pass1234', 'pass1234')
    expect(r2.success).toBe(false)
    if (!r2.success) expect(r2.error).toMatch(/email/i)

    expect(users.length).toBe(initialUserCount)
  })

  // ── 10. Empty password is rejected ──
  it('rejects signup with empty password', () => {
    const result = createStudentAccount('No Pass', 'nopass@example.com', '', '')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/password/i)

    expect(users.length).toBe(initialUserCount)
  })

  // ── 11. Password confirmation mismatch is rejected ──
  it('rejects signup when passwords do not match', () => {
    const result = createStudentAccount('Mismatch', 'mis@example.com', 'pass1234', 'differentpass')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/match/i)

    expect(users.length).toBe(initialUserCount)
  })

  // ── 12. Invalid signup does not mutate the user store ──
  it('does not add a user to the store on invalid signup', () => {
    createStudentAccount('', 'empty@example.com', 'pass1234', 'pass1234')
    createStudentAccount('No Email', '', 'pass1234', 'pass1234')
    createStudentAccount('Short', 'short@example.com', '12', '12')
    createStudentAccount('Mismatch', 'mm@example.com', 'pass1234', 'other')
    expect(users.length).toBe(initialUserCount)
  })

  // ── 13. Newly created student can access My Registrations (data layer) ──
  it('newly created student can query their registrations', () => {
    const result = createStudentAccount('Reg User', 'reg@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (result.success) {
      const regs = getRegistrationsForStudent(result.user.id)
      expect(regs).toEqual([])
    }
    cleanupNewUsers()
  })

  // ── 14. Newly created student can register for an event ──
  it('newly created student can register for an event successfully', () => {
    const result = createStudentAccount('Event Reg', 'eventreg@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (!result.success) return

    // Find an open future event
    const openEvent = events.find(
      (e) => !e.cancelled && e.seatsAvailable > 0 && new Date(e.date) > new Date(),
    )
    expect(openEvent).toBeDefined()
    if (!openEvent) return

    const seatsBefore = openEvent.seatsAvailable
    const regResult = registerStudentForEvent(result.user, openEvent.id)
    expect(regResult.success).toBe(true)
    expect(openEvent.seatsAvailable).toBe(seatsBefore - 1)

    // Restore seat
    openEvent.seatsAvailable = seatsBefore
    cleanupNewUsers()
    cleanupNewRegistrations()
  })

  // ── 15. Newly created student cannot access organizer management ──
  it('newly created student cannot create events', () => {
    const result = createStudentAccount('No Org', 'noorg@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (!result.success) return

    const createRes = createEvent(result.user, {
      name: 'Student Event',
      description: 'Desc',
      date: '2026-12-01T10:00:00',
      venue: 'Room 1',
      category: 'Tech',
      capacity: 10,
    })
    expect(createRes.success).toBe(false)
    if (!createRes.success) {
      expect(createRes.error).toMatch(/organizers/i)
    }
    cleanupNewUsers()
  })

  // ── 16. Logout works for newly created student (data layer) ──
  // This tests the user still exists after being "logged out" from the provider
  it('newly created student persists in user store after simulated logout', () => {
    const result = createStudentAccount('Persist User', 'persist@example.com', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (!result.success) return

    // Simulating logout means setting currentUserId to null, but the user should still be in the store
    const found = getUserById(result.user.id)
    expect(found).toBeDefined()
    expect(found?.name).toBe('Persist User')
    cleanupNewUsers()
  })

  // ── 17. Newly created student can log in again during the same session ──
  it('newly created student can authenticate via email/password', () => {
    const signupResult = createStudentAccount('Re-login', 'relogin@example.com', 'mypass99', 'mypass99')
    expect(signupResult.success).toBe(true)
    if (!signupResult.success) return

    const loginResult = authenticateByEmail('relogin@example.com', 'mypass99')
    expect(loginResult.success).toBe(true)
    if (loginResult.success) {
      expect(loginResult.user.id).toBe(signupResult.user.id)
      expect(loginResult.user.name).toBe('Re-login')
    }
    cleanupNewUsers()
  })

  // ── 18. Existing seeded student login still works ──
  it('seeded student can log in via email/password', () => {
    const result = authenticateByEmail('aditi@campus.edu', 'student123')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.name).toBe('Aditi Rao')
      expect(result.user.role).toBe('student')
    }
  })

  // ── 19. Existing seeded organizer login still works ──
  it('seeded organizer can log in via email/password', () => {
    const result = authenticateByEmail('rohan@campus.edu', 'organizer123')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.name).toBe('Rohan Verma')
      expect(result.user.role).toBe('organizer')
    }
  })

  // ── 20. Logged-out registration still requires login ──
  it('logged-out user cannot register for an event', () => {
    const openEvent = events.find(
      (e) => !e.cancelled && e.seatsAvailable > 0 && new Date(e.date) > new Date(),
    )
    expect(openEvent).toBeDefined()
    if (!openEvent) return

    const result = registerStudentForEvent(null, openEvent.id)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/logged in/i)
    }
  })

  // ── Additional: wrong password is rejected ──
  it('rejects login with wrong password', () => {
    const result = authenticateByEmail('aditi@campus.edu', 'wrongpassword')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i)
    }
  })

  // ── Additional: login with non-existent email is rejected ──
  it('rejects login with non-existent email', () => {
    const result = authenticateByEmail('nobody@example.com', 'pass1234')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i)
    }
  })

  // ── Additional: email is normalized on signup (stored lowercase) ──
  it('normalizes email to lowercase on signup', () => {
    const result = createStudentAccount('Norm Test', 'UPPER@EXAMPLE.COM', 'pass1234', 'pass1234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.email).toBe('upper@example.com')
    }
    cleanupNewUsers()
  })

  // ── Additional: can log in with different email casing ──
  it('login is case-insensitive for email', () => {
    const result = authenticateByEmail('ADITI@CAMPUS.EDU', 'student123')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.name).toBe('Aditi Rao')
    }
  })

  // ── Additional: password too short is rejected ──
  it('rejects password shorter than 6 characters', () => {
    const result = createStudentAccount('Short Pass', 'sp@example.com', '12345', '12345')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/at least/i)
    }
    expect(users.length).toBe(initialUserCount)
  })
})
