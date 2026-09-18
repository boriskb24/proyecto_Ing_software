import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { EntregaInformePage } from './pages/EntregaInformePage'
import { ProfesorInformesPage } from './pages/ProfesorInformesPage'
import { SubirInformePage } from './pages/SubirInformePage'
import { ProfesorOfertasPage } from './pages/ProfesorOfertasPage'
import { PlanificacionesPage } from './pages/PlanificacionesPage'
import { PerfilPage } from './pages/PerfilPage'

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/entrega-informe" element={<EntregaInformePage />} />

            {/* Profesor -> ofertas -> informes -> subir informe (tu flujo) */}
            <Route path="/profesor/ofertas" element={<ProfesorOfertasPage />} />
            <Route path="/profesor/ofertas/:ofertaId" element={<ProfesorInformesPage />} />
            <Route path="/profesor/informes" element={<ProfesorInformesPage />} />
            <Route path="/profesor/inscripciones/:inscripcionId/subir" element={<SubirInformePage />} />

            {/* Flujos adicionales del compañero: planificaciones y perfil (separados) */}
            <Route path="/planificaciones" element={<PlanificacionesPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
