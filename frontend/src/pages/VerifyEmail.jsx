import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authClientesAPI } from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authClientesAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verificado exitosamente');

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login-cliente');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Error al verificar el email');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Verificando email...
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Por favor espera mientras verificamos tu cuenta.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  ¡Email verificado!
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {message}
                </p>
                <p className="mt-4 text-center text-sm text-gray-500">
                  Serás redirigido al login en unos segundos...
                </p>
                <button
                  onClick={() => navigate('/login-cliente')}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Ir al Login
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-600" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Error de verificación
                </h2>
                <p className="mt-2 text-center text-sm text-red-600">
                  {message}
                </p>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Registrarse nuevamente
                  </button>
                  <button
                    onClick={() => navigate('/login-cliente')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Ir al Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
