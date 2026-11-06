import { useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export function useCart() {
  const [cart, setCart] = useState<CartState>({
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const cartString = localStorage.getItem('cart');
      const items = cartString ? JSON.parse(cartString) : [];
      calculateTotals(items);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      setCart({ items: [], total: 0, itemCount: 0 });
    }
  };

  const calculateTotals = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    setCart({
      items,
      total: Math.round(total * 100) / 100,
      itemCount,
    });
  };

  const addToCart = (item: CartItem) => {
    const newItems = [...cart.items];
    const existingIndex = newItems.findIndex((i) => i.id === item.id);

    if (existingIndex > -1) {
      newItems[existingIndex].quantity += item.quantity;
    } else {
      newItems.push(item);
    }

    saveAndUpdate(newItems);
  };

  const removeFromCart = (productId: number) => {
    const newItems = cart.items.filter((item) => item.id !== productId);
    saveAndUpdate(newItems);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newItems = cart.items.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );

    saveAndUpdate(newItems);
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCart({ items: [], total: 0, itemCount: 0 });
  };

  const saveAndUpdate = (items: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items));
    calculateTotals(items);
  };

  return {
    ...cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isEmpty: cart.items.length === 0,
  };
}
