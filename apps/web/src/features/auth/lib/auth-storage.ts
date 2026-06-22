import { AUTH_STORAGE_KEYS } from '@/lib/company-context'

function clearAuthStorage(): void {
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key)
  }
}

function hasInvalidCompanyId(companyId: unknown): boolean {
  return Boolean(
    companyId &&
      (typeof companyId !== 'string' || !companyId.includes('-') || companyId.length < 30),
  )
}

function hasInvalidToken(token: unknown): boolean {
  if (!token) return false
  if (typeof token !== 'string') return true
  return token.split('.').length !== 3
}

export function sanitizePersistedAuthState(): void {
  if (typeof localStorage === 'undefined') return

  try {
    const storedKey = AUTH_STORAGE_KEYS.find((key) => Boolean(localStorage.getItem(key)))
    if (!storedKey) return

    const stored = localStorage.getItem(storedKey)
    if (!stored) {
      clearAuthStorage()
      return
    }

    const parsed = JSON.parse(stored)
    const state = parsed?.state ?? parsed
    const companyId = state?.user?.companyId
    const token = state?.token

    if (hasInvalidCompanyId(companyId) || hasInvalidToken(token)) {
      clearAuthStorage()
      return
    }

    if (state?.isAuthenticated && !token) {
      clearAuthStorage()
    }
  } catch {
    clearAuthStorage()
  }
}
