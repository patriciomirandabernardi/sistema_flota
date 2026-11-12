export interface Usuario {
  id: number
  username: string
  rol: string
}

export interface AuthContextType {
  user: Usuario | null
  login: (token: string) => void
  logout: () => void
}
