import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

export const StorefrontLayout: React.FC = () => {
  const { itemCount } = useCart();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
      isActive ? 'bg-primary-500 text-white' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img
                src="/logo_pope.jpg"
                alt="Popé"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-primary-100"
              />
              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-gray-900">Popé</div>
                <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Tienda de limpieza</div>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/catalogo" className={navClass}>
                Catálogo
              </NavLink>
              <NavLink to="/carrito" className={navClass}>
                <span className="inline-flex items-center gap-2">
                  Carrito
                  {itemCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-secondary-500 text-white text-xs font-bold">
                      {itemCount}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/admin/login" className={navClass}>
                Admin
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <img src="/logo_pope.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="font-semibold text-gray-800">Popé</span>
            <span className="text-gray-400">·</span>
            <span>Productos de limpieza</span>
          </div>
          <div className="text-gray-500">Posadas · Garupá · Candelaria</div>
        </div>
      </footer>
    </div>
  );
};
