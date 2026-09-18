// src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getGamePrice } from '../utils/pricing';

const CartContext = createContext(null);

const STORAGE_KEY = 'mygameon_cart_v1';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const addToCart = (game, customProps = {}, openModal = true) => {
    if (!game || !game.id) return;

    setItems((prev) => {
      // Check if already in cart
      const exists = prev.some((item) => item.id === game.id);
      if (exists) return prev;

      // Resolve price: customProps.price > bundling price > central getGamePrice (Sims 4 = 50k, others = 10k)
      let price = 10000;
      if (typeof customProps.price === 'number') {
        price = customProps.price;
      } else if (game.type === 'bundling' && typeof game.price === 'number') {
        price = game.price;
      } else {
        price = getGamePrice(game);
      }

      const newItem = {
        id: game.id,
        title: game.title || game.name || 'Game PC',
        price,
        coverImageUrl: game.coverImageUrl || game.cover || game.thumbnail || '',
        genres: Array.isArray(game.genres) ? game.genres : [],
        sizeFormatted: game.size || game.sizeFormatted || '',
        type: customProps.type || 'single',
        ...customProps,
      };

      return [...prev, newItem];
    });

    if (openModal) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (itemId) => {
    return items.some((item) => item.id === itemId);
  };

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [items]);

  const itemCount = items.length;

  const value = {
    items,
    itemCount,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
