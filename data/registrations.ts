import { AppUser } from './auth'
import { getEventById, isPastEvent, isFullEvent } from './events'

// Seed data for registrations, so the "My Registrations" and Organizer
// pages have something real to display before participants build the
// actual registration flow (Task 2 and Task 3).

export type RegistrationStatus = 'confirmed' | 'cancelled'

export interface Registration {
  id: string
  eventId: string
  studentId: string
  status: RegistrationStatus
  registeredAt: string // ISO date string
}

// NOTE FOR PARTICIPANTS: this array is the "database" of registrations.
// Task 2 (Registration) means pushing new items into this array when a
// student registers. Task 3 (Cancellation) means updating an item's
// status here. Keep using this same array — don't create a second store.
export const registrations: Registration[] = [
  {
    id: 'reg-01',
    eventId: 'evt-01',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-09-10T10:15:00',
  },
  {
    id: 'reg-02',
    eventId: 'evt-04',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-08-20T09:00:00',
  },
  {
    id: 'reg-03',
    eventId: 'evt-09',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-09-12T18:40:00',
  },
]

/** Simple lookup used by the placeholder "My Registrations" page. */
export function getRegistrationsForStudent(studentId: string): Registration[] {
  return registrations.filter((reg) => reg.studentId === studentId)
}

/** Checks whether a student has an active confirmed registration for an event. */
export function hasActiveRegistration(
  studentId: string,
  eventId: string,
): boolean {
  return registrations.some(
    (reg) =>
      reg.studentId === studentId &&
      reg.eventId === eventId &&
      reg.status === 'confirmed',
  )
}

export type RegistrationResult =
  | { success: true; registration: Registration }
  | { success: false; error: string }

/**
 * Registers a student for an event following the exact validation flow:
 * 1. Authentication / Role check
 * 2. Event existence check
 * 3. Event status check (past / cancelled)
 * 4. Duplicate registration check
 * 5. Capacity check
 * 6. Atomic creation and seat decrement
 */
export function registerStudentForEvent(
  user: AppUser | null | undefined,
  eventId: string,
): RegistrationResult {
  // 1. AUTHENTICATION / ROLE
  if (!user) {
    return { success: false, error: 'You must be logged in to register.' }
  }
  if (user.role !== 'student') {
    return { success: false, error: 'Only students can register for events.' }
  }

  // 2. EVENT EXISTENCE
  const event = getEventById(eventId)
  if (!event) {
    return { success: false, error: 'Event not found.' }
  }

  // 3. EVENT STATUS
  if (isPastEvent(event)) {
    return { success: false, error: 'Cannot register for a past event.' }
  }
  if (event.cancelled) {
    return { success: false, error: 'Cannot register for a cancelled event.' }
  }

  // 4. DUPLICATE REGISTRATION
  if (hasActiveRegistration(user.id, eventId)) {
    return {
      success: false,
      error: 'You are already registered for this event.',
    }
  }

  // 5. CAPACITY
  if (isFullEvent(event) || event.seatsAvailable <= 0) {
    return { success: false, error: 'This event is full.' }
  }

  // 6. SUCCESSFUL REGISTRATION
  const newRegistration: Registration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    eventId,
    studentId: user.id,
    status: 'confirmed',
    registeredAt: new Date().toISOString(),
  }

  registrations.push(newRegistration)
  event.seatsAvailable -= 1

  return { success: true, registration: newRegistration }
}
