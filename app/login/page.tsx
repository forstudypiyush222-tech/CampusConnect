'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell" style={{ padding: '56px 0', textAlign: 'center' }}>Loading…</div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/events'
  const { currentUser, isHydrated, loginWithEmail, signup, logout } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup fields
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')

  // Validate return path — only allow safe internal paths
  const getSafeReturnTo = (): string => {
    if (!returnTo) return '/events'
    if (!returnTo.startsWith('/')) return '/events'
    if (returnTo.startsWith('//')) return '/events'
    return returnTo
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const result = loginWithEmail(loginEmail, loginPassword)
    if (result.success) {
      router.push(getSafeReturnTo())
    } else {
      setError(result.error)
    }
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const result = signup(signupName, signupEmail, signupPassword, signupConfirm)
    if (result.success) {
      router.push(getSafeReturnTo())
    } else {
      setError(result.error)
    }
  }

  if (!isHydrated) {
    return (
      <section className="shell" style={{ padding: '56px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-soft)' }}>Loading session…</p>
      </section>
    )
  }

  // If already logged in, show a quick status with option to log out
  if (currentUser) {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <div
          className="card-surface"
          style={{
            maxWidth: 420,
            margin: '0 auto',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <span className="eyebrow-tag" style={{ marginBottom: 12 }}>
            {currentUser.role}
          </span>
          <h1 style={{ fontSize: 26, marginTop: 12 }}>
            Logged in as {currentUser.name}
          </h1>
          <p style={{ margin: '12px auto 0', fontSize: 14.5 }}>
            You are currently signed in. You can continue browsing or log out to
            switch accounts.
          </p>
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            <Link href={getSafeReturnTo()} className="btn btn-primary">
              Continue
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                logout()
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </section>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid var(--line)',
    borderRadius: 'var(--radius)',
    fontSize: 14.5,
    fontFamily: 'inherit',
    background: 'var(--paper-raised)',
    color: 'var(--ink)',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 5,
    color: 'var(--ink)',
  }

  return (
    <section className="shell" style={{ padding: '48px 0 64px' }}>
      <div
        className="card-surface"
        style={{
          maxWidth: 440,
          margin: '0 auto',
          padding: '36px 32px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--amber)',
              margin: '0 auto 10px',
            }}
          />
          <h1 style={{ fontSize: 24 }}>
            {mode === 'login' ? 'Login to continue' : 'Create student account'}
          </h1>
          <p style={{ fontSize: 14, margin: '8px auto 0' }}>
            {mode === 'login'
              ? 'Sign in with your Campus Connect credentials.'
              : 'New accounts are always created with the student role.'}
          </p>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: 13.5,
              fontWeight: 500,
              background: 'var(--rust-bg)',
              color: 'var(--rust)',
              border: '1.5px solid var(--rust)',
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: 13.5,
              fontWeight: 500,
              background: 'var(--green-bg)',
              color: 'var(--green)',
              border: '1.5px solid var(--green)',
            }}
          >
            {success}
          </div>
        )}

        {/* ─── LOGIN FORM ─── */}
        {mode === 'login' && (
          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label htmlFor="login-email" style={labelStyle}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@campus.edu"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="login-password" style={labelStyle}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}
            >
              Login
            </button>

            <div
              style={{
                textAlign: 'center',
                fontSize: 13.5,
                color: 'var(--ink-soft)',
                marginTop: 4,
              }}
            >
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setSuccess(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--amber-ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 13.5,
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                Create account
              </button>
            </div>
          </form>
        )}

        {/* ─── SIGNUP FORM ─── */}
        {mode === 'signup' && (
          <form
            onSubmit={handleSignup}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label htmlFor="signup-name" style={labelStyle}>
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Piyush Kumar"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="signup-email" style={labelStyle}>
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@campus.edu"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="signup-password" style={labelStyle}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="signup-confirm" style={labelStyle}>
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="Re-enter your password"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}
            >
              Create account
            </button>

            <div
              style={{
                textAlign: 'center',
                fontSize: 13.5,
                color: 'var(--ink-soft)',
                marginTop: 4,
              }}
            >
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccess(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--amber-ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 13.5,
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                Login
              </button>
            </div>

            <p
              style={{
                fontSize: 12,
                color: 'var(--ink-soft)',
                textAlign: 'center',
                marginTop: 0,
                opacity: 0.75,
              }}
            >
              Newly created accounts persist in your browser storage for this session/prototype.
              Do not use real passwords.
            </p>
          </form>
        )}

        {/* Seeded account hint */}
        <div
          style={{
            marginTop: 24,
            padding: '14px 16px',
            borderRadius: 'var(--radius)',
            background: 'var(--slate-bg)',
            fontSize: 12.5,
            color: 'var(--ink-soft)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
            Demo accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span>
              <strong>Student:</strong> aditi@campus.edu / student123
            </span>
            <span>
              <strong>Organizer:</strong> rohan@campus.edu / organizer123
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
