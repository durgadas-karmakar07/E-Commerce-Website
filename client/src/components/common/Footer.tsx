import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, Headphones, ArrowRight, Heart } from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { success } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      success('Thank you for subscribing to AURA Insiders! Check your inbox for your 10% welcome coupon.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900 mt-20">
      {/* 4 Pillars Value Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-8 px-6 rounded-3xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Free Express Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">On all orders above ₹999 across India</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free doorstep pickup & refunds</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Genuine Products</h4>
              <p className="text-xs text-slate-400 mt-0.5">Direct manufacturer warranty guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Expert customer advisors ready to assist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg">
                A
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">AURA</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Curated premium lifestyle technology, performance apparel, and modern essentials designed for mindful everyday living.
            </p>
            <form onSubmit={handleSubscribe} className="pt-2 flex max-w-md">
              <input
                type="email"
                placeholder="Enter your email for 10% off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900 border border-slate-800 text-white text-sm px-4 py-2.5 rounded-l-xl focus:outline-none focus:border-brand-500 flex-1"
              />
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-r-xl font-semibold text-sm flex items-center transition-colors"
              >
                Join
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop?category=electronics-audio" className="hover:text-white transition-colors">
                  Audio & Headphones
                </Link>
              </li>
              <li>
                <Link to="/shop?category=smart-wearables" className="hover:text-white transition-colors">
                  Smart Wearables
                </Link>
              </li>
              <li>
                <Link to="/shop?category=apparel-fashion" className="hover:text-white transition-colors">
                  Apparel & Hoodies
                </Link>
              </li>
              <li>
                <Link to="/shop?category=footwear-sneakers" className="hover:text-white transition-colors">
                  Sneakers & Footwear
                </Link>
              </li>
              <li>
                <Link to="/shop?category=home-workspace" className="hover:text-white transition-colors">
                  Home & Workspace
                </Link>
              </li>
              <li>
                <Link to="/shop?category=bags-accessories" className="hover:text-white transition-colors">
                  Bags & Wallets
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">Customer Care</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/account/orders" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="hover:text-white transition-colors">
                  Returns & Refunds Policy
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  Shipping Rates & Timelines
                </Link>
              </li>
              <li>
                <Link to="/account/addresses" className="hover:text-white transition-colors">
                  Manage Addresses
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-white transition-colors">
                  Customer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Information */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">AURA Store</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-slate-400">Bangalore Technology Park, Outer Ring Road, Karnataka 560103</li>
              <li className="text-slate-400">Email: support@aura.store</li>
              <li className="text-slate-400">Phone: +91 98765 43210</li>
              <li className="pt-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Store Status: Operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} AURA Lifestyle Store. Operated for Google Antigravity. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Razorpay Secure Payments</span>
            <span>256-bit SSL Encrypted</span>
            <span>Made with <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
