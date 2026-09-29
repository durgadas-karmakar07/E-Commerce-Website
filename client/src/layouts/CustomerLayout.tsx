import React from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import {
  User,
  Package,
  Heart,
  MapPin,
  Star,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Header } from '../components/common/Header.js';
import { Footer } from '../components/common/Footer.js';
import { useAuth } from '../context/AuthContext.js';

export const CustomerLayout: React.FC = () => {
  const { user, isLoading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/account" state={{ from: { pathname: '/account' } }} replace />;
  }

  const navItems = [
    { to: '/account', end: true, label: 'Account Overview', icon: User },
    { to: '/account/orders', label: 'My Orders', icon: Package },
    { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/account/reviews', label: 'My Reviews', icon: Star },
    { to: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
    { to: '/account/settings', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Customer Navigation Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle">
              {/* User Bio Header */}
              <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
                <img
                  src={
                    user.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
                  }
                  alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                />
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-slate-900 truncate">{user.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  {isAdmin && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      Administrator
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Portal Shortcut if Admin */}
              {isAdmin && (
                <div className="py-4 border-b border-slate-100">
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-between shadow-card hover:opacity-95 transition-opacity"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Admin Control Panel
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </NavLink>
                  );
                })}
              </nav>

              {/* Logout Action */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Account View Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
