import React, { createContext, useContext, useState, useEffect } from 'react'
import API, { UserDto, AuthResponse } from '../services/api'

interface AuthContextType {
  user: UserDto | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (fullName: string, email: string, password: string, passwordConfirmation: string) => Promise<UserDto>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch (e) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await API.post<AuthResponse>('/auth/login', { email, password })
    const { token, user } = response.data
    
    setToken(token)
    setUser(user)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    return response.data
  }

  const register = async (
    fullName: string, 
    email: string, 
    password: string, 
    passwordConfirmation: string
  ): Promise<UserDto> => {
    const response = await API.post<UserDto>('/auth/register', {
      fullName,
      email,
      password,
      passwordConfirmation
    })
    return response.data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
