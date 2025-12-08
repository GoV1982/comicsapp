import { createContext, useContext, useState, useEffect } from 'react';
import { tasasCambioAPI } from '../services/api';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency debe usarse dentro de un CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [monedaSeleccionada, setMonedaSeleccionada] = useState('ARS');
    const [tasas, setTasas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar tasas al inicio
    useEffect(() => {
        loadTasas();
        // Cargar preferencia guardada
        const savedCurrency = localStorage.getItem('moneda_preferida');
        if (savedCurrency) {
            setMonedaSeleccionada(savedCurrency);
        }
    }, []);

    const loadTasas = async () => {
        try {
            const response = await tasasCambioAPI.getAllTasas();
            setTasas(response.data || []);
        } catch (error) {
            console.error('Error al cargar tasas:', error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarMoneda = (nuevaMoneda) => {
        setMonedaSeleccionada(nuevaMoneda);
        localStorage.setItem('moneda_preferida', nuevaMoneda);
    };

    const convertirPrecio = (precioARS) => {
        if (!precioARS || monedaSeleccionada === 'ARS') {
            return precioARS;
        }

        const tasa = tasas.find(t => t.moneda === monedaSeleccionada);
        if (!tasa) return precioARS;

        // Convertir de ARS a la moneda seleccionada
        return precioARS / tasa.tasa;
    };

    const formatearPrecio = (precioARS) => {
        const precioConvertido = convertirPrecio(precioARS);
        const tasa = tasas.find(t => t.moneda === monedaSeleccionada);
        const simbolo = tasa?.simbolo || '$';

        return `${simbolo} ${precioConvertido.toFixed(2)}`;
    };

    const getTasaActual = () => {
        return tasas.find(t => t.moneda === monedaSeleccionada);
    };

    const value = {
        monedaSeleccionada,
        tasas,
        loading,
        cambiarMoneda,
        convertirPrecio,
        formatearPrecio,
        getTasaActual,
        loadTasas,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
