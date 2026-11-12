import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import VehiculoDetalle from './pages/VehiculoDetalle'
import Catalogo from './pages/Catalogo'
import Ordenes from './pages/Ordenes'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehiculos" element={<Vehiculos />} />
              <Route path="vehiculos/:id" element={<VehiculoDetalle />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route path="ordenes" element={<Ordenes />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
