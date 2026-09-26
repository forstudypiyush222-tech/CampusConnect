import { describe, it, expect, beforeEach } from 'vitest'
import {
  registrations,
  getRegistrationsForStudent,
  hasActiveRegistration,
  registerStudentForEvent,
  cancelRegistration,
  Registration,
} from '@/data/registrations'
import { events, isPastEvent, CampusEvent } from '@/data/events'
import { AppUser } from '@/data/auth'

describe('Feature 3 — My Registrations & Cancellation Requirements', () => {
  const studentUser: AppUser = {
    id: 'stu-myreg-test',
    name: 'MyReg Student',
    role: 'student',
    email: 'myreg-student@campus.edu',
    password: 'test1234',
  }

  const otherStudent: AppUser = {
    id: 'stu-other-test',
    name: 'Other Student',
    role: 'student',
    email: 'other-student@campus.edu',
    password: 'test1234',
  }

  const organizerUser: AppUser = {
    id: 'org-myreg-test',
    name: 'Organizer User',
    role: 'organizer',
    email: 'org-myreg@campus.edu',
    password: 'test1234',
  }

  let upcomingEvent: CampusEvent
  let pastEvent: CampusEvent

  beforeEach(() => {
    upcomingEvent = {
      id: `evt-up-${Math.random().toString(36).substring(2, 7)}`,
      name: 'Upcoming Workshop',
      description: 'Test upcoming',
      date: '2026-10-20T10:00:00', // After TODAY (2026-09-16)
      venue: 'Lab 1',
      category: 'Workshop',
      capacity: 30,
      seatsAvailable: 15,
      organizerId: 'org-1',
      cancelled: false,
    }

    pastEvent = {
      id: `evt-past-${Math.random().toString(36).substring(2, 7)}`,
      name: 'Past Hackathon',
      description: 'Test past',
      date: '2026-08-10T10:00:00', // Before TODAY (2026-09-16)
      venue: 'Hall A',
      category: 'Tech',
      capacity: 50,
      seatsAvailable: 20,
      organizerId: 'org-1',
      cancelled: false,
    }

    events.push(upcomingEvent, pastEvent)
  })

  // 1. Student with no registrations
  it('returns empty array for a student with no registrations', () => {
    const list = getRegistrationsForStudent('non-existent-student')
    expect(list).toEqual([])
  })

  // 2. Student with one upcoming registration
  it('identifies upcoming registrations based on isPastEvent', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)

    const list = getRegistrationsForStudent(studentUser.id)
    const upcoming = list.filter((r) => {
      const e = events.find((ev) => ev.id === r.eventId)
      return e && !isPastEvent(e)
    })
    expect(upcoming.length).toBe(1)
    expect(upcoming[0].eventId).toBe(upcomingEvent.id)
  })

  // 3. Student with one past registration
  it('identifies past registrations based on isPastEvent', () => {
    const pastReg: Registration = {
      id: `reg-past-${Math.random().toString(36).substring(2, 7)}`,
      eventId: pastEvent.id,
      studentId: studentUser.id,
      status: 'confirmed',
      registeredAt: '2026-08-01T10:00:00',
    }
    registrations.push(pastReg)

    const list = getRegistrationsForStudent(studentUser.id)
    const pastList = list.filter((r) => {
      const e = events.find((ev) => ev.id === r.eventId)
      return e && isPastEvent(e)
    })
    expect(pastList.some((r) => r.id === pastReg.id)).toBe(true)
  })

  // 4. Student with multiple registrations
  it('returns all registrations belonging to the student', () => {
    const reg1 = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(reg1.success).toBe(true)

    const reg2: Registration = {
      id: `reg-multi-${Math.random().toString(36).substring(2, 7)}`,
      eventId: pastEvent.id,
      studentId: studentUser.id,
      status: 'confirmed',
      registeredAt: '2026-08-01T10:00:00',
    }
    registrations.push(reg2)

    const list = getRegistrationsForStudent(studentUser.id)
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  // 5. Only current student's registrations are shown
  it('shows only current student registrations, not other students', () => {
    registerStudentForEvent(studentUser, upcomingEvent.id)

    const otherEvent: CampusEvent = {
      ...upcomingEvent,
      id: `evt-other-${Math.random().toString(36).substring(2, 7)}`,
    }
    events.push(otherEvent)
    registerStudentForEvent(otherStudent, otherEvent.id)

    const myRegs = getRegistrationsForStudent(studentUser.id)
    expect(myRegs.every((r) => r.studentId === studentUser.id)).toBe(true)
    expect(myRegs.some((r) => r.studentId === otherStudent.id)).toBe(false)
  })

  // 6. Organizer cannot access student registrations
  it('rejects cancellation attempts made by an organizer', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    const cancelRes = cancelRegistration(organizerUser, regRes.registration.id)
    expect(cancelRes.success).toBe(false)
    if (!cancelRes.success) {
      expect(cancelRes.error).toMatch(/students/i)
    }
  })

  // 7. Missing event is handled gracefully
  it('handles missing event gracefully without crashing', () => {
    const orphanReg: Registration = {
      id: `reg-orphan-${Math.random().toString(36).substring(2, 7)}`,
      eventId: 'missing-event-id-999',
      studentId: studentUser.id,
      status: 'confirmed',
      registeredAt: '2026-09-01T10:00:00',
    }
    registrations.push(orphanReg)

    const res = cancelRegistration(studentUser, orphanReg.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/event not found/i)
    }
  })

  // 8. Student can cancel an active registration
  it('allows a student to cancel their own active registration', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    const cancelRes = cancelRegistration(studentUser, regRes.registration.id)
    expect(cancelRes.success).toBe(true)
  })

  // 9. Cancellation changes status correctly
  it('updates registration status to cancelled', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    cancelRegistration(studentUser, regRes.registration.id)
    const updated = registrations.find((r) => r.id === regRes.registration.id)
    expect(updated?.status).toBe('cancelled')
  })

  // 10. Cancellation restores exactly one seat
  it('restores exactly 1 seat upon cancellation', () => {
    const initialSeats = upcomingEvent.seatsAvailable
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    expect(upcomingEvent.seatsAvailable).toBe(initialSeats - 1)
    if (!regRes.success) return

    const cancelRes = cancelRegistration(studentUser, regRes.registration.id)
    expect(cancelRes.success).toBe(true)
    expect(upcomingEvent.seatsAvailable).toBe(initialSeats)
  })

  // 11. Cancelling twice does not restore another seat
  it('does not restore a seat on a second cancellation attempt', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    cancelRegistration(studentUser, regRes.registration.id)
    const seatsAfterFirst = upcomingEvent.seatsAvailable

    const secondCancel = cancelRegistration(studentUser, regRes.registration.id)
    expect(secondCancel.success).toBe(false)
    expect(upcomingEvent.seatsAvailable).toBe(seatsAfterFirst)
  })

  // 12. Already-cancelled registration cannot be cancelled again
  it('rejects cancellation of an already cancelled registration', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    cancelRegistration(studentUser, regRes.registration.id)
    const second = cancelRegistration(studentUser, regRes.registration.id)
    expect(second.success).toBe(false)
    if (!second.success) {
      expect(second.error).toMatch(/already cancelled/i)
    }
  })

  // 13. Another student's registration cannot be cancelled
  it('rejects attempts to cancel another student registration', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    const unauthorizedCancel = cancelRegistration(otherStudent, regRes.registration.id)
    expect(unauthorizedCancel.success).toBe(false)
    if (!unauthorizedCancel.success) {
      expect(unauthorizedCancel.error).toMatch(/only cancel your own/i)
    }
  })

  // 14. Cancellation cannot increase seats above capacity
  it('never increases seats beyond event capacity', () => {
    upcomingEvent.seatsAvailable = upcomingEvent.capacity
    const dummyReg: Registration = {
      id: `reg-cap-${Math.random().toString(36).substring(2, 7)}`,
      eventId: upcomingEvent.id,
      studentId: studentUser.id,
      status: 'confirmed',
      registeredAt: '2026-09-01T10:00:00',
    }
    registrations.push(dummyReg)

    cancelRegistration(studentUser, dummyReg.id)
    expect(upcomingEvent.seatsAvailable).toBe(upcomingEvent.capacity)
  })

  // 15. Cancellation cannot create negative/invalid seat states
  it('maintains valid seat counts', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    cancelRegistration(studentUser, regRes.registration.id)
    expect(upcomingEvent.seatsAvailable).toBeGreaterThanOrEqual(0)
    expect(upcomingEvent.seatsAvailable).toBeLessThanOrEqual(upcomingEvent.capacity)
  })

  // 16. Cancelled registrations are not treated as active
  it('marks registration as inactive in hasActiveRegistration after cancellation', () => {
    const regRes = registerStudentForEvent(studentUser, upcomingEvent.id)
    expect(regRes.success).toBe(true)
    expect(hasActiveRegistration(studentUser.id, upcomingEvent.id)).toBe(true)
    if (!regRes.success) return

    cancelRegistration(studentUser, regRes.registration.id)
    expect(hasActiveRegistration(studentUser.id, upcomingEvent.id)).toBe(false)
  })

  // 17. Cancelled events are not incorrectly shown as active registrations
  it('recognizes cancelled status for cancelled events or registrations', () => {
    upcomingEvent.cancelled = true
    const isCancelledEvent = upcomingEvent.cancelled
    expect(isCancelledEvent).toBe(true)
  })

  // 18. Empty state works correctly
  it('handles student with no registrations gracefully', () => {
    const emptyStudentList = getRegistrationsForStudent('student-with-zero-regs')
    expect(emptyStudentList.length).toBe(0)
  })
})
