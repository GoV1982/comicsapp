// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  Package,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { comicsAPI, editorialesAPI, stockAPI } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalComics: 0,
    totalEditoriales: 0,
    totalStock: 0,
    sinStock: 0,
    loading: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [comicsRes, editorialesRes, stockRes] = await Promise.all([
        comicsAPI.getAll(),
        editorialesAPI.getAll(),
        stockAPI.getSummary(),
      ]);

      setStats({
        totalComics: comicsRes.count || 0,
        totalEditoriales: editorialesRes.count || 0,
        totalStock: stockRes.data?.total_unidades || 0,
        sinStock: stockRes.data?.sin_stock || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setStats({ ...stats, loading: false });
    }
  };

  const statCards = [
    {
      title: 'Total Comics',
      value: stats.totalComics,
      icon: BookOpen,
      color: 'primary',
      link: '/admin/comics',
    },
    {
      title: 'Editoriales',
      value: stats.totalEditoriales,
      icon: Building2,
      color: 'secondary',
      link: '/admin/editoriales',
    },
    {
      title: 'Stock Total',
      value: stats.totalStock,
      icon: Package,
      color: 'accent',
      link: '/admin/stock',
    },
    {
      title: 'Sin Stock',
      value: stats.sinStock,
      icon: AlertCircle,
      color: 'red',
      link: '/admin/stock?filter=sin_stock',
      alert: stats.sinStock > 0,
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Resumen general del sistema de gestión
        </p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            primary: 'from-primary-500 to-primary-600',
            secondary: 'from-secondary-500 to-secondary-600',
            accent: 'from-accent-500 to-accent-600',
            red: 'from-red-500 to-red-600',
          };

          return (
            <div
              key={stat.title}
              className="card-hover fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 bg-gradient-to-br ${
                    colorClasses[stat.color]
                  } rounded-xl shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.alert && (
                  <span className="badge badge-danger">
                    Atención
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>

              <Link
                to={stat.link}
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Ver detalles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestión de Contenido */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Gestión de Contenido
          </h2>
          <div className="space-y-3">
            <Link
              to="/admin/comics"
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Comics</p>
                  <p className="text-sm text-gray-500">
                    Agregar y gestionar títulos
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link
              to="/admin/editoriales"
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Editoriales</p>
                  <p className="text-sm text-gray-500">
                    Gestionar editoriales
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Inventario */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-accent-600" />
            Inventario
          </h2>
          <div className="space-y-3">
            <Link
              to="/admin/stock"
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Stock General</p>
                  <p className="text-sm text-gray-500">
                    Ver y actualizar inventario
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>

            {stats.sinStock > 0 && (
              <Link
                to="/admin/stock?filter=sin_stock"
                className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      {stats.sinStock} sin stock
                    </p>
                    <p className="text-sm text-red-600">
                      Requiere atención
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-red-400" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="card bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              Sistema de Gestión de Comiquería
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Versión 1.0.0 - Fase 1 completada
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-success">Backend ✓</span>
              <span className="badge badge-success">Frontend ✓</span>
              <span className="badge badge-primary">Admin Panel ✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}