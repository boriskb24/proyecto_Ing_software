import { useForm, Link } from '@inertiajs/react'
import type { FormEvent } from 'react'

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    fullName: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    post('/register', {
      onFinish: () => reset('password', 'password_confirmation'),
    })
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>UBB</div>
          <h1 style={styles.title}>Crear Cuenta</h1>
          <p style={styles.subtitle}>
            Regístrate en el Sistema de Documentos Académicos
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Campo Nombre Completo */}
          <div style={styles.formGroup}>
            <label htmlFor="fullName" style={styles.label}>
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={data.fullName}
              onChange={(e) => setData('fullName', e.target.value)}
              placeholder="Ej. Sandra Muñoz"
              autoComplete="name"
              required
              style={{
                ...styles.input,
                ...(errors.fullName ? styles.inputError : {}),
              }}
            />
            {errors.fullName && (
              <span style={styles.errorMessage}>{errors.fullName}</span>
            )}
          </div>

          {/* Campo Email */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="usuario@ubiobio.cl"
              autoComplete="email"
              required
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
            />
            {errors.email && (
              <span style={styles.errorMessage}>{errors.email}</span>
            )}
          </div>

          {/* Campo Contraseña */}
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {}),
              }}
            />
            {errors.password && (
              <span style={styles.errorMessage}>{errors.password}</span>
            )}
          </div>

          {/* Campo Confirmar Contraseña */}
          <div style={styles.formGroup}>
            <label htmlFor="password_confirmation" style={styles.label}>
              Confirmar Contraseña
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              required
              style={{
                ...styles.input,
                ...(errors.password_confirmation ? styles.inputError : {}),
              }}
            />
            {errors.password_confirmation && (
              <span style={styles.errorMessage}>{errors.password_confirmation}</span>
            )}
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={processing}
            style={{
              ...styles.submitButton,
              opacity: processing ? 0.7 : 1,
              cursor: processing ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>¿Ya tienes una cuenta? </span>
          <Link href="/login" style={styles.link}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Estilos visuales ─── */
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
    maxWidth: '460px',
    backgroundColor: '#131e3a',
    borderRadius: '16px',
    padding: '36px 32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorMessage: {
    fontSize: '12px',
    color: '#f87171',
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
  },
  footer: {
    marginTop: '20px',
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
