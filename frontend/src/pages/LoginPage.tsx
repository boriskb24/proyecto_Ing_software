import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const resp = await login(email, password)
      const role = resp?.user?.role ?? null
      if (role && role.toLowerCase().includes('profesor')) {
        // navigate('/profesor/ofertas')
        navigate('/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message)
      } else if (err.response?.status === 401) {
        setErrorMessage('Credenciales inválidas. Por favor intenta de nuevo.')
      } else {
        setErrorMessage('Error al conectar con el servidor. Verifica tu conexión.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>UBB</div>
          <h1 style={styles.title}>Iniciar Sesión</h1>
          <p style={styles.subtitle}>
            Sistema de Centralización de Documentos
          </p>
        </div>

        {errorMessage && (
          <div style={styles.alertError}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ubiobio.cl"
              autoComplete="username"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{
                  ...styles.input,
                  paddingRight: '42px',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleVisibilityBtn}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>¿No tienes una cuenta? </span>
          <Link to="/register" style={styles.link}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1329',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#131e3a',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '20px',
    marginBottom: '14px',
    letterSpacing: '1px',
    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.4)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
  alertError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#f87171',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '18px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#0b1329',
    border: '1px solid #233554',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  toggleVisibilityBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
  },
  submitButton: {
    marginTop: '8px',
    padding: '13px',
    borderRadius: '8px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '14px',
    border: 'none',
    boxShadow: '0 4px 14px rgba(29, 78, 216, 0.4)',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontWeight: '500',
  },
}
