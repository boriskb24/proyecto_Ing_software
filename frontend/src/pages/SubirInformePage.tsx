import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { uploadInformeForInscripcion } from '../services/api'
import { UploadCloud, X } from 'lucide-react'

export const SubirInformePage: React.FC = () => {
  const { inscripcionId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inscripcionId) return
    if (!file) {
      setError('Selecciona un archivo PDF')
      return
    }
    setLoading(true)
    try {
      await uploadInformeForInscripcion(Number(inscripcionId), file)
      alert('Informe subido correctamente')
      navigate(-1)
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error al subir el informe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>
        <h2>Subir Informe</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ color: 'salmon' }}>{error}</div>}
          <label style={{ display: 'block' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 12,
              background: '#0f1724', border: '1px dashed rgba(255,255,255,0.06)', cursor: 'pointer'
            }}>
              <UploadCloud size={20} color="#60a5fa" />
              <div>
                <div style={{ fontWeight: 700 }}>{file ? file.name : 'Adjuntar informe (PDF)'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{file ? `${(file.size/1024).toFixed(1)} KB` : 'Formato PDF, máximo recomendado 10 MB'}</div>
              </div>
            </div>
            <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={e => { setFile(e.target.files ? e.target.files[0] : null); setError(null) }} />
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={loading} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
              background: 'linear-gradient(90deg,#16a34a,#60d394)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: '0 8px 20px rgba(16,185,129,0.12)'
            }}>{loading ? 'Subiendo...' : (<><UploadCloud size={16}/> Subir Informe</>)}</button>

            <button type="button" onClick={() => navigate(-1)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12,
              background: '#0b1220', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.04)'
            }}><X size={16}/> Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubirInformePage
