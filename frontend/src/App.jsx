import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthProviderClientes } from './contexts/AuthContextClientes';
import { CarritoProvider } from './contexts/CarritoContext';
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
import Configuracion from './pages/admin/Configuracion';

// Página pública (la crearemos después)
import CatalogoPublico from './pages/CatalogoPublico';
import CatalogoCompleto from './pages/CatalogoCompleto';
import ImageChecker from './pages/ImageChecker';

// Páginas de clientes
import Register from './pages/Register';
import LoginCliente from './pages/LoginCliente';
import PerfilCliente from './pages/PerfilCliente';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <AuthProvider>
      <AuthProviderClientes>
        <CarritoProvider>
          <Router>
          <Routes>
            {/* Ruta pública - Catálogo */}
            <Route path="/" element={<CatalogoPublico />} />
            <Route path="/catalogo" element={<CatalogoPublico />} />
            <Route path="/catalogo-completo" element={<CatalogoCompleto />} />
            <Route path="image-checker" element={<ImageChecker />} />

            {/* Rutas de autenticación de clientes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login-cliente" element={<LoginCliente />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Rutas protegidas de clientes */}
            <Route path="/perfil" element={<PerfilCliente />} />

            {/* Login Admin */}
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
              <Route path="configuracion" element={<Configuracion />} />
            </Route>

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CarritoProvider>
      </AuthProviderClientes>
    </AuthProvider>
  );
}

export default App;
