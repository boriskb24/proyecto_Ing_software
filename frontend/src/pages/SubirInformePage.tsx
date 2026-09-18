import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { uploadInformeForInscripcion } from '../services/api'

export const SubirInformePage: React.FC = () => {
  const { inscripcionId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inscripcionId) return
    if (!file) {
      alert('Selecciona un archivo PDF')
      return
    }
    setLoading(true)
    try {
      await uploadInformeForInscripcion(Number(inscripcionId), file)
      alert('Informe subido correctamente')
      navigate(-1)
    } catch (e: any) {
      alert(e.response?.data?.message || e.message || 'Error al subir el informe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>
        <h2>Subir Informe</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="file" accept="application/pdf,.pdf" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 12px', borderRadius: 6 }}>{loading ? 'Subiendo...' : 'Subir'}</button>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: '8px 12px', borderRadius: 6 }}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubirInformePage
