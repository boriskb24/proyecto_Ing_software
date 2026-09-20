import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  FileText, 
  Briefcase, 
  Users, 
  Bell, 
  LogOut, 
  Shield, 
  ChevronDown, 
  Settings,
  GraduationCap,
  User as UserIcon 
} from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Usuario')
  const userEmail = user?.email || ''
  const userRole = user?.role || 'Estudiante'
  const computedInitials = (() => {
    if (user?.initials && user.initials !== 'PB') return user.initials
    if (user?.fullName) {
      const clean = user.fullName.replace(/^(prof\.?|dr\.?|ing\.?)\s+/i, '').trim()
      const parts = clean.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    }
    return user?.initials || 'U'
  })()
  const initials = computedInitials

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.inner}>
        {/* Logo and Brand */}
        <Link to="/dashboard" style={styles.brand}>
          <div style={styles.logo}>UBB</div>
          <div style={styles.brandText}>
            <span style={styles.brandTitle}>Depto. Matemáticas</span>
            <span style={styles.brandSubtitle}>Universidad del Bío-Bío</span>
          </div>
        </Link>

        {/* Navigation links */}
        <ul style={styles.navList}>
          <li>
            <Link to="/dashboard" style={{ ...styles.navLink, ...styles.navLinkActive }}>
              <Home size={16} /> Inicio
            </Link>
          </li>
          <li>
            <Link to="/planificaciones" style={styles.navLink}>
              <FileText size={16} /> Planificaciones
            </Link>
          </li>
          <li>
            <Link to="/evaluaciones" style={styles.navLink}>
              <GraduationCap size={16} /> Evaluaciones
            </Link>
          </li>
          <li>
            <span 
              style={{ ...styles.navLink, color: '#94a3b8', cursor: 'default', display: 'flex', alignItems: 'center', gap: '7px', padding: '4px 10px' }}
              title="Opción no implementada"
            >
              <FileText size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>Documentos</span>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '400', letterSpacing: '0.2px' }}>
                  No implementada
                </span>
              </div>
            </span>
          </li>
          <li>
            <span 
              style={{ ...styles.navLink, color: '#94a3b8', cursor: 'default', display: 'flex', alignItems: 'center', gap: '7px', padding: '4px 10px' }}
              title="Opción no implementada"
            >
              <Briefcase size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>Prácticas</span>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '400', letterSpacing: '0.2px' }}>
                  No implementada
                </span>
              </div>
            </span>
          </li>
          <li>
            <span 
              style={{ ...styles.navLink, color: '#94a3b8', cursor: 'default', display: 'flex', alignItems: 'center', gap: '7px', padding: '4px 10px' }}
              title="Opción no implementada"
            >
              <Users size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>Profesores</span>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '400', letterSpacing: '0.2px' }}>
                  No implementada
                </span>
              </div>
            </span>
          </li>
        </ul>

        {/* Actions & Profile Dropdown */}
        <div style={styles.actions}>
          <div style={styles.bellBtn} title="Notificaciones">
            <Bell size={18} />
            <div style={styles.badge} />
          </div>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                ...styles.profileBtn,
                background: dropdownOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                border: dropdownOpen ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={styles.avatar}>{initials}</div>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{displayName}</span>
                <span style={styles.userRole}>
                  <Shield size={11} /> {userRole}
                </span>
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </button>

            {dropdownOpen && (
              <div style={styles.menu}>
                <div style={styles.menuHeader}>
                  <div style={styles.avatarLarge}>{initials}</div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={styles.menuUserName}>{displayName}</div>
                    {userEmail && <div style={styles.menuUserEmail}>{userEmail}</div>}
                    <div style={styles.menuRoleBadge}>
                      <Shield size={11} /> {userRole}
                    </div>
                  </div>
                </div>

                <div style={styles.divider} />

                <div style={{ padding: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigate('/perfil')
                    }}
                    style={{ ...styles.menuItem, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <UserIcon size={16} /> Mi Perfil Académico
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigate('/planificaciones')
                    }}
                    style={{ ...styles.menuItem, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <FileText size={16} /> Mis Documentos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigate('/evaluaciones')
                    }}
                    style={{ ...styles.menuItem, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <GraduationCap size={16} /> Evaluaciones de Práctica
                  </button>
                </div>

                <div style={styles.divider} />

                <div style={{ padding: '6px' }}>
                  <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    backgroundColor: '#0f1d38',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(29, 78, 216, 0.4)',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  navList: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    listStyle: 'none',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '500',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    backgroundColor: 'rgba(29, 78, 216, 0.2)',
    color: '#60a5fa',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  bellBtn: {
    position: 'relative',
    padding: '8px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#cbd5e1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 14px 4px 6px',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
  },
  userRole: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#d4af37',
    textTransform: 'uppercase',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: '270px',
    backgroundColor: '#0f2240',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '14px',
    boxShadow: '0 20px 45px -5px rgba(10, 22, 40, 0.8)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  avatarLarge: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuUserName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '14px',
  },
  menuUserEmail: {
    color: '#a3c4f3',
    fontSize: '12px',
  },
  menuRoleBadge: {
    marginTop: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(212, 175, 82, 0.18)',
    border: '1px solid rgba(212, 175, 82, 0.4)',
    color: '#e0c068',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    color: '#dbe8fd',
    fontSize: '13px',
    borderRadius: '8px',
    textDecoration: 'none',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    color: '#f87171',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}
