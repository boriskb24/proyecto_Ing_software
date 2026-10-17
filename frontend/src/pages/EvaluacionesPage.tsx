import React from 'react';
import { Navbar } from '../components/Navbar';
import { EvaluacionesProfesor } from '../components/EvaluacionesProfesor';
import { EvaluacionesEstudiante } from '../components/EvaluacionesEstudiante';
import { useAuth } from '../context/AuthContext';

export const EvaluacionesPage: React.FC = () => {
  const { user } = useAuth();
  const esEstudiante = user?.role === 'Estudiante';

  return (
    <div style={{ backgroundColor: '#0b1329', minHeight: '100vh', color: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 60px' }}>
        {esEstudiante ? (
          <EvaluacionesEstudiante />
        ) : (
          <EvaluacionesProfesor correoProfesor={user?.email} />
        )}
      </div>
    </div>
  );
};