'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  users,
  AppUser,
  createStudentAccount,
  authenticateByEmail,
  SignupResult,
  LoginResult,
  loadPersistedSession,
  persistSession,
  syncUsersFromStorage,
} from '@/data/auth'
import { syncEventsFromStorage } from '@/data/events'
import { syncRegistrationsFromStorage } from '@/data/registrations'

export interface AuthContextValue {
  currentUser: AppUser | null
  setCurrentUserId: (id: string | null) => void
  allUsers: AppUser[]
  login: (id: string) => void
  loginWithEmail: (email: string, password: string) => LoginResult
  signup: (name: string, email: string, password: string, confirmPassword: string) => SignupResult
  logout: () => void
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialUserId = null,
}: {
  children: ReactNode
  initialUserId?: string | null
}) {
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(initialUserId)
  const [usersState, setUsersState] = useState<AppUser[]>(users)
  const [isHydrated, setIsHydrated] = useState(false)

  // Client-side hydration of persisted session and users
  useEffect(() => {
    // 1. Sync all persistent data stores from localStorage
    syncUsersFromStorage()
    syncEventsFromStorage()
    syncRegistrationsFromStorage()
    setUsersState([...users])

    // 2. Restore active session if present
    const storedUserId = loadPersistedSession()
    if (storedUserId) {
      const foundUser = users.find((u) => u.id === storedUserId)
      if (foundUser) {
        setCurrentUserIdState(foundUser.id)
      } else {
        // Persisted user ID no longer exists in users collection; clear invalid session
        persistSession(null)
        setCurrentUserIdState(null)
      }
    } else if (initialUserId) {
      // Preserve initialUserId passed for testing if no storage session
      setCurrentUserIdState(initialUserId)
    }

    setIsHydrated(true)
  }, [initialUserId])

  const currentUser = currentUserId
    ? users.find((u) => u.id === currentUserId) ?? null
    : null

  const setCurrentUserId = (id: string | null) => {
    setCurrentUserIdState(id)
    persistSession(id)
  }

  const login = (id: string) => {
    setCurrentUserIdState(id)
    persistSession(id)
  }

  const logout = () => {
    setCurrentUserIdState(null)
    persistSession(null)
  }

  const loginWithEmail = (email: string, password: string): LoginResult => {
    syncUsersFromStorage()
    setUsersState([...users])
    const result = authenticateByEmail(email, password)
    if (result.success) {
      setCurrentUserIdState(result.user.id)
      persistSession(result.user.id)
    }
    return result
  }

  const signup = (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): SignupResult => {
    syncUsersFromStorage()
    const result = createStudentAccount(name, email, password, confirmPassword)
    if (result.success) {
      setUsersState([...users])
      setCurrentUserIdState(result.user.id)
      persistSession(result.user.id)
    }
    return result
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUserId,
        allUsers: usersState,
        login,
        loginWithEmail,
        signup,
        logout,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
