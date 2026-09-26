'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import {
  getRegistrationsForStudent,
  cancelRegistration,
  Registration,
} from '@/data/registrations'
import { getEventById, isPastEvent } from '@/data/events'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

export default function RegistrationsPage() {
  const { currentUser } = useAuth()
  const [, setTick] = useState(0)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  if (currentUser.role !== 'student') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for students"
          description="Switch to a student account from the top-right menu to see registered events."
        />
      </section>
    )
  }

  const myRegistrations = getRegistrationsForStudent(currentUser.id)

  const handleCancel = (registrationId: string) => {
    const result = cancelRegistration(currentUser, registrationId)
    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Registration cancelled successfully. Seat has been restored.',
      })
    } else {
      setFeedback({
        type: 'error',
        message: result.error,
      })
    }
    setTick((t) => t + 1)
  }

  const upcomingRegistrations = myRegistrations.filter((reg) => {
    const event = getEventById(reg.eventId)
    return event && !isPastEvent(event)
  })

  const pastRegistrations = myRegistrations.filter((reg) => {
    const event = getEventById(reg.eventId)
    return event && isPastEvent(event)
  })

  const renderRegistrationItem = (reg: Registration) => {
    const event = getEventById(reg.eventId)
    if (!event) return null

    const isPast = isPastEvent(event)
    const isCancelled = reg.status === 'cancelled' || event.cancelled

    const statusBadgeType = isCancelled
      ? 'cancelled'
      : isPast
        ? 'past'
        : 'open'

    const canCancel = !isCancelled && !isPast

    const cancelTitle = isCancelled
      ? 'This registration is already cancelled'
      : isPast
        ? 'Cannot cancel a past event registration'
        : 'Cancel this registration'

    return (
      <li
        key={reg.id}
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
            · {event.venue}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={statusBadgeType} />
          <button
            className="btn btn-secondary"
            onClick={() => handleCancel(reg.id)}
            disabled={!canCancel}
            title={cancelTitle}
          >
            {reg.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
          </button>
        </div>
      </li>
    )
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">signed up as {currentUser.name}</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>My registrations</h1>
        <p style={{ marginTop: 8 }}>
          Everything you&apos;ve registered for this semester.
        </p>
      </div>

      {myRegistrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Once you register for an event, it'll show up here."
          action={
            <Link href="/events" className="btn btn-primary">
              Browse events
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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
                  feedback.type === 'success' ? 'var(--green)' : 'var(--rust)',
                border: `1.5px solid ${
                  feedback.type === 'success' ? 'var(--green)' : 'var(--rust)'
                }`,
              }}
            >
              {feedback.message}
            </div>
          )}

          <section>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>Upcoming events</h2>
            {upcomingRegistrations.length === 0 ? (
              <p style={{ color: 'var(--ink-soft)', fontSize: 14.5 }}>
                No upcoming event registrations.
              </p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingRegistrations.map((reg) => renderRegistrationItem(reg))}
              </ul>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>Past events</h2>
            {pastRegistrations.length === 0 ? (
              <p style={{ color: 'var(--ink-soft)', fontSize: 14.5 }}>
                No past event registrations.
              </p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pastRegistrations.map((reg) => renderRegistrationItem(reg))}
              </ul>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
