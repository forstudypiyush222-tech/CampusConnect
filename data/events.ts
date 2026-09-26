import { AppUser } from './auth'
import { registrations } from './registrations'

export type EventCategory =
  | 'Tech'
  | 'Cultural'
  | 'Sports'
  | 'Workshop'
  | 'Career'
  | 'Music'

export interface CampusEvent {
  id: string
  name: string
  description: string
  date: string // ISO 8601 date string, e.g. "2026-10-02T17:00:00"
  venue: string
  category: EventCategory
  capacity: number
  seatsAvailable: number
  organizerId: string
  cancelled: boolean
}

// "Today" for the seed data. Events before this are considered past.
export const TODAY = new Date('2026-09-16T09:00:00')

export const events: CampusEvent[] = [
  {
    id: 'evt-01',
    name: 'Hack the Campus 2026',
    description:
      'A 24-hour overnight hackathon open to all branches. Teams of up to 4 build anything that makes campus life better. Food, mentors, and a closing demo night included.',
    date: '2026-10-04T18:00:00',
    venue: 'Innovation Lab, Block C',
    category: 'Tech',
    capacity: 120,
    seatsAvailable: 37,
    organizerId: 'org-1',
    cancelled: false,
  },
  {
    id: 'evt-02',
    name: 'Acoustic Nights: Open Mic',
    description:
      'Sign up to sing, play, or read poetry. No audition needed — just bring your nerves and your talent. Snacks provided by the Cultural Committee.',
    date: '2026-09-25T19:30:00',
    venue: 'Amphitheatre Lawn',
    category: 'Music',
    capacity: 80,
    seatsAvailable: 0,
    organizerId: 'org-2',
    cancelled: false,
  },
  {
    id: 'evt-03',
    name: 'Resume & LinkedIn Clinic',
    description:
      'Drop-in session with alumni volunteers who will review your resume and LinkedIn profile in 15-minute slots. Walk-ins welcome, but seats are limited.',
    date: '2026-09-22T14:00:00',
    venue: 'Placement Cell, Admin Block',
    category: 'Career',
    capacity: 40,
    seatsAvailable: 12,
    organizerId: 'org-3',
    cancelled: false,
  },
  {
    id: 'evt-04',
    name: 'Inter-Hostel Football Cup — Final',
    description:
      "The championship match of this year's Inter-Hostel Football Cup. Come cheer your hostel on.",
    date: '2026-09-05T16:00:00',
    venue: 'Main Sports Ground',
    category: 'Sports',
    capacity: 300,
    seatsAvailable: 45,
    organizerId: 'org-4',
    cancelled: false,
  },
  {
    id: 'evt-05',
    name: 'Intro to Figma Workshop',
    description:
      'A hands-on beginner workshop covering frames, components, and prototyping in Figma. Bring your own laptop.',
    date: '2026-10-10T15:00:00',
    venue: 'Design Studio, Block B',
    category: 'Workshop',
    capacity: 30,
    seatsAvailable: 6,
    organizerId: 'org-2',
    cancelled: false,
  },
  {
    id: 'evt-06',
    name: 'Diwali Mela',
    description:
      'Stalls, rangoli competitions, and a fireworks-free light show to celebrate Diwali on campus. Open to students, faculty, and families.',
    date: '2026-11-01T17:00:00',
    venue: 'Central Quad',
    category: 'Cultural',
    capacity: 500,
    seatsAvailable: 500,
    organizerId: 'org-2',
    cancelled: false,
  },
  {
    id: 'evt-07',
    name: 'Competitive Programming Bootcamp',
    description:
      "Three-hour bootcamp on graph algorithms and dynamic programming, run by the CP club's senior members ahead of the ICPC regionals.",
    date: '2026-09-10T10:00:00',
    venue: 'Computer Science Lab 2',
    category: 'Tech',
    capacity: 60,
    seatsAvailable: 0,
    organizerId: 'org-1',
    cancelled: false,
  },
  {
    id: 'evt-08',
    name: 'Basketball 3x3 Street League',
    description:
      'Casual weekly 3x3 basketball league. Register your team of 3–4, matches are round-robin followed by knockouts.',
    date: '2026-09-30T17:30:00',
    venue: 'Outdoor Courts',
    category: 'Sports',
    capacity: 64,
    seatsAvailable: 20,
    organizerId: 'org-4',
    cancelled: false,
  },
  {
    id: 'evt-09',
    name: 'Startup Pitch Day',
    description:
      'Student founders pitch to a panel of alumni investors for a shot at seed funding and mentorship from the E-Cell.',
    date: '2026-10-18T13:00:00',
    venue: 'Auditorium',
    category: 'Career',
    capacity: 200,
    seatsAvailable: 88,
    organizerId: 'org-3',
    cancelled: false,
  },
  {
    id: 'evt-10',
    name: 'Photography Walk: Old Campus',
    description:
      'A guided golden-hour photo walk through the older parts of campus, led by the Photography Club. All skill levels welcome.',
    date: '2026-09-01T17:00:00',
    venue: 'Meet at Main Gate',
    category: 'Workshop',
    capacity: 25,
    seatsAvailable: 3,
    organizerId: 'org-2',
    cancelled: false,
  },
  {
    id: 'evt-11',
    name: 'Classical Fusion Night',
    description:
      'The Music Society blends Carnatic and Hindustani classical forms with modern instruments in a one-night showcase.',
    date: '2026-10-25T19:00:00',
    venue: 'Amphitheatre Lawn',
    category: 'Music',
    capacity: 150,
    seatsAvailable: 150,
    organizerId: 'org-2',
    cancelled: false,
  },
  {
    id: 'evt-12',
    name: 'Data Structures Doubt-Clearing Marathon',
    description:
      'Pre-exam doubt-clearing session covering trees, heaps, and hashing, run by teaching assistants from the CS department.',
    date: '2026-08-28T11:00:00',
    venue: 'Lecture Hall 4',
    category: 'Tech',
    capacity: 90,
    seatsAvailable: 9,
    organizerId: 'org-1',
    cancelled: false,
  },
  {
    id: 'evt-13',
    name: "Freshers' Orientation Games",
    description:
      'Icebreaker games and campus scavenger hunt for the incoming batch, hosted by the Student Council.',
    date: '2026-09-08T09:30:00',
    venue: 'Central Quad',
    category: 'Cultural',
    capacity: 250,
    seatsAvailable: 0,
    organizerId: 'org-4',
    cancelled: false,
  },
  {
    id: 'evt-14',
    name: 'Cloud & DevOps Study Group Kickoff',
    description:
      'First meetup of a semester-long study group covering AWS fundamentals and CI/CD pipelines. No prior cloud experience needed.',
    date: '2026-09-29T18:00:00',
    venue: 'Computer Science Lab 1',
    category: 'Workshop',
    capacity: 45,
    seatsAvailable: 45,
    organizerId: 'org-1',
    cancelled: false,
  },
  {
    id: 'evt-15',
    name: 'Badminton Doubles Tournament',
    description:
      'Open doubles tournament, singles-elimination bracket. Racquets available to borrow at the sports office.',
    date: '2026-10-12T08:00:00',
    venue: 'Indoor Sports Complex',
    category: 'Sports',
    capacity: 32,
    seatsAvailable: 14,
    organizerId: 'org-4',
    cancelled: false,
  },
]

/** True when the event's date has already passed relative to TODAY. */
export function isPastEvent(event: CampusEvent): boolean {
  return new Date(event.date).getTime() < TODAY.getTime()
}

/** True when there are no seats left. */
export function isFullEvent(event: CampusEvent): boolean {
  return event.seatsAvailable <= 0
}

/** Look up a single event by id, or undefined if it doesn't exist. */
export function getEventById(id: string): CampusEvent | undefined {
  return events.find((event) => event.id === id)
}

export function searchEventsByName(
  eventList: CampusEvent[],
  query: string,
): CampusEvent[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return eventList
  }
  return eventList.filter((event) =>
    event.name.toLowerCase().includes(trimmed),
  )
}

export function filterEventsByCategory(
  eventList: CampusEvent[],
  category: EventCategory | 'All',
): CampusEvent[] {
  if (category === 'All') {
    return eventList
  }
  return eventList.filter((event) => event.category === category)
}

export const VALID_CATEGORIES: EventCategory[] = [
  'Tech',
  'Cultural',
  'Sports',
  'Workshop',
  'Career',
  'Music',
]

export interface CreateEventInput {
  name: string
  description: string
  date: string
  venue: string
  category: EventCategory
  capacity: number
}

export interface UpdateEventInput {
  name?: string
  description?: string
  date?: string
  venue?: string
  category?: EventCategory
  capacity?: number
}

export type EventResult =
  | { success: true; event: CampusEvent }
  | { success: false; error: string }

export type DeleteEventResult =
  | { success: true }
  | { success: false; error: string }

export function createEvent(
  user: AppUser | null | undefined,
  input: CreateEventInput,
): EventResult {
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Only organizers can create events.' }
  }
  if (!input.name || !input.name.trim()) {
    return { success: false, error: 'Event name is required.' }
  }
  if (!input.description || !input.description.trim()) {
    return { success: false, error: 'Event description is required.' }
  }
  if (!input.venue || !input.venue.trim()) {
    return { success: false, error: 'Event venue is required.' }
  }
  if (!input.category || !VALID_CATEGORIES.includes(input.category)) {
    return { success: false, error: 'Valid event category is required.' }
  }
  if (
    typeof input.capacity !== 'number' ||
    !Number.isInteger(input.capacity) ||
    input.capacity <= 0
  ) {
    return { success: false, error: 'Capacity must be a positive integer.' }
  }
  if (!input.date || !input.date.trim()) {
    return { success: false, error: 'Event date is required.' }
  }
  const eventTime = new Date(input.date).getTime()
  if (isNaN(eventTime)) {
    return { success: false, error: 'Event date is invalid.' }
  }
  if (eventTime <= TODAY.getTime()) {
    return { success: false, error: 'Event date must be in the future.' }
  }

  const newEvent: CampusEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    description: input.description.trim(),
    date: input.date,
    venue: input.venue.trim(),
    category: input.category,
    capacity: input.capacity,
    seatsAvailable: input.capacity,
    organizerId: user.id,
    cancelled: false,
  }

  events.push(newEvent)
  return { success: true, event: newEvent }
}

export function updateEvent(
  user: AppUser | null | undefined,
  eventId: string,
  input: UpdateEventInput,
): EventResult {
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Only organizers can edit events.' }
  }
  const event = getEventById(eventId)
  if (!event) {
    return { success: false, error: 'Event not found.' }
  }
  if (event.organizerId !== user.id) {
    return { success: false, error: 'You can only edit your own events.' }
  }

  if (input.name !== undefined && (!input.name || !input.name.trim())) {
    return { success: false, error: 'Event name cannot be empty.' }
  }
  if (
    input.description !== undefined &&
    (!input.description || !input.description.trim())
  ) {
    return { success: false, error: 'Event description cannot be empty.' }
  }
  if (input.venue !== undefined && (!input.venue || !input.venue.trim())) {
    return { success: false, error: 'Event venue cannot be empty.' }
  }
  if (
    input.category !== undefined &&
    !VALID_CATEGORIES.includes(input.category)
  ) {
    return { success: false, error: 'Valid event category is required.' }
  }
  if (input.date !== undefined) {
    if (!input.date.trim()) {
      return { success: false, error: 'Event date cannot be empty.' }
    }
    const eventTime = new Date(input.date).getTime()
    if (isNaN(eventTime)) {
      return { success: false, error: 'Event date is invalid.' }
    }
    if (eventTime <= TODAY.getTime()) {
      return { success: false, error: 'Event date must be in the future.' }
    }
  }

  if (input.capacity !== undefined) {
    if (
      typeof input.capacity !== 'number' ||
      !Number.isInteger(input.capacity) ||
      input.capacity <= 0
    ) {
      return { success: false, error: 'Capacity must be a positive integer.' }
    }

    const activeRegistrations = registrations.filter(
      (r) => r.eventId === eventId && r.status === 'confirmed',
    ).length

    if (input.capacity < activeRegistrations) {
      return {
        success: false,
        error: `Cannot reduce capacity below current active registrations (${activeRegistrations}).`,
      }
    }

    event.capacity = input.capacity
    event.seatsAvailable = input.capacity - activeRegistrations
  }

  if (input.name !== undefined) event.name = input.name.trim()
  if (input.description !== undefined)
    event.description = input.description.trim()
  if (input.venue !== undefined) event.venue = input.venue.trim()
  if (input.date !== undefined) event.date = input.date
  if (input.category !== undefined) event.category = input.category

  return { success: true, event }
}

export function cancelEvent(
  user: AppUser | null | undefined,
  eventId: string,
): EventResult {
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Only organizers can cancel events.' }
  }
  const event = getEventById(eventId)
  if (!event) {
    return { success: false, error: 'Event not found.' }
  }
  if (event.organizerId !== user.id) {
    return { success: false, error: 'You can only cancel your own events.' }
  }

  event.cancelled = true
  return { success: true, event }
}

export function deleteEvent(
  user: AppUser | null | undefined,
  eventId: string,
): DeleteEventResult {
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Only organizers can delete events.' }
  }
  const index = events.findIndex((e) => e.id === eventId)
  if (index === -1) {
    return { success: false, error: 'Event not found.' }
  }
  const event = events[index]
  if (event.organizerId !== user.id) {
    return { success: false, error: 'You can only delete your own events.' }
  }

  events.splice(index, 1)

  for (let i = registrations.length - 1; i >= 0; i--) {
    if (registrations[i].eventId === eventId) {
      registrations.splice(i, 1)
    }
  }

  return { success: true }
}


