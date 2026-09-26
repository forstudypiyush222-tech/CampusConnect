import { AppUser } from './auth'
import {
  events,
  getEventById,
  isPastEvent,
  isFullEvent,
  savePersistedEvents,
  syncEventsFromStorage,
} from './events'

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

export const SEED_REGISTRATIONS: Registration[] = [
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

export const registrations: Registration[] = [
  ...SEED_REGISTRATIONS.map((r) => ({ ...r })),
]

export const REGISTRATION_STORAGE_KEY = 'campusconnect_registrations'

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage
  }
  return null
}

export function loadPersistedRegistrations(): Registration[] | null {
  const storage = getLocalStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(REGISTRATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // ignore parse errors
  }
  return null
}

export function savePersistedRegistrations(regsToSave: Registration[]): void {
  const storage = getLocalStorage()
  if (!storage) return
  try {
    storage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(regsToSave))
  } catch {
    // ignore storage exceptions
  }
}

export function syncRegistrationsFromStorage(): Registration[] {
  const persisted = loadPersistedRegistrations()
  if (!persisted) {
    return registrations
  }

  const persistedIds = new Set(persisted.map((r) => r.id))

  // 1. Remove registrations that are no longer in persisted
  for (let i = registrations.length - 1; i >= 0; i--) {
    if (!persistedIds.has(registrations[i].id)) {
      registrations.splice(i, 1)
    }
  }

  // 2. Update existing in-place, or append new
  for (const pReg of persisted) {
    const existing = registrations.find((r) => r.id === pReg.id)
    if (existing) {
      Object.assign(existing, pReg)
    } else {
      registrations.push(pReg)
    }
  }

  return registrations
}

export function resetRegistrationsToSeed(): void {
  const storage = getLocalStorage()
  if (storage) {
    try {
      storage.removeItem(REGISTRATION_STORAGE_KEY)
    } catch {}
  }
  registrations.length = 0
  registrations.push(...SEED_REGISTRATIONS.map((r) => ({ ...r })))
}

if (typeof window !== 'undefined') {
  syncRegistrationsFromStorage()
}

/** Simple lookup used by the placeholder "My Registrations" page. */
export function getRegistrationsForStudent(studentId: string): Registration[] {
  syncRegistrationsFromStorage()
  return registrations.filter((reg) => reg.studentId === studentId)
}

/** Checks whether a student has an active confirmed registration for an event. */
export function hasActiveRegistration(
  studentId: string,
  eventId: string,
): boolean {
  syncRegistrationsFromStorage()
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
 * 6. Atomic creation, seat decrement, and storage persistence
 */
export function registerStudentForEvent(
  user: AppUser | null | undefined,
  eventId: string,
): RegistrationResult {
  syncRegistrationsFromStorage()
  syncEventsFromStorage()

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

  savePersistedRegistrations(registrations)
  savePersistedEvents(events)

  return { success: true, registration: newRegistration }
}

export type CancellationResult =
  | { success: true; registration: Registration }
  | { success: false; error: string }

/**
 * Cancels an active registration for a student:
 * 1. Validates authenticated student
 * 2. Validates registration existence and ownership
 * 3. Validates registration is currently active ('confirmed')
 * 4. Validates related event existence
 * 5. Updates status to 'cancelled', restores exactly 1 seat (capped at capacity), and persists
 */
export function cancelRegistration(
  user: AppUser | null | undefined,
  registrationId: string,
): CancellationResult {
  syncRegistrationsFromStorage()
  syncEventsFromStorage()

  // 1. Authentication / Role check
  if (!user) {
    return {
      success: false,
      error: 'You must be logged in to cancel a registration.',
    }
  }
  if (user.role !== 'student') {
    return {
      success: false,
      error: 'Only students can manage registrations.',
    }
  }

  // 2. Registration existence check
  const reg = registrations.find((r) => r.id === registrationId)
  if (!reg) {
    return { success: false, error: 'Registration not found.' }
  }

  // 3. Ownership check
  if (reg.studentId !== user.id) {
    return {
      success: false,
      error: 'You can only cancel your own registrations.',
    }
  }

  // 4. Active status check
  if (reg.status !== 'confirmed') {
    return { success: false, error: 'Registration is already cancelled.' }
  }

  // 5. Related event check
  const event = getEventById(reg.eventId)
  if (!event) {
    return { success: false, error: 'Associated event not found.' }
  }

  // 6. Update status and restore exactly 1 seat
  reg.status = 'cancelled'
  if (event.seatsAvailable < event.capacity) {
    event.seatsAvailable += 1
  }

  savePersistedRegistrations(registrations)
  savePersistedEvents(events)

  return { success: true, registration: reg }
}
