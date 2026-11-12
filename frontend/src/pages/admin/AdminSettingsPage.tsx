import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface Settings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_province: string;
  store_zipcode: string;
  whatsapp_number: string;
  business_hours: string;
  payment_methods: string;
  shipping_methods: string;
  tax_percentage: string;
  logo_text: string;
  primary_color: string;
  secondary_color: string;
  currency: string;
  language: string;
  timezone: string;
}

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'contact' | 'appearance' | 'system'>('store');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // En una app real, obtendríamos esto de /api/v1/settings/
      // Para MVP, usamos localStorage como fallback
      const saved = localStorage.getItem('storeSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      } else {
        setSettings({
          store_name: 'Popé',
          store_email: 'info@pope.com.ar',
          store_phone: '+54 911 1234-5678',
          store_address: 'Av. Principal 123',
          store_city: 'Buenos Aires',
          store_province: 'Buenos Aires',
          store_zipcode: '1425',
          whatsapp_number: '+5491112345678',
          business_hours: 'Lun-Vie: 9:00-18:00 | Sab: 10:00-14:00',
          payment_methods: 'Efectivo, Transferencia, WhatsApp Pay',
          shipping_methods: 'Entrega local, Envío por correo',
          tax_percentage: '0',
          logo_text: 'POPÉ',
          primary_color: '#FF4757',
          secondary_color: '#7DC41F',
          currency: 'ARS',
          language: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // En una app real, POST a /api/v1/settings/
      localStorage.setItem('storeSettings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Settings, value: string) => {
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
            Email de la Tienda
          </label>
          <input
            type="email"
            value={settings.store_email || ''}
            onChange={(e) => handleInputChange('store_email', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={settings.store_phone || ''}
            onChange={(e) => handleInputChange('store_phone', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            WhatsApp
          </label>
          <input
            type="tel"
            value={settings.whatsapp_number || ''}
            onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Dirección
        </label>
        <input
          type="text"
          value={settings.store_address || ''}
          onChange={(e) => handleInputChange('store_address', e.target.value)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            value={settings.store_city || ''}
            onChange={(e) => handleInputChange('store_city', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Provincia
          </label>
          <input
            type="text"
            value={settings.store_province || ''}
            onChange={(e) => handleInputChange('store_province', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Código Postal
          </label>
          <input
            type="text"
            value={settings.store_zipcode || ''}
            onChange={(e) => handleInputChange('store_zipcode', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Horarios de Atención
        </label>
        <textarea
          value={settings.business_hours || ''}
          onChange={(e) => handleInputChange('business_hours', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );

  const ContactTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Métodos de Pago
        </label>
        <textarea
          value={settings.payment_methods || ''}
          onChange={(e) => handleInputChange('payment_methods', e.target.value)}
          rows={3}
          placeholder="Ej: Efectivo, Transferencia, WhatsApp Pay"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Métodos de Envío
        </label>
        <textarea
          value={settings.shipping_methods || ''}
          onChange={(e) => handleInputChange('shipping_methods', e.target.value)}
          rows={3}
          placeholder="Ej: Entrega local, Envío por correo"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Impuesto (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.tax_percentage || '0'}
            onChange={(e) => handleInputChange('tax_percentage', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Moneda
          </label>
          <select
            value={settings.currency || 'ARS'}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="ARS">ARS - Peso Argentino</option>
            <option value="USD">USD - Dólar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
      </div>
    </div>
  );

  const AppearanceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre/Logo
          </label>
          <input
            type="text"
            value={settings.logo_text || ''}
            onChange={(e) => handleInputChange('logo_text', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Idioma
          </label>
          <select
            value={settings.language || 'es'}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Color Primario
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.primary_color || '#FF4757'}
              onChange={(e) => handleInputChange('primary_color', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.primary_color || '#FF4757'}
              onChange={(e) => handleInputChange('primary_color', e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Color Secundario
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.secondary_color || '#7DC41F'}
              onChange={(e) => handleInputChange('secondary_color', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.secondary_color || '#7DC41F'}
              onChange={(e) => handleInputChange('secondary_color', e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const SystemTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Zona Horaria
          </label>
          <select
            value={settings.timezone || 'America/Argentina/Buenos_Aires'}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
            <option value="America/New_York">New York</option>
            <option value="Europe/London">London</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Versión de API
          </label>
          <input
            type="text"
            disabled
            value="v1"
            className="w-full px-4 py-2 bg-slate-600 border border-slate-600 text-slate-400 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
        <h4 className="font-semibold text-white mb-2">Información del Sistema</h4>
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            <span className="text-slate-300">Admin Conectado:</span> {user?.full_name}
          </p>
          <p>
            <span className="text-slate-300">Email:</span> {user?.email}
          </p>
          <p>
            <span className="text-slate-300">Versión Popé:</span> v0.8.0
          </p>
          <p>
            <span className="text-slate-300">Última Sincronización:</span>{' '}
            {new Date().toLocaleString('es-AR')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Configuración">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Configuración de la Tienda</h2>
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="bg-green-900 border border-green-700 text-green-200 p-4 rounded-lg">
            ✓ Configuración guardada exitosamente
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          {[
            { id: 'store', label: '🏪 Tienda', icon: '🏪' },
            { id: 'contact', label: '📧 Contacto', icon: '📧' },
            { id: 'appearance', label: '🎨 Apariencia', icon: '🎨' },
            { id: 'system', label: '⚙️ Sistema', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
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
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>

        {/* Save Button (Footer) */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
