import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer routes */}
          <Route path="/" element={<CatalogPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/producto/:slug" element={<ProductDetailPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute element={<AdminDashboard />} />} 
          />
          <Route 
            path="/admin/orders" 
            element={<ProtectedRoute element={<AdminOrdersPage />} />} 
          />
          {/* More admin pages will be added here */}
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;
