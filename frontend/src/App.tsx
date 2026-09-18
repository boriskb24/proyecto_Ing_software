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
            <Route path="/entrega-informe" element={<EntregaInformePage />} />
            <Route path="/profesor/ofertas" element={<ProfesorOfertasPage />} />
            <Route path="/profesor/ofertas/:ofertaId" element={<ProfesorInformesPage />} />
            <Route path="/profesor/informes" element={<ProfesorInformesPage />} />
            <Route path="/profesor/inscripciones/:inscripcionId/subir" element={<SubirInformePage />} />
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
