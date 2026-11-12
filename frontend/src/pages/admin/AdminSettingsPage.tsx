import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { apiFetch } from '../../services/apiFetch';

interface StoreSettings {
  store_name?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  address?: string;
  delivery_zones?: string;
}

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  const [settings, setSettings] = useState<StoreSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'store' | 'contact' | 'system'>('store');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/store-settings/');
      if (!response.ok) throw new Error('Error al cargar configuración');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await apiFetch('/store-settings/1/', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorData === 'object' && errorData
            ? Object.entries(errorData as Record<string, unknown>)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
                .join(' | ')
            : 'Error al guardar configuración'
        );
      }
      const data = await response.json();
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const StoreTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre de la Tienda
          </label>
          <input
            type="text"
            value={settings.store_name || ''}
            onChange={(e) => handleInputChange('store_name', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email (opcional)
          </label>
          <input
            type="email"
            value={settings.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            value={settings.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Ej: +54 9 3764 71-0683"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            WhatsApp (solo dígitos, int'l)
          </label>
          <input
            type="tel"
            value={settings.whatsapp_number || ''}
            onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
            placeholder="Ej: 5493764710683"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Usado en recibos PDF y enlaces wa.me</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Dirección (mostrada en pie de página)
        </label>
        <input
          type="text"
          value={settings.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Ej: Av. Principal 123, Oberá"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Zonas de Entrega (mostradas en carrito)
        </label>
        <textarea
          value={settings.delivery_zones || ''}
          onChange={(e) => handleInputChange('delivery_zones', e.target.value)}
          placeholder="Ej: Zona 1: Oberá\nZona 2: Alrededores\nZona 3: Interior"
          rows={4}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );

  const ContactTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
        <p className="text-sm text-slate-300">
          <strong>ℹ️ Información:</strong> Los datos que ingreses aquí se usarán en:
        </p>
        <ul className="text-sm text-slate-400 mt-2 list-disc list-inside">
          <li>Recibos PDF (store_name, whatsapp_number)</li>
          <li>Pie de página del catálogo (store_name, address)</li>
          <li>Botón WhatsApp de carrito (whatsapp_number)</li>
          <li>Información de zonas de entrega (delivery_zones)</li>
        </ul>
      </div>
    </div>
  );

  const SystemTab = () => (
    <div className="space-y-4">
      <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
        <h4 className="font-semibold text-white mb-2">Información del Sistema</h4>
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            <span className="text-slate-300">Admin Conectado:</span> {user?.full_name || user?.email}
          </p>
          <p>
            <span className="text-slate-300">Email:</span> {user?.email}
          </p>
          <p>
            <span className="text-slate-300">Versión Popé:</span> v0.9.0
          </p>
          <p>
            <span className="text-slate-300">Última Sincronización:</span>{' '}
            {new Date().toLocaleString('es-AR')}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Configuración">
        <div className="flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-slate-400">Cargando configuración...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuración">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-900">Configuración de la Tienda</h2>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {saved && (
          <div className="bg-green-900 border border-green-700 text-green-200 p-4 rounded-lg">
            ✓ Configuración guardada exitosamente
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700 flex-wrap">
          {[
            { id: 'store', label: '🏪 Tienda' },
            { id: 'contact', label: '📧 Uso de Datos' },
            { id: 'system', label: '⚙️ Sistema' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          {activeTab === 'store' && <StoreTab />}
          {activeTab === 'contact' && <ContactTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>

        {/* Save Button (Footer) */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
