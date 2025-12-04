import { useState, useEffect } from 'react';
import { Loader2, Plus, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download, Pencil, Trash2, X, FileText, BarChart2 } from 'lucide-react';
import { contabilidadAPI, editorialesAPI } from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Contabilidad() {
    const [movimientos, setMovimientos] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [editoriales, setEditoriales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filtros
    const [filtros, setFiltros] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        tipo: '',
        categoria: '',
    });

    // Form data para nuevo egreso
    const [formData, setFormData] = useState({
        tipo: 'egreso',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        categoria: '',
        descripcion: '',
        metodo_pago: 'efectivo',
        proveedor: '',
        comprobante: '',
        editorial_id: '',
    });

    // Categorías
    const CATEGORIAS_INGRESOS = ['Ventas de comics', 'Otros ingresos'];
    const CATEGORIAS_EGRESOS = [
        'Compra de inventario',
        'Gastos de envío',
        'Servicios (alquiler, luz, internet)',
        'Marketing',
        'Otros',
    ];

    useEffect(() => {
        loadData();
        loadEditoriales();
    }, [filtros]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [movimientosRes, estadisticasRes] = await Promise.all([
                contabilidadAPI.getAllMovimientos(filtros),
                contabilidadAPI.getEstadisticas(filtros),
            ]);

            setMovimientos(movimientosRes.data || []);
            setEstadisticas(estadisticasRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const loadEditoriales = async () => {
        try {
            const res = await editorialesAPI.getAllEditoriales();
            setEditoriales(res.data || []);
        } catch (error) {
            console.error('Error al cargar editoriales:', error);
        }
    };

    const handleOpenModal = (movimiento = null) => {
        setError('');
        if (movimiento) {
            if (movimiento.venta_id) {
                alert('No se pueden editar movimientos generados automáticamente por ventas');
                return;
            }
            setEditingId(movimiento.id);
            setFormData({
                tipo: movimiento.tipo,
                monto: movimiento.monto,
                fecha: movimiento.fecha.split('T')[0],
                categoria: movimiento.categoria,
                descripcion: movimiento.descripcion || '',
                metodo_pago: movimiento.metodo_pago || 'efectivo',
                proveedor: movimiento.proveedor || '',
                comprobante: movimiento.comprobante || '',
                editorial_id: movimiento.editorial_id || '',
            });
        } else {
            setFormData({
                tipo: 'egreso',
                monto: '',
                fecha: new Date().toISOString().split('T')[0],
                categoria: '',
                descripcion: '',
                metodo_pago: 'efectivo',
                proveedor: '',
                comprobante: '',
                editorial_id: '',
            });
            setEditingId(null);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await contabilidadAPI.updateMovimiento(editingId, formData);
            } else {
                await contabilidadAPI.createMovimiento(formData);
            }
            await loadData();
            handleCloseModal();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al procesar el movimiento');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, venta_id) => {
        if (venta_id) {
            alert('No se pueden eliminar movimientos generados automáticamente por ventas');
            return;
        }

        if (window.confirm('¿Está seguro de eliminar este movimiento?')) {
            try {
                await contabilidadAPI.deleteMovimiento(id);
                await loadData();
            } catch (err) {
                alert('Error al eliminar el movimiento');
            }
        }
    };

    const exportarCSV = () => {
        const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Método de Pago'];
        const rows = movimientos.map(m => [
            new Date(m.fecha).toLocaleDateString(),
            m.tipo,
            m.categoria,
            m.descripcion || '',
            m.monto,
            m.metodo_pago || '',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contabilidad_${new Date().toISOString()}.csv`;
        a.click();
    };

    const exportarPDF = () => {
        const doc = new jsPDF();
        const fechaActual = new Date().toLocaleDateString();

        // Título
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Reporte Contable - Comiquería', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el: ${fechaActual}`, 14, 28);

        // Resumen
        if (estadisticas?.resumen) {
            doc.setFillColor(240, 240, 240);
            doc.rect(14, 35, 182, 25, 'F');

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('Resumen del Período', 20, 45);

            doc.setFontSize(10);
            doc.text(`Ingresos: $${Number(estadisticas.resumen.total_ingresos).toFixed(2)}`, 20, 53);
            doc.text(`Egresos: $${Number(estadisticas.resumen.total_egresos).toFixed(2)}`, 80, 53);
            doc.text(`Balance: $${Number(estadisticas.resumen.balance).toFixed(2)}`, 140, 53);
        }

        // Tabla de Movimientos
        const tableColumn = ["Fecha", "Tipo", "Categoría", "Descripción", "Monto", "Método"];
        const tableRows = movimientos.map(m => [
            new Date(m.fecha).toLocaleDateString(),
            m.tipo.toUpperCase(),
            m.categoria,
            m.descripcion || '-',
            `$${Number(m.monto).toFixed(2)}`,
            m.metodo_pago || '-'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`reporte_contable_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Cálculos para Análisis Avanzado
    const calcularAnalisis = () => {
        if (!estadisticas?.evolucion_mensual || estadisticas.evolucion_mensual.length < 2) return null;

        const mesActual = estadisticas.evolucion_mensual[0]; // Asumiendo orden desc por fecha
        const mesAnterior = estadisticas.evolucion_mensual[1];

        const crecimientoIngresos = mesAnterior.ingresos > 0
            ? ((mesActual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100
            : 100;

        // Proyección simple: (Total actual / días transcurridos) * días totales del mes
        const hoy = new Date();
        const diasTranscurridos = hoy.getDate();
        const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

        // Solo proyectar si estamos viendo el mes actual
        const esMesActual = new Date(mesActual.mes + '-01').getMonth() === hoy.getMonth();

        const proyeccionIngresos = esMesActual
            ? (mesActual.ingresos / diasTranscurridos) * diasEnMes
            : mesActual.ingresos;

        return {
            crecimientoIngresos,
            proyeccionIngresos,
            mesActual: mesActual.mes,
            mesAnterior: mesAnterior.mes
        };
    };

    const analisis = calcularAnalisis();

    // Preparar datos para gráficos
    const chartDataEvolucion = estadisticas?.evolucion_mensual ? {
        labels: estadisticas.evolucion_mensual.map(e => e.mes).reverse(),
        datasets: [
            {
                label: 'Ingresos',
                data: estadisticas.evolucion_mensual.map(e => e.ingresos).reverse(),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
            },
            {
                label: 'Egresos',
                data: estadisticas.evolucion_mensual.map(e => e.egresos).reverse(),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
            },
        ],
    } : null;

    const chartDataCategorias = estadisticas?.egresos_por_categoria ? {
        labels: estadisticas.egresos_por_categoria.map(e => e.categoria),
        datasets: [
            {
                label: 'Egresos por Categoría',
                data: estadisticas.egresos_por_categoria.map(e => e.total),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                ],
            },
        ],
    } : null;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    const resumen = estadisticas?.resumen || {
        total_ingresos: 0,
        total_egresos: 0,
        balance: 0,
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Contabilidad</h1>
                <div className="flex gap-2">
                    <button
                        onClick={exportarCSV}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Download className="h-5 w-5" />
                        Exportar CSV
                    </button>
                    <button
                        onClick={exportarPDF}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
                    >
                        <FileText className="h-5 w-5" />
                        Exportar PDF
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Egreso
                    </button>
                </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Ingresos</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${Number(resumen.total_ingresos).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {resumen.cantidad_ingresos || 0} movimientos
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Egresos</p>
                            <p className="text-2xl font-bold text-red-600">
                                ${Number(resumen.total_egresos).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {resumen.cantidad_egresos || 0} movimientos
                            </p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Balance</p>
                            <p className={`text-2xl font-bold ${resumen.balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                                ${Number(resumen.balance).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {resumen.balance >= 0 ? 'Ganancia' : 'Pérdida'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Análisis Avanzado */}
            {analisis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Comparativa Mensual</h3>
                            <BarChart2 className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Ingresos {analisis.mesActual} vs {analisis.mesAnterior}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${analisis.crecimientoIngresos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analisis.crecimientoIngresos > 0 ? '+' : ''}{analisis.crecimientoIngresos.toFixed(1)}%
                            </span>
                            {analisis.crecimientoIngresos >= 0 ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Proyección de Cierre</h3>
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Estimación de ingresos al fin de mes
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                ${analisis.proyeccionIngresos.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Estimado
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {chartDataEvolucion && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución Mensual</h3>
                        <Line
                            data={chartDataEvolucion}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' },
                                    title: { display: false },
                                },
                            }}
                        />
                    </div>
                )}

                {chartDataCategorias && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Egresos por Categoría</h3>
                        <Bar
                            data={chartDataCategorias}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: false },
                                    title: { display: false },
                                },
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filtros.fecha_inicio}
                            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filtros.fecha_fin}
                            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            value={filtros.tipo}
                            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                        >
                            <option value="">Todos</option>
                            <option value="ingreso">Ingresos</option>
                            <option value="egreso">Egresos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <input
                            type="text"
                            placeholder="Filtrar..."
                            value={filtros.categoria}
                            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de Movimientos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {movimientos.map((mov) => (
                            <tr key={mov.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(mov.fecha).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${mov.tipo === 'ingreso'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {mov.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Egreso'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {mov.categoria}
                                    {mov.venta_id && <span className="ml-2 text-xs text-gray-500">(Venta #{mov.venta_id})</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {mov.descripcion || '-'}
                                    {mov.proveedor && <div className="text-xs text-gray-500">Prov: {mov.proveedor}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span className={mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                        ${Number(mov.monto).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {!mov.venta_id && (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(mov)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(mov.id, mov.venta_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                    {mov.venta_id && (
                                        <span className="text-xs text-gray-400">Automático</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {movimientos.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No hay movimientos para mostrar
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Nuevo/Editar Egreso */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingId ? 'Editar Movimiento' : 'Nuevo Egreso'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                        disabled={editingId}
                                    >
                                        <option value="egreso">Egreso</option>
                                        <option value="ingreso">Ingreso</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.monto}
                                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                                    <select
                                        required
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option value="">Seleccione...</option>
                                        {(formData.tipo === 'ingreso' ? CATEGORIAS_INGRESOS : CATEGORIAS_EGRESOS).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                    <select
                                        value={formData.metodo_pago}
                                        onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                    <input
                                        type="text"
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="Nombre del proveedor"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante</label>
                                    <input
                                        type="text"
                                        value={formData.comprobante}
                                        onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="Número de factura/recibo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Editorial (opcional)</label>
                                    <select
                                        value={formData.editorial_id}
                                        onChange={(e) => setFormData({ ...formData, editorial_id: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option value="">Sin asignar</option>
                                        {editoriales.map(ed => (
                                            <option key={ed.id} value={ed.id}>{ed.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                        rows="3"
                                        placeholder="Detalles del movimiento..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {editingId ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
