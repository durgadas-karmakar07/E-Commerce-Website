import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header.js';
import { Footer } from '../components/common/Footer.js';
import { QuickViewModal } from '../components/common/QuickViewModal.js';
import { Product } from '../types/index.js';

export const PublicLayout: React.FC = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header />
      <main className="flex-1">
        <Outlet context={{ openQuickView: setQuickViewProduct }} />
      </main>
      <Footer />

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
