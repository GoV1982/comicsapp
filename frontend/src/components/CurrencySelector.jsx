import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
    const { monedaSeleccionada, tasas, cambiarMoneda, loading } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const tasaActual = tasas.find(t => t.moneda === monedaSeleccionada);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (moneda) => {
        cambiarMoneda(moneda);
        setIsOpen(false);
    };

    if (loading || tasas.length === 0) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <span className="text-sm font-medium text-gray-700">
                    {tasaActual?.simbolo} {monedaSeleccionada}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                            Seleccionar Moneda
                        </div>
                        {tasas.map((tasa) => (
                            <button
                                key={tasa.moneda}
                                onClick={() => handleSelect(tasa.moneda)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${tasa.moneda === monedaSeleccionada
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-base">{tasa.simbolo}</span>
                                    <span>{tasa.nombre}</span>
                                </span>
                                {tasa.moneda === monedaSeleccionada && (
                                    <span className="text-primary-600">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                    {tasaActual && tasaActual.moneda !== 'ARS' && (
                        <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Tasa:</span>
                                <span className="font-medium">1 ARS = {(1 / tasaActual.tasa).toFixed(4)} {tasaActual.moneda}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
