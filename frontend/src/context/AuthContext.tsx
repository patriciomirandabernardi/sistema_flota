import { createContext, useContext, useState, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { AuthContextType, Usuario } from '../types/auth'

interface TokenPayload {
  sub: string
  rol: string
  id: number
  exp: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function decodeUsuario(token: string): Usuario | null {
  try {
    const payload = jwtDecode<TokenPayload>(token)
    return { id: payload.id, username: payload.sub, rol: payload.rol }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    const token = localStorage.getItem('token')
    return token ? decodeUsuario(token) : null
  })

  const login = (token: string) => {
    localStorage.setItem('token', token)
    setUser(decodeUsuario(token))
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
