import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getInscripcionesForProfesor, getInscripcionesForOferta, InscripcionDto, uploadInformeForInscripcion } from '../services/api'
import { getOfertaById } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { UploadCloud } from 'lucide-react'

export const ProfesorInformesPage: React.FC = () => {
  const { user } = useAuth()
  const params = useParams()
  const ofertaIdParam = params.ofertaId
  const [inscripciones, setInscripciones] = useState<InscripcionDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})
  const [uploadingFor, setUploadingFor] = useState<number | null>(null)
  const [ofertaHeader, setOfertaHeader] = useState<{ anio?: number; periodo?: number; asignaturaNombre?: string; inscritosCount?: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) throw new Error('Usuario no autenticado')
        let data: InscripcionDto[] = []
        if (ofertaIdParam) {
          data = await getInscripcionesForOferta(Number(ofertaIdParam))
          const of = await getOfertaById(Number(ofertaIdParam))
          setOfertaHeader({ anio: of.anio, periodo: of.periodo, asignaturaNombre: of.asignaturaNombre, inscritosCount: of.inscritosCount })
        } else {
          data = await getInscripcionesForProfesor(user.email)
        }
        setInscripciones(data)
      } catch (e: any) {
        setError(e.message || 'Error al obtener inscripciones')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  useEffect(() => {
    // if route param changes, refetch
  }, [ofertaIdParam])

  const handleUpload = async (inscripcionId: number) => {
    const input = fileInputs.current[inscripcionId]
    if (!input || !input.files || input.files.length === 0) {
      alert('Selecciona un archivo PDF antes de subir.')
      return
    }

    const file = input.files[0]
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Formato no válido. Solo PDF.')
      return
    }

    try {
      setUploadingFor(inscripcionId)
      await uploadInformeForInscripcion(inscripcionId, file)
      alert('Informe subido correctamente')
      input.value = ''
    } catch (e: any) {
      alert(e.response?.data?.message || e.message || 'Error al subir el informe')
    } finally {
      setUploadingFor(null)
    }
  }

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
        {ofertaHeader ? (
          <h2>{ofertaHeader.asignaturaNombre} — Año {ofertaHeader.anio} • Período {ofertaHeader.periodo}</h2>
        ) : (
          <h2>Subir informes - Profesor</h2>
        )}
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}
        {!loading && !error && (
          <div style={{ marginTop: 20 }}>
            {/* ofertaHeader shown in page header when present */}
            {inscripciones.length === 0 && <p>No hay inscripciones para mostrar.</p>}
            {inscripciones.map(i => (
              <div key={i.inscripcionId} style={{ background: '#fff', color: '#0b1329', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{i.nombreCompleto}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{i.estudianteRut} • {i.correo}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/profesor/inscripciones/${i.inscripcionId}/subir`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 12,
                      background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 8px 20px rgba(37,99,235,0.16)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <UploadCloud size={16} />
                    <span>Subir Informe</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfesorInformesPage
