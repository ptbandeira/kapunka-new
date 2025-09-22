
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, sizeId: string, quantity?: number) => void;
  removeFromCart: (productId: string, sizeId: string) => void;
  updateQuantity: (productId: string, sizeId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const item = window.localStorage.getItem('kapunka-cart');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem('kapunka-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((productId: string, sizeId: string, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === productId && item.sizeId === sizeId);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === productId && item.sizeId === sizeId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { productId, sizeId, quantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string, sizeId: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.productId === productId && item.sizeId === sizeId)));
  }, []);

  const updateQuantity = useCallback((productId: string, sizeId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, sizeId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId && item.sizeId === sizeId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const value = useMemo(() => ({ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
