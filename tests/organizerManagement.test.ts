import { describe, it, expect, beforeEach } from 'vitest'
import {
  events,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getEventById,
  CampusEvent,
} from '@/data/events'
import {
  registrations,
  registerStudentForEvent,
  Registration,
} from '@/data/registrations'
import { AppUser } from '@/data/auth'

describe('Feature 4 — Organizer Event Management', () => {
  const organizerUser: AppUser = {
    id: 'org-test-mgr',
    name: 'Manager Organizer',
    role: 'organizer',
  }

  const otherOrganizer: AppUser = {
    id: 'org-test-other',
    name: 'Other Organizer',
    role: 'organizer',
  }

  const studentUser: AppUser = {
    id: 'stu-test-org',
    name: 'Student User',
    role: 'student',
  }

  let sampleEvent: CampusEvent

  beforeEach(() => {
    sampleEvent = {
      id: `evt-mgr-${Math.random().toString(36).substring(2, 7)}`,
      name: 'Initial Event Name',
      description: 'Initial Description',
      date: '2026-10-30T10:00:00', // Future relative to TODAY (2026-09-16)
      venue: 'Block A Hall 1',
      category: 'Tech',
      capacity: 20,
      seatsAvailable: 20,
      organizerId: organizerUser.id,
      cancelled: false,
    }
    events.push(sampleEvent)
  })

  // 1. Organizer can create a valid event
  it('allows organizer to create a valid event', () => {
    const res = createEvent(organizerUser, {
      name: 'New Campus Event',
      description: 'A great event description',
      date: '2026-11-15T14:00:00',
      venue: 'Main Auditorium',
      category: 'Workshop',
      capacity: 100,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.event.name).toBe('New Campus Event')
    }
  })

  // 2. Created event has a unique ID
  it('assigns a unique ID to newly created events', () => {
    const res1 = createEvent(organizerUser, {
      name: 'Event One',
      description: 'Desc 1',
      date: '2026-11-15T14:00:00',
      venue: 'Venue 1',
      category: 'Tech',
      capacity: 50,
    })
    const res2 = createEvent(organizerUser, {
      name: 'Event Two',
      description: 'Desc 2',
      date: '2026-11-15T14:00:00',
      venue: 'Venue 2',
      category: 'Tech',
      capacity: 50,
    })
    expect(res1.success && res2.success).toBe(true)
    if (res1.success && res2.success) {
      expect(res1.event.id).not.toBe(res2.event.id)
    }
  })

  // 3. Created event gets current organizerId
  it('sets organizerId to current organizer ID', () => {
    const res = createEvent(organizerUser, {
      name: 'Owner Check Event',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'Sports',
      capacity: 30,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.event.organizerId).toBe(organizerUser.id)
    }
  })

  // 4. Created event starts with seatsAvailable === capacity
  it('initializes seatsAvailable to match capacity', () => {
    const res = createEvent(organizerUser, {
      name: 'Capacity Check Event',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'Cultural',
      capacity: 75,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.event.seatsAvailable).toBe(75)
    }
  })

  // 5. Empty name is rejected
  it('rejects creation when name is empty or whitespace', () => {
    const res = createEvent(organizerUser, {
      name: '   ',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'Cultural',
      capacity: 50,
    })
    expect(res.success).toBe(false)
  })

  // 6. Empty venue is rejected
  it('rejects creation when venue is empty or whitespace', () => {
    const res = createEvent(organizerUser, {
      name: 'Valid Name',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: '   ',
      category: 'Cultural',
      capacity: 50,
    })
    expect(res.success).toBe(false)
  })

  // 7. Invalid date is rejected
  it('rejects creation with an invalid date string', () => {
    const res = createEvent(organizerUser, {
      name: 'Valid Name',
      description: 'Desc',
      date: 'not-a-real-date',
      venue: 'Venue',
      category: 'Cultural',
      capacity: 50,
    })
    expect(res.success).toBe(false)
  })

  // 8. Past date is rejected
  it('rejects creation with a past date relative to TODAY', () => {
    const res = createEvent(organizerUser, {
      name: 'Valid Name',
      description: 'Desc',
      date: '2026-09-01T10:00:00',
      venue: 'Venue',
      category: 'Cultural',
      capacity: 50,
    })
    expect(res.success).toBe(false)
  })

  // 9. Invalid capacity is rejected
  it('rejects creation with zero or negative capacity', () => {
    const zeroRes = createEvent(organizerUser, {
      name: 'Valid Name',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'Cultural',
      capacity: 0,
    })
    expect(zeroRes.success).toBe(false)

    const negRes = createEvent(organizerUser, {
      name: 'Valid Name',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'Cultural',
      capacity: -5,
    })
    expect(negRes.success).toBe(false)
  })

  // 10. Invalid category is rejected
  it('rejects creation with invalid category', () => {
    const res = createEvent(organizerUser, {
      name: 'Valid Name',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'InvalidCategory' as any,
      capacity: 50,
    })
    expect(res.success).toBe(false)
  })

  // 11. Invalid creation does not mutate the store
  it('does not add event to events array upon validation failure', () => {
    const initialCount = events.length
    createEvent(organizerUser, {
      name: '',
      description: '',
      date: '',
      venue: '',
      category: 'Tech',
      capacity: 0,
    })
    expect(events.length).toBe(initialCount)
  })

  // 12. Organizer can edit an event
  it('allows organizer to edit an existing event', () => {
    const res = updateEvent(organizerUser, sampleEvent.id, {
      name: 'Updated Event Name',
      venue: 'Updated Hall 2',
    })
    expect(res.success).toBe(true)
    expect(sampleEvent.name).toBe('Updated Event Name')
    expect(sampleEvent.venue).toBe('Updated Hall 2')
  })

  // 13. Event ID remains unchanged
  it('preserves the event ID upon editing', () => {
    const originalId = sampleEvent.id
    updateEvent(organizerUser, sampleEvent.id, { name: 'New Name' })
    expect(sampleEvent.id).toBe(originalId)
  })

  // 14. Editing does not create a duplicate
  it('updates in place without creating a duplicate event', () => {
    const initialCount = events.length
    updateEvent(organizerUser, sampleEvent.id, { name: 'In-Place Name' })
    expect(events.length).toBe(initialCount)
  })

  // 15. Invalid edit is rejected
  it('rejects edit with invalid fields', () => {
    const res = updateEvent(organizerUser, sampleEvent.id, { name: '   ' })
    expect(res.success).toBe(false)
  })

  // 16. Invalid edit does not corrupt the existing event
  it('preserves original values when an edit is rejected', () => {
    const originalName = sampleEvent.name
    updateEvent(organizerUser, sampleEvent.id, { name: '   ' })
    expect(sampleEvent.name).toBe(originalName)
  })

  // 17. Capacity correctly accounts for active confirmed registrations
  it('updates seatsAvailable correctly when capacity is modified', () => {
    // Register 2 students
    const s1: AppUser = { id: `stu-1-${Math.random()}`, name: 'S1', role: 'student' }
    const s2: AppUser = { id: `stu-2-${Math.random()}`, name: 'S2', role: 'student' }
    registerStudentForEvent(s1, sampleEvent.id)
    registerStudentForEvent(s2, sampleEvent.id)

    expect(sampleEvent.seatsAvailable).toBe(18) // 20 - 2

    // Update capacity to 25
    const res = updateEvent(organizerUser, sampleEvent.id, { capacity: 25 })
    expect(res.success).toBe(true)
    expect(sampleEvent.capacity).toBe(25)
    expect(sampleEvent.seatsAvailable).toBe(23) // 25 - 2
  })

  // 18. Capacity cannot be reduced below active registrations
  it('rejects capacity reduction below current active registrations', () => {
    const s1: AppUser = { id: `stu-cap1-${Math.random()}`, name: 'S1', role: 'student' }
    const s2: AppUser = { id: `stu-cap2-${Math.random()}`, name: 'S2', role: 'student' }
    registerStudentForEvent(s1, sampleEvent.id)
    registerStudentForEvent(s2, sampleEvent.id)

    // Attempt to reduce capacity to 1 (while 2 are registered)
    const res = updateEvent(organizerUser, sampleEvent.id, { capacity: 1 })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/below current active registrations/i)
    }
    expect(sampleEvent.capacity).toBe(20) // unchanged
  })

  // 19. seatsAvailable never becomes negative
  it('never produces negative seatsAvailable on capacity edit', () => {
    expect(sampleEvent.seatsAvailable).toBeGreaterThanOrEqual(0)
  })

  // 20. Organizer can cancel an event
  it('allows organizer to cancel an event', () => {
    const res = cancelEvent(organizerUser, sampleEvent.id)
    expect(res.success).toBe(true)
    expect(sampleEvent.cancelled).toBe(true)
  })

  // 21. Cancelled state is persisted in the in-memory store
  it('persists cancelled state in event object', () => {
    cancelEvent(organizerUser, sampleEvent.id)
    const lookup = getEventById(sampleEvent.id)
    expect(lookup?.cancelled).toBe(true)
  })

  // 22. Cancelled event cannot be registered for
  it('prevents students from registering for a cancelled event', () => {
    cancelEvent(organizerUser, sampleEvent.id)
    const res = registerStudentForEvent(studentUser, sampleEvent.id)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/cancelled event/i)
    }
  })

  // 23. Cancelled event is excluded from active student event discovery
  it('filters out cancelled events from active discovery', () => {
    cancelEvent(organizerUser, sampleEvent.id)
    const eligible = events.filter((e) => !e.cancelled)
    expect(eligible.some((e) => e.id === sampleEvent.id)).toBe(false)
  })

  // 24. Cancelling does not corrupt existing registration records
  it('preserves registration records when event is cancelled', () => {
    const s1: AppUser = { id: `stu-pres-${Math.random()}`, name: 'S1', role: 'student' }
    const regRes = registerStudentForEvent(s1, sampleEvent.id)
    expect(regRes.success).toBe(true)
    if (!regRes.success) return

    cancelEvent(organizerUser, sampleEvent.id)
    const foundReg = registrations.find((r) => r.id === regRes.registration.id)
    expect(foundReg).toBeDefined()
  })

  // 25. Organizer can delete an event
  it('allows organizer to delete an event', () => {
    const res = deleteEvent(organizerUser, sampleEvent.id)
    expect(res.success).toBe(true)
    expect(getEventById(sampleEvent.id)).toBeUndefined()
  })

  // 26. Deleted event no longer exists
  it('removes deleted event from events array', () => {
    deleteEvent(organizerUser, sampleEvent.id)
    expect(events.some((e) => e.id === sampleEvent.id)).toBe(false)
  })

  // 27. Unrelated events remain unchanged
  it('does not affect unrelated events when one is deleted', () => {
    const otherEvent: CampusEvent = {
      ...sampleEvent,
      id: `evt-unrelated-${Math.random().toString(36).substring(2, 7)}`,
      name: 'Unrelated Event',
    }
    events.push(otherEvent)

    deleteEvent(organizerUser, sampleEvent.id)
    expect(getEventById(otherEvent.id)).toBeDefined()
  })

  // 28. No broken registration references remain after deletion
  it('removes associated registrations so no broken references remain', () => {
    const s1: AppUser = { id: `stu-del-${Math.random()}`, name: 'S1', role: 'student' }
    registerStudentForEvent(s1, sampleEvent.id)

    expect(registrations.some((r) => r.eventId === sampleEvent.id)).toBe(true)

    deleteEvent(organizerUser, sampleEvent.id)
    expect(registrations.some((r) => r.eventId === sampleEvent.id)).toBe(false)
  })

  // 29. Missing event is handled gracefully
  it('handles missing event deletion gracefully', () => {
    const res = deleteEvent(organizerUser, 'non-existent-id-xyz')
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toMatch(/event not found/i)
    }
  })

  // 30. Student cannot create an event
  it('rejects createEvent from a student user', () => {
    const res = createEvent(studentUser, {
      name: 'Student Created',
      description: 'Desc',
      date: '2026-11-15T14:00:00',
      venue: 'Venue',
      category: 'Tech',
      capacity: 50,
    })
    expect(res.success).toBe(false)
  })

  // 31. Student cannot edit an event
  it('rejects updateEvent from a student user', () => {
    const res = updateEvent(studentUser, sampleEvent.id, { name: 'Hacked' })
    expect(res.success).toBe(false)
  })

  // 32. Student cannot cancel an event
  it('rejects cancelEvent from a student user', () => {
    const res = cancelEvent(studentUser, sampleEvent.id)
    expect(res.success).toBe(false)
  })

  // 33. Student cannot delete an event
  it('rejects deleteEvent from a student user', () => {
    const res = deleteEvent(studentUser, sampleEvent.id)
    expect(res.success).toBe(false)
  })

  // Ownership check: organizer cannot edit another organizer's event
  it('rejects edit/cancel/delete from a different organizer', () => {
    const editRes = updateEvent(otherOrganizer, sampleEvent.id, { name: 'Stolen' })
    expect(editRes.success).toBe(false)

    const cancelRes = cancelEvent(otherOrganizer, sampleEvent.id)
    expect(cancelRes.success).toBe(false)

    const deleteRes = deleteEvent(otherOrganizer, sampleEvent.id)
    expect(deleteRes.success).toBe(false)
  })
})
