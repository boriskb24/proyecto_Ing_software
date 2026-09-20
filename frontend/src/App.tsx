import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { EntregaInformePage } from './pages/EntregaInformePage'
import { PlanificacionesPage } from './pages/PlanificacionesPage'
import { PerfilPage } from './pages/PerfilPage'
import { EvaluacionesPage } from './pages/EvaluacionesPage'

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
            <Route path="/planificaciones" element={<PlanificacionesPage />} />
            <Route path="/evaluaciones" element={<EvaluacionesPage />} />
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