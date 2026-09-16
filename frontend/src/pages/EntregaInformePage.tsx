import React from 'react'
import { Navbar } from '../components/Navbar'
import { EntregaInformeForm } from '../components/EntregaInformeForm'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export const EntregaInformePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '20px',
            padding: 0,
          }}
        >
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>

        <EntregaInformeForm />
      </div>
    </div>
  )
}
