import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartData, CartItem } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { useToast } from './ToastContext.js';

interface CartContextType {
  cart: CartData;
  isLoading: boolean;
  addToCart: (productId: string, variantSkuOrQty?: string | number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const emptyCart: CartData = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  totalMrp: 0,
  discount: 0,
  deliveryCharge: 0,
  tax: 0,
  total: 0,
  hasOutOfStock: false,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartData>(emptyCart);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await api.get('/cart');
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } catch (err: any) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, variantSkuOrQty?: string | number, quantity = 1) => {
    if (!user) {
      toastError('Please log in or sign up to add items to your cart.');
      return;
    }

    const sku = typeof variantSkuOrQty === 'string' ? variantSkuOrQty : undefined;
    const qty = typeof variantSkuOrQty === 'number' ? variantSkuOrQty : (quantity || 1);

    try {
      setIsLoading(true);
      const res: any = await api.post('/cart/items', { productId, variantSku: sku, quantity: qty });
      if (res.success) {
        success('Added to cart!');
        await fetchCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to add item to cart.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res: any = await api.put(`/cart/items/${itemId}`, { quantity });
      if (res.success) {
        await fetchCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update quantity.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res: any = await api.delete(`/cart/items/${itemId}`);
      if (res.success) {
        success('Item removed from cart.');
        await fetchCart();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to remove item.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      await api.delete('/cart');
      setCart(emptyCart);
    } catch (err: any) {
      toastError(err.message || 'Failed to clear cart.');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cart,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
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

export default useCart;
