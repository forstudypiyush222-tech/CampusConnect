import { describe, it, expect, beforeEach } from 'vitest'
import { users, getUserById, AppUser } from '@/data/auth'
import {
  events,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  CampusEvent,
} from '@/data/events'
import {
  registrations,
  registerStudentForEvent,
  getRegistrationsForStudent,
  cancelRegistration,
} from '@/data/registrations'

describe('Task 2 — Require Login & Authentication Flow', () => {
  const seededStudent = users.find((u) => u.role === 'student')!
  const seededOrganizer = users.find((u) => u.role === 'organizer')!

  let testEvent: CampusEvent

  beforeEach(() => {
    testEvent = {
      id: `evt-login-${Math.random().toString(36).substring(2, 7)}`,
      name: 'Auth Test Event',
      description: 'Event for testing login requirement',
      date: '2026-11-20T10:00:00',
      venue: 'Auditorium',
      category: 'Tech',
      capacity: 25,
      seatsAvailable: 25,
      organizerId: seededOrganizer.id,
      cancelled: false,
    }
    events.push(testEvent)
  })

  // 1. Logged-out user cannot register
  it('rejects registration when user is logged out (null or undefined)', () => {
    const resNull = registerStudentForEvent(null, testEvent.id)
    expect(resNull.success).toBe(false)
    if (!resNull.success) {
      expect(resNull.error).toMatch(/logged in/i)
    }

    const resUndefined = registerStudentForEvent(undefined, testEvent.id)
    expect(resUndefined.success).toBe(false)
    if (!resUndefined.success) {
      expect(resUndefined.error).toMatch(/logged in/i)
    }
  })

  // 2. Logged-out registration does not create a registration
  it('does not create any registration when user is logged out', () => {
    const countBefore = registrations.length
    registerStudentForEvent(null, testEvent.id)
    expect(registrations.length).toBe(countBefore)
  })

  // 3. Logged-out registration does not decrease seats
  it('does not decrease available seats when user is logged out', () => {
    const seatsBefore = testEvent.seatsAvailable
    registerStudentForEvent(null, testEvent.id)
    expect(testEvent.seatsAvailable).toBe(seatsBefore)
  })

  // 4. Student can log in using an existing seeded student account
  it('finds and authenticates existing seeded student account', () => {
    const user = getUserById(seededStudent.id)
    expect(user).toBeDefined()
    expect(user?.role).toBe('student')
    expect(user?.name).toBe('Aditi Rao')
  })

  // 5. Logged-in student can register successfully
  it('allows a logged-in student to register successfully', () => {
    const res = registerStudentForEvent(seededStudent, testEvent.id)
    expect(res.success).toBe(true)
    expect(testEvent.seatsAvailable).toBe(24)
  })

  // 6. Logged-in student cannot duplicate-register
  it('prevents a logged-in student from registering twice for the same event', () => {
    const first = registerStudentForEvent(seededStudent, testEvent.id)
    expect(first.success).toBe(true)

    const second = registerStudentForEvent(seededStudent, testEvent.id)
    expect(second.success).toBe(false)
    if (!second.success) {
      expect(second.error).toMatch(/already registered/i)
    }
    expect(testEvent.seatsAvailable).toBe(24)
  })

  // 7. Organizer can log in using the existing seeded organizer account
  it('finds and authenticates existing seeded organizer account', () => {
    const user = getUserById(seededOrganizer.id)
    expect(user).toBeDefined()
    expect(user?.role).toBe('organizer')
    expect(user?.name).toBe('Rohan Verma')
  })

  // 8. Organizer retains organizer access
  it('allows logged-in organizer to manage events', () => {
    const res = createEvent(seededOrganizer, {
      name: 'Organizer Created Event',
      description: 'Desc',
      date: '2026-11-25T14:00:00',
      venue: 'Room 101',
      category: 'Tech',
      capacity: 30,
    })
    expect(res.success).toBe(true)
  })

  // 9. Student cannot access organizer management
  it('rejects event creation from a logged-in student', () => {
    const res = createEvent(seededStudent, {
      name: 'Student Attempted Event',
      description: 'Desc',
      date: '2026-11-25T14:00:00',
      venue: 'Room 101',
      category: 'Tech',
      capacity: 30,
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/organizers/i)
    }
  })

  // 10. Logged-out user cannot access organizer management
  it('rejects event creation, edit, cancel, and delete from a logged-out user', () => {
    const createRes = createEvent(null, {
      name: 'Logged Out Event',
      description: 'Desc',
      date: '2026-11-25T14:00:00',
      venue: 'Room 101',
      category: 'Tech',
      capacity: 30,
    })
    expect(createRes.success).toBe(false)

    const editRes = updateEvent(null, testEvent.id, { name: 'Hacked' })
    expect(editRes.success).toBe(false)

    const cancelRes = cancelEvent(null, testEvent.id)
    expect(cancelRes.success).toBe(false)

    const deleteRes = deleteEvent(null, testEvent.id)
    expect(deleteRes.success).toBe(false)
  })

  // 11. Logged-out user cannot access another user's registrations / cancel
  it('rejects cancellation from a logged-out user', () => {
    const regRes = registerStudentForEvent(seededStudent, testEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    const cancelRes = cancelRegistration(null, regRes.registration.id)
    expect(cancelRes.success).toBe(false)
    if (!cancelRes.success) {
      expect(cancelRes.error).toMatch(/logged in/i)
    }
  })

  // 12. Logged-in student sees only their own registrations
  it('isolates student registrations so only their own records are returned', () => {
    const myRegs = getRegistrationsForStudent(seededStudent.id)
    expect(myRegs.every((r) => r.studentId === seededStudent.id)).toBe(true)
  })

  // 13. Organizer is rejected from student registration
  it('rejects registration from a logged-in organizer account', () => {
    const res = registerStudentForEvent(seededOrganizer, testEvent.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/students/i)
    }
  })
})
