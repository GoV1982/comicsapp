// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas del Admin (las crearemos después)
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Editoriales from './pages/admin/Editoriales';
import Comics from './pages/admin/Comics';
import Stock from './pages/admin/Stock';
import Clientes from './pages/admin/Clientes';
import Ventas from './pages/admin/Ventas';

// Página pública (la crearemos después)
import CatalogoPublico from './pages/CatalogoPublico';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública - Catálogo */}
          <Route path="/" element={<CatalogoPublico />} />
          
          {/* Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas - Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="editoriales" element={<Editoriales />} />
            <Route path="comics" element={<Comics />} />
            <Route path="stock" element={<Stock />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="ventas" element={<Ventas />} />
          </Route>
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;