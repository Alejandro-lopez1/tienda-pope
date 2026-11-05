import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/" element={<CatalogPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
