'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import {
  events,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  CampusEvent,
  EventCategory,
  VALID_CATEGORIES,
} from '@/data/events'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'

export default function OrganizerPage() {
  const { currentUser } = useAuth()
  const [, setTick] = useState(0)

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Modal / Form state
  const [isCreating, setIsCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formVenue, setFormVenue] = useState('')
  const [formCategory, setFormCategory] = useState<EventCategory>('Tech')
  const [formCapacity, setFormCapacity] = useState<number>(50)
  const [formError, setFormError] = useState<string | null>(null)

  if (currentUser.role !== 'organizer') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for organizers"
          description="Switch to an organizer account from the top-right menu to manage events."
        />
      </section>
    )
  }

  const myEvents = events.filter((e) => e.organizerId === currentUser.id)

  const openCreateModal = () => {
    setFormName('')
    setFormDescription('')
    setFormDate('')
    setFormVenue('')
    setFormCategory('Tech')
    setFormCapacity(50)
    setFormError(null)
    setIsCreating(true)
  }

  const openEditModal = (event: CampusEvent) => {
    setFormName(event.name)
    setFormDescription(event.description)
    setFormDate(event.date)
    setFormVenue(event.venue)
    setFormCategory(event.category)
    setFormCapacity(event.capacity)
    setFormError(null)
    setEditingEvent(event)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const result = createEvent(currentUser, {
      name: formName,
      description: formDescription,
      date: formDate,
      venue: formVenue,
      category: formCategory,
      capacity: Number(formCapacity),
    })

    if (!result.success) {
      setFormError(result.error)
      return
    }

    setIsCreating(false)
    setFeedback({
      type: 'success',
      message: `Event "${result.event.name}" created successfully!`,
    })
    setTick((t) => t + 1)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    setFormError(null)

    const result = updateEvent(currentUser, editingEvent.id, {
      name: formName,
      description: formDescription,
      date: formDate,
      venue: formVenue,
      category: formCategory,
      capacity: Number(formCapacity),
    })

    if (!result.success) {
      setFormError(result.error)
      return
    }

    setEditingEvent(null)
    setFeedback({
      type: 'success',
      message: `Event "${result.event.name}" updated successfully!`,
    })
    setTick((t) => t + 1)
  }

  const handleCancelEvent = (eventId: string) => {
    const result = cancelEvent(currentUser, eventId)
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error })
    } else {
      setFeedback({
        type: 'success',
        message: `Event "${result.event.name}" has been cancelled.`,
      })
    }
    setTick((t) => t + 1)
  }

  const handleDeleteEvent = (eventId: string) => {
    const result = deleteEvent(currentUser, eventId)
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error })
    } else {
      setFeedback({
        type: 'success',
        message: 'Event has been deleted successfully.',
      })
    }
    setTick((t) => t + 1)
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span className="eyebrow-tag">organizer console</span>
          <h1 style={{ fontSize: 30, marginTop: 10 }}>Manage your events</h1>
          <p style={{ marginTop: 8 }}>
            Create, edit, cancel, and manage your campus events.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + New event
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          style={{
            marginBottom: 20,
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            fontSize: 13.5,
            fontWeight: 500,
            background:
              feedback.type === 'success' ? 'var(--green-bg)' : 'var(--rust-bg)',
            color: feedback.type === 'success' ? 'var(--green)' : 'var(--rust)',
            border: `1.5px solid ${
              feedback.type === 'success' ? 'var(--green)' : 'var(--rust)'
            }`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {myEvents.length === 0 ? (
        <EmptyState
          title="No events posted yet"
          description="Once you create an event, it'll show up here."
          action={
            <button className="btn btn-primary" onClick={openCreateModal}>
              Create your first event
            </button>
          }
        />
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myEvents.map((event) => {
            const status = event.cancelled
              ? 'cancelled'
              : event.seatsAvailable <= 0
                ? 'full'
                : 'open'
            return (
              <li
                key={event.id}
                className="card-surface"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <Link
                    href={`/events/${event.id}`}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 17,
                      textDecoration: 'none',
                    }}
                  >
                    {event.name}
                  </Link>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: 'var(--ink-soft)',
                      marginTop: 4,
                    }}
                  >
                    {new Date(event.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {event.venue} · {event.seatsAvailable}/{event.capacity}{' '}
                    seats
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={status} />
                  <button
                    className="btn btn-secondary"
                    onClick={() => openEditModal(event)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={event.cancelled}
                    onClick={() => handleCancelEvent(event.id)}
                    title={
                      event.cancelled
                        ? 'Event is already cancelled'
                        : 'Cancel this event'
                    }
                  >
                    {event.cancelled ? 'Cancelled' : 'Cancel'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ color: 'var(--rust)', borderColor: 'var(--rust)' }}
                    onClick={() => handleDeleteEvent(event.id)}
                    title="Delete this event"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Create / Edit Modal */}
      {(isCreating || editingEvent) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(33, 31, 28, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            className="card-surface"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: 28,
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 id="modal-title" style={{ fontSize: 22 }}>
                {isCreating ? 'Create new event' : 'Edit event'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setEditingEvent(null)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: 'var(--ink-soft)',
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  fontSize: 13.5,
                  background: 'var(--rust-bg)',
                  color: 'var(--rust)',
                  border: '1.5px solid var(--rust)',
                }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={isCreating ? handleCreateSubmit : handleEditSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 4,
                    color: 'var(--ink)',
                  }}
                >
                  Event name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Hack the Campus 2026"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    background: 'var(--paper-raised)',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 4,
                    color: 'var(--ink)',
                  }}
                >
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed event description…"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    fontFamily: 'inherit',
                    background: 'var(--paper-raised)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 4,
                      color: 'var(--ink)',
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as EventCategory)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      fontSize: 14.5,
                      background: 'var(--paper-raised)',
                    }}
                  >
                    {VALID_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 4,
                      color: 'var(--ink)',
                    }}
                  >
                    Capacity (seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      fontSize: 14.5,
                      background: 'var(--paper-raised)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 4,
                      color: 'var(--ink)',
                    }}
                  >
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      fontSize: 14,
                      background: 'var(--paper-raised)',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 4,
                      color: 'var(--ink)',
                    }}
                  >
                    Venue
                  </label>
                  <input
                    type="text"
                    required
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. Block C Lab 2"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      fontSize: 14.5,
                      background: 'var(--paper-raised)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingEvent(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isCreating ? 'Create event' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

