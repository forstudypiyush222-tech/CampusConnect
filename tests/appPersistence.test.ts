import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  users,
  SEEDED_USERS,
  createStudentAccount,
  authenticateByEmail,
  loadPersistedSession,
  persistSession,
  syncUsersFromStorage,
  AppUser,
} from '@/data/auth'
import {
  events,
  SEED_EVENTS,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getEventById,
  syncEventsFromStorage,
  CampusEvent,
} from '@/data/events'
import {
  registrations,
  SEED_REGISTRATIONS,
  registerStudentForEvent,
  cancelRegistration,
  getRegistrationsForStudent,
  hasActiveRegistration,
  syncRegistrationsFromStorage,
} from '@/data/registrations'

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

describe('Full Application Persistence Across Refresh', () => {
  let mockStorage: Storage
  const originalLocalStorage = (globalThis as any).localStorage

  beforeEach(() => {
    mockStorage = createMockStorage()
    ;(globalThis as any).localStorage = mockStorage

    // Reset stores to fresh deep copies of seeds
    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))

    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))

    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))
  })

  afterEach(() => {
    mockStorage.clear()
    ;(globalThis as any).localStorage = originalLocalStorage

    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))

    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))

    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))
  })

  // ── 1. Registration persists to storage ──
  it('persists a new student registration to localStorage', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')! // Future event with seats
    const initialSeats = targetEvent.seatsAvailable

    const regResult = registerStudentForEvent(student, targetEvent.id)
    expect(regResult.success).toBe(true)

    // Verify localStorage has registrations
    const rawRegs = mockStorage.getItem('campusconnect_registrations')
    expect(rawRegs).not.toBeNull()
    const storedRegs = JSON.parse(rawRegs!)
    expect(storedRegs.some((r: any) => r.eventId === targetEvent.id && r.studentId === student.id)).toBe(true)
  })

  // ── 2. Registration survives simulated reload ──
  it('restores the registration in My Registrations after simulated browser reload', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')!

    const regResult = registerStudentForEvent(student, targetEvent.id)
    expect(regResult.success).toBe(true)

    // Simulate reload: clear in-memory array to seed state
    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))

    // Sync from storage (as happens during hydration on reload)
    syncRegistrationsFromStorage()

    const myRegs = getRegistrationsForStudent(student.id)
    expect(myRegs.some((r) => r.eventId === targetEvent.id && r.status === 'confirmed')).toBe(true)
  })

  // ── 3. Duplicate registration remains blocked after reload ──
  it('blocks duplicate registration for the same event even after browser reload', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')!

    registerStudentForEvent(student, targetEvent.id)

    // Simulate reload
    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))
    syncRegistrationsFromStorage()

    // Try to register again
    const secondAttempt = registerStudentForEvent(student, targetEvent.id)
    expect(secondAttempt.success).toBe(false)
    if (!secondAttempt.success) {
      expect(secondAttempt.error).toBe('You are already registered for this event.')
    }
  })

  // ── 4. Cancellation persists ──
  it('persists registration cancellation to localStorage and survives reload', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')!

    const regRes = registerStudentForEvent(student, targetEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    const cancelRes = cancelRegistration(student, regRes.registration.id)
    expect(cancelRes.success).toBe(true)

    // Simulate reload
    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))
    syncRegistrationsFromStorage()

    const myRegs = getRegistrationsForStudent(student.id)
    const cancelledReg = myRegs.find((r) => r.id === regRes.registration.id)
    expect(cancelledReg).toBeDefined()
    expect(cancelledReg?.status).toBe('cancelled')
  })

  // ── 5. Cancellation restores exactly one seat and persists ──
  it('restores exactly 1 seat upon cancellation and seat count persists across reload', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')!
    const initialSeats = targetEvent.seatsAvailable

    const regRes = registerStudentForEvent(student, targetEvent.id)
    expect(targetEvent.seatsAvailable).toBe(initialSeats - 1)
    if (!regRes.success) return

    cancelRegistration(student, regRes.registration.id)
    expect(targetEvent.seatsAvailable).toBe(initialSeats)

    // Simulate reload of both events and registrations
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    syncEventsFromStorage()

    const restoredEvent = getEventById(targetEvent.id)!
    expect(restoredEvent.seatsAvailable).toBe(initialSeats)
  })

  // ── 6. Double cancellation does not restore another seat ──
  it('does not restore extra seats if cancellation is attempted again', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')!
    const initialSeats = targetEvent.seatsAvailable

    const regRes = registerStudentForEvent(student, targetEvent.id)
    if (!regRes.success) return

    // 1st cancellation succeeds
    const firstCancel = cancelRegistration(student, regRes.registration.id)
    expect(firstCancel.success).toBe(true)
    expect(targetEvent.seatsAvailable).toBe(initialSeats)

    // 2nd cancellation fails and does not alter seats
    const secondCancel = cancelRegistration(student, regRes.registration.id)
    expect(secondCancel.success).toBe(false)
    expect(targetEvent.seatsAvailable).toBe(initialSeats)
  })

  // ── 7. Seat decrement persists across reload ──
  it('persists event seat decrements across simulated browser reload', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-05')! // 6 seats originally
    const seatsBefore = targetEvent.seatsAvailable

    const regRes = registerStudentForEvent(student, targetEvent.id)
    expect(regRes.success).toBe(true)
    expect(targetEvent.seatsAvailable).toBe(seatsBefore - 1)

    // Simulate reload
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    syncEventsFromStorage()

    const eventAfterReload = getEventById('evt-05')!
    expect(eventAfterReload.seatsAvailable).toBe(seatsBefore - 1)
  })

  // ── 8. Created event persists ──
  it('persists organizer created events across simulated browser reload', () => {
    const organizer = users.find((u) => u.id === 'org-1')!

    const createRes = createEvent(organizer, {
      name: 'Hackathon Prototype Workshop',
      description: 'Hands on with Next.js',
      date: '2026-11-15T14:00:00',
      venue: 'Lab 5',
      category: 'Tech',
      capacity: 50,
    })
    expect(createRes.success).toBe(true)
    if (!createRes.success) return

    const newEventId = createRes.event.id

    // Simulate reload
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    expect(events.find((e) => e.id === newEventId)).toBeUndefined()

    syncEventsFromStorage()

    const eventAfterReload = getEventById(newEventId)
    expect(eventAfterReload).toBeDefined()
    expect(eventAfterReload?.name).toBe('Hackathon Prototype Workshop')
    expect(eventAfterReload?.capacity).toBe(50)
  })

  // ── 9. Edited event persists ──
  it('persists organizer event edits across simulated browser reload', () => {
    const organizer = users.find((u) => u.id === 'org-1')!
    const targetEvent = events.find((e) => e.id === 'evt-01')! // Owned by org-1

    const updateRes = updateEvent(organizer, targetEvent.id, {
      name: 'Hack the Campus 2026 — Expanded Edition',
      venue: 'Main Auditorium & Exhibition Center',
      capacity: 150,
    })
    expect(updateRes.success).toBe(true)

    // Simulate reload
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    syncEventsFromStorage()

    const eventAfterReload = getEventById('evt-01')!
    expect(eventAfterReload.name).toBe('Hack the Campus 2026 — Expanded Edition')
    expect(eventAfterReload.venue).toBe('Main Auditorium & Exhibition Center')
    expect(eventAfterReload.capacity).toBe(150)
  })

  // ── 10. Cancelled event persists ──
  it('persists event cancellation by organizer across simulated browser reload', () => {
    const organizer = users.find((u) => u.id === 'org-1')!
    const targetEvent = events.find((e) => e.id === 'evt-01')!

    const cancelRes = cancelEvent(organizer, targetEvent.id)
    expect(cancelRes.success).toBe(true)
    expect(targetEvent.cancelled).toBe(true)

    // Simulate reload
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    syncEventsFromStorage()

    const eventAfterReload = getEventById('evt-01')!
    expect(eventAfterReload.cancelled).toBe(true)
  })

  // ── 11. Deleted event remains deleted ──
  it('keeps deleted events deleted across simulated browser reload', () => {
    const organizer = users.find((u) => u.id === 'org-1')!
    const targetEvent = events.find((e) => e.id === 'evt-01')!

    const deleteRes = deleteEvent(organizer, targetEvent.id)
    expect(deleteRes.success).toBe(true)
    expect(events.find((e) => e.id === targetEvent.id)).toBeUndefined()

    // Simulate reload
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    syncEventsFromStorage()

    const eventAfterReload = getEventById('evt-01')
    expect(eventAfterReload).toBeUndefined()
  })

  // ── 12. Unrelated events remain unchanged ──
  it('ensures unrelated events are unaffected when one event is mutated', () => {
    const student = users.find((u) => u.id === 'stu-1')!
    const targetEvent = events.find((e) => e.id === 'evt-01')!
    const unrelatedEvent = events.find((e) => e.id === 'evt-03')!
    const unrelatedSeatsBefore = unrelatedEvent.seatsAvailable

    registerStudentForEvent(student, targetEvent.id)

    // Simulate reload
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    syncEventsFromStorage()

    const unrelatedAfterReload = getEventById('evt-03')!
    expect(unrelatedAfterReload.seatsAvailable).toBe(unrelatedSeatsBefore)
  })

  // ── 13. Comprehensive Acceptance Scenario (Section 9) ──
  it('executes the full end-to-end scenario: new student -> register -> refresh -> cancel -> refresh', () => {
    // 1. Guest creates a new student account
    const signup = createStudentAccount(
      'Aarav Patel',
      'aarav@campus.edu',
      'studentPass1',
      'studentPass1',
    )
    expect(signup.success).toBe(true)
    if (!signup.success) return
    const aarav = signup.user

    // 2. Student logs in
    persistSession(aarav.id)
    expect(loadPersistedSession()).toBe(aarav.id)

    // 3. Student registers for a future event
    const event = getEventById('evt-08')! // 20 seats
    const initialSeats = event.seatsAvailable
    expect(initialSeats).toBe(20)

    const reg = registerStudentForEvent(aarav, event.id)
    expect(reg.success).toBe(true)
    expect(event.seatsAvailable).toBe(19)
    if (!reg.success) return

    // 4. Refresh browser (simulate module reload & hydration)
    users.length = 0
    users.push(...SEEDED_USERS.map((u) => ({ ...u })))
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))

    syncUsersFromStorage()
    syncEventsFromStorage()
    syncRegistrationsFromStorage()

    // 5. Verify user is STILL logged in
    const activeUserId = loadPersistedSession()
    expect(activeUserId).toBe(aarav.id)

    // 6. Verify registration is present in My Registrations
    const aaravRegs = getRegistrationsForStudent(aarav.id)
    expect(aaravRegs).toHaveLength(1)
    expect(aaravRegs[0].eventId).toBe('evt-08')
    expect(aaravRegs[0].status).toBe('confirmed')

    // 7. Verify seats are still decreased
    const eventAfterReload1 = getEventById('evt-08')!
    expect(eventAfterReload1.seatsAvailable).toBe(19)

    // 8. Cancel registration
    const cancel = cancelRegistration(aarav, aaravRegs[0].id)
    expect(cancel.success).toBe(true)
    expect(eventAfterReload1.seatsAvailable).toBe(20)

    // 9. Refresh again
    events.length = 0
    events.push(...SEED_EVENTS.map((e) => ({ ...e })))
    registrations.length = 0
    registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))

    syncEventsFromStorage()
    syncRegistrationsFromStorage()

    // 10. Verify cancellation state persists
    const aaravRegsAfterCancel = getRegistrationsForStudent(aarav.id)
    expect(aaravRegsAfterCancel[0].status).toBe('cancelled')

    // 11. Verify seat count remains correct (20)
    const eventAfterReload2 = getEventById('evt-08')!
    expect(eventAfterReload2.seatsAvailable).toBe(20)
  })
})
