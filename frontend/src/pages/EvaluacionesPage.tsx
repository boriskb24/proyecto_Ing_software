import React from 'react';
import { Navbar } from '../components/Navbar';
import { EvaluacionesProfesor } from '../components/EvaluacionesProfesor';

export const EvaluacionesPage: React.FC = () => {
  // RUT del profesor de pruebas (coincide con los datos semilla de la BD)
  const rutProfesor = '12345678-9';

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <EvaluacionesProfesor rutProfesor={rutProfesor} />
      </div>
    </div>
  );
};