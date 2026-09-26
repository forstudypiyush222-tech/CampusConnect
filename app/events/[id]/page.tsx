'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getEventById, isPastEvent, isFullEvent } from '@/data/events'
import {
  hasActiveRegistration,
  registerStudentForEvent,
} from '@/data/registrations'
import { useAuth } from '@/components/AuthProvider'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { currentUser, isHydrated } = useAuth()
  const router = useRouter()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [, setTick] = useState(0)

  if (!isHydrated) {
    return (
      <section className="shell" style={{ padding: '56px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-soft)' }}>Loading event details…</p>
      </section>
    )
  }

  const event = getEventById(params.id)

  if (!event) {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This event isn't on the board"
          description="It may have been removed, or the link might be wrong. Head back to the full listing to find what you're looking for."
          action={
            <Link href="/events" className="btn btn-primary">
              Back to events
            </Link>
          }
        />
      </section>
    )
  }

  const past = isPastEvent(event)
  const full = isFullEvent(event)
  const status = event.cancelled
    ? 'cancelled'
    : past
      ? 'past'
      : full
        ? 'full'
        : 'open'

  const isRegistered = Boolean(
    currentUser &&
      currentUser.role === 'student' &&
      hasActiveRegistration(currentUser.id, event.id),
  )

  const isOrganizer = currentUser?.role === 'organizer'

  const canRegister =
    !past && !full && !event.cancelled && !isRegistered && !isOrganizer

  const handleRegister = () => {
    // Redirect logged-out users to the login page with return URL
    if (!currentUser) {
      router.push(`/login?returnTo=/events/${event.id}`)
      return
    }
    if (submitting) return
    setSubmitting(true)
    const result = registerStudentForEvent(currentUser, event.id)
    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Successfully registered for this event!',
      })
    } else {
      setFeedback({
        type: 'error',
        message: result.error,
      })
    }
    setSubmitting(false)
    setTick((t) => t + 1)
  }

  const isLoggedOut = !currentUser

  const buttonLabel = isRegistered
    ? 'Registered'
    : isOrganizer
      ? 'Student registration only'
      : isLoggedOut
        ? canRegister
          ? 'Log in to register'
          : status === 'full'
            ? 'Event full'
            : 'Registration closed'
        : canRegister
          ? submitting
            ? 'Registering…'
            : 'Register'
          : status === 'full'
            ? 'Event full'
            : 'Registration closed'

  const buttonTitle = isRegistered
    ? 'You are already registered for this event'
    : isOrganizer
      ? 'Only students can register for events'
      : isLoggedOut
        ? 'Please log in as a student to register'
        : undefined

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <Link
        href="/events"
        style={{ fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
      >
        ← All events
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 32,
          marginTop: 20,
        }}
        className="hero-grid"
      >
        <div>
          <span className="eyebrow-tag">{event.category}</span>
          <h1 style={{ fontSize: 32, marginTop: 12 }}>{event.name}</h1>
          <p style={{ marginTop: 16, fontSize: 15.5 }}>{event.description}</p>
        </div>

        <aside
          className="card-surface"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            height: 'fit-content',
          }}
        >
          <StatusBadge status={status} />
          <Detail label="Date" value={formatDate(event.date)} />
          <Detail label="Time" value={formatTime(event.date)} />
          <Detail label="Venue" value={event.venue} />
          <Detail
            label="Seats"
            value={`${event.seatsAvailable} of ${event.capacity} available`}
          />

          {feedback && (
            <div
              role="status"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontSize: 13.5,
                fontWeight: 500,
                background:
                  feedback.type === 'success'
                    ? 'var(--green-bg)'
                    : 'var(--rust-bg)',
                color:
                  feedback.type === 'success'
                    ? 'var(--green)'
                    : 'var(--rust)',
                border: `1.5px solid ${
                  feedback.type === 'success'
                    ? 'var(--green)'
                    : 'var(--rust)'
                }`,
              }}
            >
              {feedback.message}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleRegister}
            disabled={!canRegister || submitting}
            style={{ marginTop: 4 }}
            title={buttonTitle}
          >
            {buttonLabel}
          </button>
        </aside>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 500 }}>{value}</div>
    </div>
  )
}
