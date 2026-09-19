import React from 'react';
import { Navbar } from '../components/Navbar';
import { PlanificacionesView } from '../components/PlanificacionesView';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PlanificacionesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0 24px', boxSizing: 'border-box' }}>
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
            padding: 0,
          }}
        >
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>
      </div>

      <PlanificacionesView />
    </div>
  );
};
