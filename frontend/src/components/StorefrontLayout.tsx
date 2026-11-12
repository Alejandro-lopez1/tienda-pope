import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useStoreSettings } from '../hooks/useStoreSettings';

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
      isActive ? 'bg-primary-500 text-white' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img
                src="/logo_pope.jpg"
                alt="Popé"
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-full object-cover ring-2 ring-primary-100 flex-shrink-0"
              />
              <div className="leading-tight min-w-0">
                <div className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">Popé</div>
                <div className="hidden sm:block text-[11px] font-medium text-gray-500 uppercase tracking-wide">Tienda de limpieza</div>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/catalogo" className={navClass}>
                Catálogo
              </NavLink>
              <NavLink to="/carrito" className="relative p-2 sm:p-3 rounded-md text-sm font-semibold transition-colors hover:bg-primary-50" title="Ver carrito">
                {/* Carrito Icon SVG */}
                <svg className="w-6 h-6 text-gray-700 hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-secondary-500 text-white text-xs font-bold">
                    {itemCount}
                  </span>
                )}
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <img src="/logo_pope.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="font-semibold text-gray-800">{settings.store_name}</span>
            <span className="text-gray-400">·</span>
            <span>Productos de limpieza</span>
          </div>
          
          {/* Información de contacto/ubicación desde StoreSettings */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-0">
            {settings.address && (
              <>
                <span className="text-gray-500">{settings.address}</span>
                <span className="hidden sm:inline text-gray-400 mx-2">·</span>
              </>
            )}
            
            {settings.phone && (
              <>
                <span className="text-gray-500">{settings.phone}</span>
                <span className="hidden sm:inline text-gray-400 mx-2">·</span>
              </>
            )}
            
            {settings.delivery_zones && (
              <>
                <span className="text-gray-500 text-xs">Entregas disponibles</span>
                <span className="hidden sm:inline text-gray-400 mx-2">·</span>
              </>
            )}
            
            <Link to="/admin/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
