import { useState, useRef, useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'

type AuthUser = {
  id?: number
  fullName?: string | null
  email?: string
  role?: string
  initials?: string
}

type PageProps = {
  user?: AuthUser | null
  auth?: {
    user?: AuthUser | null
  }
}

/* ─── Iconos SVG ─── */
function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function IconDocs() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

/**
 * Extrae las iniciales del usuario dinámicamente
 */
function getInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return 'U'

  const parts = nameOrEmail.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  if (parts.length === 1) {
    const single = parts[0]
    if (single.includes('@')) {
      const prefix = single.split('@')[0]
      return prefix.slice(0, 2).toUpperCase()
    }
    return single.slice(0, 2).toUpperCase()
  }

  return 'U'
}

export default function Navbar() {
  const props = usePage<PageProps>().props
  // Leer el usuario autenticado real desde los props compartidos
  const currentUser = props.user || props.auth?.user

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Datos 100% dinámicos del usuario en sesión
  const displayName = currentUser?.fullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario')
  const userEmail = currentUser?.email || ''
  const userRole = currentUser?.role || 'Docente'
  const initials = currentUser?.initials || getInitials(displayName)

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo y Marca */}
        <Link href="/dashboard" className="navbar-brand">
          <div className="navbar-logo">UBB</div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">Depto. Matemáticas</span>
            <span className="navbar-brand-subtitle">Universidad del Bío-Bío</span>
          </div>
        </Link>

        {/* Menú de Navegación Principal */}
        <ul className="navbar-nav">
          <li>
            <Link href="/dashboard" className="active">
              <IconHome /> Inicio
            </Link>
          </li>
          <li>
            <a href="#">
              <IconDocs /> Documentos
            </a>
          </li>
          <li>
            <a href="#">
              <IconBriefcase /> Prácticas
            </a>
          </li>
          <li>
            <a href="#">
              <IconUsers /> Profesores
            </a>
          </li>
        </ul>

        {/* Acciones del Usuario en la esquina */}
        <div className="navbar-actions" style={{ gap: '14px', alignItems: 'center' }}>
          {/* Campana de Notificación */}
          <div className="navbar-notification" title="Notificaciones">
            <IconBell />
            <div className="notification-badge" />
          </div>

          {/* ─── Botón de Perfil Dinámico en la Esquina Superior Derecha ─── */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: dropdownOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                border: dropdownOpen ? '1px solid var(--ubb-gold-400)' : '1px solid rgba(255, 255, 255, 0.2)',
                padding: '4px 14px 4px 6px',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: dropdownOpen ? '0 0 16px rgba(212, 175, 82, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.25)',
              }}
              title={displayName}
            >
              {/* Avatar Círculo Azul */}
              <div
                className="navbar-avatar"
                style={{
                  margin: 0,
                  width: '36px',
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: '2px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                {initials}
              </div>

              {/* Nombre y Rol Dinámico */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.25 }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#ffffff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    color: 'var(--ubb-gold-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <IconShield />
                  {userRole}
                </span>
              </div>

              {/* Flecha Dropdown */}
              <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', marginLeft: '2px' }}>
                <IconChevronDown />
              </div>
            </button>

            {/* ─── Menú Desplegable del Perfil ─── */}
            {dropdownOpen && (
              <div style={dropdownStyles.menu}>
                {/* Cabecera del Perfil con Datos Reales */}
                <div style={dropdownStyles.header}>
                  <div style={dropdownStyles.avatarLarge}>{initials}</div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={dropdownStyles.userName}>{displayName}</div>
                    {userEmail && <div style={dropdownStyles.userEmail}>{userEmail}</div>}
                    <div
                      style={{
                        marginTop: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(212, 175, 82, 0.18)',
                        border: '1px solid rgba(212, 175, 82, 0.4)',
                        color: 'var(--ubb-gold-300)',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.03em',
                      }}
                    >
                      <IconShield />
                      {userRole}
                    </div>
                  </div>
                </div>

                <div style={dropdownStyles.divider} />

                {/* Enlaces de Usuario */}
                <div style={dropdownStyles.itemGroup}>
                  <a href="#" style={dropdownStyles.item}>
                    <IconUsers />
                    <span>Mi Perfil Académico</span>
                  </a>
                  <a href="#" style={dropdownStyles.item}>
                    <IconDocs />
                    <span>Mis Documentos</span>
                  </a>
                  <a href="#" style={dropdownStyles.item}>
                    <IconSettings />
                    <span>Configuración</span>
                  </a>
                </div>

                <div style={dropdownStyles.divider} />

                {/* Botón Cerrar Sesión */}
                <div style={{ padding: '6px' }}>
                  <Link
                    href="/logout"
                    method="post"
                    as="button"
                    style={dropdownStyles.logoutButton}
                  >
                    <IconLogout />
                    <span>Cerrar sesión</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

/* ─── Estilos Dropdown ─── */
const dropdownStyles: Record<string, React.CSSProperties> = {
  menu: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: '280px',
    backgroundColor: '#0f2240',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '14px',
    boxShadow: '0 20px 45px -5px rgba(10, 22, 40, 0.8), 0 8px 20px -4px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  avatarLarge: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#2d6fd4',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '2px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  },
  userName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    color: '#a3c4f3',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '2px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemGroup: {
    padding: '6px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    color: '#dbe8fd',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    color: '#f87171',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
}
