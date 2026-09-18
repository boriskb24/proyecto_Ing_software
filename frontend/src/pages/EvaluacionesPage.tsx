import React from 'react';
import { EvaluacionesProfesor } from '../components/EvaluacionesProfesor';

export const EvaluacionesPage: React.FC = () => {
  // Puedes reemplazar este RUT de prueba por el RUT real extraído de tu contexto de usuario/token
  const rutProfesor = '12345678-9';

  return (
    <div>
      <EvaluacionesProfesor rutProfesor={rutProfesor} />
    </div>
  );
};