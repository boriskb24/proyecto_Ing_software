import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getOfertasForProfesor, OfertaDto } from '../services/api'

export const ProfesorOfertasPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ofertas, setOfertas] = useState<OfertaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) throw new Error('Usuario no autenticado')
        const data = await getOfertasForProfesor(user.email)
        setOfertas(data)
        if (data.length === 1) {
          navigate(`/profesor/ofertas/${data[0].id}`)
        }
      } catch (e: any) {
        setError(e.message || 'Error al obtener ofertas')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        <h2>Mis Ofertas</h2>
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ marginTop: 20 }}>
            {ofertas.length === 0 && <p>No hay ofertas asociadas a este profesor.</p>}
            {ofertas.map(o => (
              <div
                key={o.id}
                onClick={() => navigate(`/profesor/ofertas/${o.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/profesor/ofertas/${o.id}`) }}
                role="button"
                tabIndex={0}
                style={{
                  background: '#fff',
                  color: '#0b1329',
                  padding: 12,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{o.asignaturaNombre} • {o.asignaturaCodigo}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Año {o.anio} • Período {o.periodo} • Inscritos: {o.inscritosCount ?? 0}</div>
                </div>
                <div>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>Entrar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfesorOfertasPage
