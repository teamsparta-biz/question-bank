import { useState, useCallback } from 'react'

const PASSWORD_HASH = import.meta.env.VITE_PASSWORD_HASH as string

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('qb_auth') === 'true'
  )

  const login = useCallback(async (password: string): Promise<boolean> => {
    const hash = await sha256(password)
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem('qb_auth', 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('qb_auth')
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}
