import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { useCart } from './CartContext.js';
import { useToast } from './ToastContext.js';

interface WishlistContextType {
  wishlist: { _id?: string; product: Product; addedAt?: string }[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<{ _id?: string; product: Product; addedAt?: string }[]>([]);
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const { success, error: toastError } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }

    try {
      const res: any = await api.get('/wishlist');
      if (res.success && res.wishlist) {
        setWishlist(res.wishlist);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => {
      const id = typeof item.product === 'string' ? item.product : item.product?._id;
      return id === productId;
    });
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) =>
        prev.filter((item) => {
          const id = typeof item.product === 'string' ? item.product : item.product?._id;
          return id !== productId;
        })
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to remove from wishlist.');
    }
  };

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      toastError('Please log in to save items to your wishlist.');
      return;
    }

    const alreadyIn = isInWishlist(product._id);

    try {
      if (alreadyIn) {
        await removeFromWishlist(product._id);
        success('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${product._id}`);
        setWishlist((prev) => [...prev, { product, addedAt: new Date().toISOString() }]);
        success('Saved to wishlist');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update wishlist.');
    }
  };

  const moveToCart = async (productId: string) => {
    if (!user) return;
    try {
      await api.post(`/wishlist/${productId}/move-to-cart`);
      success('Moved item to shopping cart');
      await Promise.all([fetchWishlist(), refreshCart()]);
    } catch (err: any) {
      toastError(err.message || 'Failed to move item to cart.');
    }
  };

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,
    refreshWishlist: fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default useWishlist;
