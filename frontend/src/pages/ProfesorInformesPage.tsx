import React, { useEffect, useState, useRef } from 'react'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getInscripcionesForProfesor, InscripcionDto, uploadInformeForInscripcion } from '../services/api'

export const ProfesorInformesPage: React.FC = () => {
  const { user } = useAuth()
  const [inscripciones, setInscripciones] = useState<InscripcionDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})
  const [uploadingFor, setUploadingFor] = useState<number | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) throw new Error('Usuario no autenticado')
        const data = await getInscripcionesForProfesor(user.email)
        setInscripciones(data)
      } catch (e: any) {
        setError(e.message || 'Error al obtener inscripciones')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

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
        <h2>Subir informes - Profesor</h2>
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ marginTop: 20 }}>
            {inscripciones.length === 0 && <p>No hay inscripciones para mostrar.</p>}
            {inscripciones.map(i => (
              <div key={i.inscripcionId} style={{ background: '#fff', color: '#0b1329', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{i.nombreCompleto}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{i.estudianteRut} • {i.correo}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input ref={el => fileInputs.current[i.inscripcionId] = el} type="file" accept="application/pdf,.pdf" />
                  <button onClick={() => handleUpload(i.inscripcionId)} disabled={uploadingFor === i.inscripcionId} style={{ padding: '8px 12px', borderRadius: 6 }}>
                    {uploadingFor === i.inscripcionId ? 'Subiendo...' : 'Subir Informe'}
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
