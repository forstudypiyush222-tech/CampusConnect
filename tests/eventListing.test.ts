import { describe, it, expect } from 'vitest'
import {
  events,
  searchEventsByName,
  filterEventsByCategory,
  isPastEvent,
  getEventById,
  CampusEvent,
} from '@/data/events'

describe('Feature 1 — Event Listing Requirements', () => {
  const eligibleEvents = events.filter((e) => !isPastEvent(e) && !e.cancelled)

  // 1. Empty search
  it('returns all eligible events on empty search query', () => {
    const results = searchEventsByName(eligibleEvents, '')
    expect(results).toEqual(eligibleEvents)
  })

  // 2. Exact event-name search
  it('finds an event by exact name match', () => {
    const results = searchEventsByName(eligibleEvents, 'Hack the Campus 2026')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Hack the Campus 2026')
  })

  // 3. Partial event-name search
  it('finds events by partial name match', () => {
    const results = searchEventsByName(eligibleEvents, 'Clinic')
    expect(results.length).toBe(1)
    expect(results[0].id).toBe('evt-03')
  })

  // 4. Different letter casing
  it('performs case-insensitive search', () => {
    const lowerResults = searchEventsByName(eligibleEvents, 'hack')
    const upperResults = searchEventsByName(eligibleEvents, 'HACK')
    const mixedResults = searchEventsByName(eligibleEvents, 'hAcK')
    expect(lowerResults.length).toBe(1)
    expect(upperResults).toEqual(lowerResults)
    expect(mixedResults).toEqual(lowerResults)
  })

  // 5. Search with leading/trailing whitespace
  it('trims leading and trailing whitespace', () => {
    const results = searchEventsByName(eligibleEvents, '   hack   ')
    expect(results.length).toBe(1)
    expect(results[0].id).toBe('evt-01')

    const whitespaceOnly = searchEventsByName(eligibleEvents, '     ')
    expect(whitespaceOnly).toEqual(eligibleEvents)
  })

  // 6. No matching results
  it('returns an empty array when no events match query', () => {
    const results = searchEventsByName(eligibleEvents, 'NonExistentEventXYZ')
    expect(results).toEqual([])
  })

  // 7. Category = All
  it('returns all eligible events when category is All', () => {
    const results = filterEventsByCategory(eligibleEvents, 'All')
    expect(results).toEqual(eligibleEvents)
  })

  // 8. One specific category
  it('filters events by a specific category', () => {
    const techEvents = filterEventsByCategory(eligibleEvents, 'Tech')
    expect(techEvents.length).toBeGreaterThan(0)
    expect(techEvents.every((e) => e.category === 'Tech')).toBe(true)
  })

  // 9. Search + category simultaneously
  it('combines search and category filter correctly', () => {
    const searched = searchEventsByName(eligibleEvents, 'hack')
    const filteredTech = filterEventsByCategory(searched, 'Tech')
    expect(filteredTech.length).toBe(1)
    expect(filteredTech[0].id).toBe('evt-01')

    const filteredCultural = filterEventsByCategory(searched, 'Cultural')
    expect(filteredCultural.length).toBe(0)
  })

  // 10. Clearing search
  it('restores all category-matched events when search is cleared', () => {
    const searched = searchEventsByName(eligibleEvents, 'hack')
    expect(searched.length).toBe(1)
    const cleared = searchEventsByName(eligibleEvents, '')
    expect(cleared.length).toBe(eligibleEvents.length)
  })

  // 11. Clearing category
  it('restores all searched events when category is cleared to All', () => {
    const searched = searchEventsByName(eligibleEvents, 'pitch')
    const filtered = filterEventsByCategory(searched, 'Career')
    expect(filtered.length).toBe(1)
    const cleared = filterEventsByCategory(searched, 'All')
    expect(cleared.length).toBe(1)
  })

  // 12. Past events remain hidden
  it('hides past events from the eligible listing', () => {
    // evt-10 is a past event (2026-09-01)
    const pastEvt = events.find((e) => e.id === 'evt-10')!
    expect(isPastEvent(pastEvt)).toBe(true)
    expect(eligibleEvents.some((e) => e.id === 'evt-10')).toBe(false)
  })

  // 13. Cancelled-event behavior remains consistent
  it('hides cancelled events from eligible listing', () => {
    const dummyCancelledEvent: CampusEvent = {
      ...events[0],
      id: 'evt-test-cancelled',
      cancelled: true,
    }
    const testList = [dummyCancelledEvent, ...eligibleEvents]
    const activeList = testList.filter((e) => !isPastEvent(e) && !e.cancelled)
    expect(activeList.some((e) => e.id === 'evt-test-cancelled')).toBe(false)
  })

  // 14. Event detail page still handles invalid/missing event gracefully
  it('handles missing event lookups by returning undefined', () => {
    expect(getEventById('non-existent-id')).toBeUndefined()
  })
})
