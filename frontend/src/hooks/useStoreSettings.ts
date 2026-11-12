import { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiFetch';

export interface StoreSettings {
  store_name: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  address?: string;
  delivery_zones?: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Popé',
  email: '',
  phone: '',
  whatsapp_number: '',
  address: '',
  delivery_zones: '',
};

/**
 * Hook para obtener la configuración de la tienda desde StoreSettings API.
 * Cachea el resultado y retorna valores por defecto si falla.
 * 
 * @returns { settings, loading, error }
 */
export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFetch('/store-settings/', { auth: false });
        
        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración de la tienda');
        }

        const data = await response.json();
        
        if (isMounted) {
          setSettings({
            store_name: data.store_name || DEFAULT_SETTINGS.store_name,
            email: data.email || DEFAULT_SETTINGS.email,
            phone: data.phone || DEFAULT_SETTINGS.phone,
            whatsapp_number: data.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
            address: data.address || DEFAULT_SETTINGS.address,
            delivery_zones: data.delivery_zones || DEFAULT_SETTINGS.delivery_zones,
          });
        }
      } catch (err) {
        console.warn('Error loading store settings, using defaults:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, loading, error };
}
