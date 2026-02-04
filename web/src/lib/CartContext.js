'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCart as getCartFromStorage,
  addToCart as addToCartStorage,
  removeFromCart as removeFromCartStorage,
  clearCart as clearCartStorage,
  getCartTotal as getCartTotalFromStorage,
} from './cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(getCartFromStorage());
    setMounted(true);
  }, []);

  const addToCart = useCallback((product) => {
    const updated = addToCartStorage(product);
    setItems(updated);
  }, []);

  const removeFromCart = useCallback((slug) => {
    const updated = removeFromCartStorage(slug);
    setItems(updated);
  }, []);

  const clearCart = useCallback(() => {
    const updated = clearCartStorage();
    setItems(updated);
  }, []);

  const isInCart = useCallback(
    (slug) => items.some((item) => item.slug === slug),
    [items]
  );

  const total = items.reduce((sum, item) => sum + (item.monthlyCost || 0), 0);
  const count = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        mounted,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
