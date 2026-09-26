import { describe, it, expect, beforeEach } from 'vitest'
import {
  registrations,
  registerStudentForEvent,
  hasActiveRegistration,
} from '@/data/registrations'
import { events, getEventById, CampusEvent } from '@/data/events'
import { AppUser } from '@/data/auth'

describe('Feature 2 — Student Registration Requirements', () => {
  const studentUser: AppUser = {
    id: 'stu-test',
    name: 'Test Student',
    role: 'student',
  }

  const organizerUser: AppUser = {
    id: 'org-test',
    name: 'Test Organizer',
    role: 'organizer',
  }

  // Create a clean test event before each test
  let testEvent: CampusEvent

  beforeEach(() => {
    testEvent = {
      id: `evt-test-${Math.random().toString(36).substring(2, 7)}`,
      name: 'Test Hackathon Event',
      description: 'Test Description',
      date: '2026-10-15T10:00:00', // Future relative to TODAY (2026-09-16)
      venue: 'Test Venue',
      category: 'Tech',
      capacity: 50,
      seatsAvailable: 10,
      organizerId: 'org-1',
      cancelled: false,
    }
    events.push(testEvent)
  })

  // 1. Valid logged-in student can register
  it('allows a valid logged-in student to register', () => {
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.registration).toBeDefined()
    }
  })

  // 2. Exactly one registration is created
  it('creates exactly one registration upon success', () => {
    const initialCount = registrations.length
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    expect(registrations.length).toBe(initialCount + 1)
  })

  // 3. Registration contains the correct student ID
  it('stores the correct student ID on the registration', () => {
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.registration.studentId).toBe(studentUser.id)
    }
  })

  // 4. Registration contains the correct event ID
  it('stores the correct event ID on the registration', () => {
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.registration.eventId).toBe(testEvent.id)
    }
  })

  // 5. Registration receives the correct active/confirmed status
  it('marks the registration with confirmed status', () => {
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.registration.status).toBe('confirmed')
    }
  })

  // 6. registeredAt is populated correctly
  it('populates registeredAt with a valid ISO timestamp', () => {
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.registration.registeredAt).toBeDefined()
      expect(new Date(res.registration.registeredAt).getTime()).not.toBeNaN()
    }
  })

  // 7. Available seats decrease by exactly 1
  it('decreases available seats by exactly 1 upon successful registration', () => {
    const initialSeats = testEvent.seatsAvailable
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(true)
    expect(testEvent.seatsAvailable).toBe(initialSeats - 1)
  })

  // 8. Zero seats never become negative
  it('never allows seats to become negative', () => {
    testEvent.seatsAvailable = 0
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(false)
    expect(testEvent.seatsAvailable).toBe(0)
  })

  // 9. Duplicate active registration is rejected
  it('rejects duplicate active registration for the same student and event', () => {
    const first = registerStudentForEvent(studentUser, testEvent.id)
    expect(first.success).toBe(true)

    const second = registerStudentForEvent(studentUser, testEvent.id)
    expect(second.success).toBe(false)
    if (!second.success) {
      expect(second.error).toMatch(/already registered/i)
    }
  })

  // 10. Duplicate attempt does not change seat count
  it('leaves seat count unchanged when duplicate registration is attempted', () => {
    registerStudentForEvent(studentUser, testEvent.id)
    const seatsAfterFirst = testEvent.seatsAvailable

    const second = registerStudentForEvent(studentUser, testEvent.id)
    expect(second.success).toBe(false)
    expect(testEvent.seatsAvailable).toBe(seatsAfterFirst)
  })

  // 11. Full event is rejected
  it('rejects registration when the event is full', () => {
    testEvent.seatsAvailable = 0
    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/full/i)
    }
  })

  // 12. Full-event attempt does not change seat count
  it('leaves seat count at 0 when full-event registration is rejected', () => {
    testEvent.seatsAvailable = 0
    registerStudentForEvent(studentUser, testEvent.id)
    expect(testEvent.seatsAvailable).toBe(0)
  })

  // 13. Past event is rejected
  it('rejects registration for a past event', () => {
    testEvent.date = '2026-09-01T10:00:00' // Past relative to TODAY (2026-09-16)
    const initialSeats = testEvent.seatsAvailable

    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/past event/i)
    }
    expect(testEvent.seatsAvailable).toBe(initialSeats)
  })

  // 14. Past-event attempt does not change seat count
  it('leaves seat count unchanged when past-event registration is rejected', () => {
    testEvent.date = '2026-09-01T10:00:00'
    const initialSeats = testEvent.seatsAvailable
    registerStudentForEvent(studentUser, testEvent.id)
    expect(testEvent.seatsAvailable).toBe(initialSeats)
  })

  // 15. Cancelled event is rejected
  it('rejects registration for a cancelled event', () => {
    testEvent.cancelled = true
    const initialSeats = testEvent.seatsAvailable

    const res = registerStudentForEvent(studentUser, testEvent.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/cancelled event/i)
    }
    expect(testEvent.seatsAvailable).toBe(initialSeats)
  })

  // 16. Cancelled-event attempt does not change seat count
  it('leaves seat count unchanged when cancelled-event registration is rejected', () => {
    testEvent.cancelled = true
    const initialSeats = testEvent.seatsAvailable
    registerStudentForEvent(studentUser, testEvent.id)
    expect(testEvent.seatsAvailable).toBe(initialSeats)
  })

  // 17. Missing event is handled gracefully
  it('returns graceful error for non-existent event ID without crashing', () => {
    const res = registerStudentForEvent(studentUser, 'non-existent-id-999')
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/not found/i)
    }
  })

  // 18. Unauthenticated user is rejected
  it('rejects registration when user is null or undefined', () => {
    const resNull = registerStudentForEvent(null, testEvent.id)
    expect(resNull.success).toBe(false)

    const resUndefined = registerStudentForEvent(undefined, testEvent.id)
    expect(resUndefined.success).toBe(false)
  })

  // 19. Organizer is rejected from student registration
  it('rejects registration attempt from an organizer account', () => {
    const initialSeats = testEvent.seatsAvailable
    const res = registerStudentForEvent(organizerUser, testEvent.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/students/i)
    }
    expect(testEvent.seatsAvailable).toBe(initialSeats)
  })

  // 20. hasActiveRegistration helper checks properly
  it('correctly reports hasActiveRegistration status', () => {
    expect(hasActiveRegistration(studentUser.id, testEvent.id)).toBe(false)
    registerStudentForEvent(studentUser, testEvent.id)
    expect(hasActiveRegistration(studentUser.id, testEvent.id)).toBe(true)
  })
})
