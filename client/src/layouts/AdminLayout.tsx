import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Star,
  RotateCcw,
  Tag,
  BarChart3,
  FileSpreadsheet,
  Activity,
  Bug,
  ShieldCheck,
  Bell,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      api.get('/notifications')
        .then((res: any) => {
          if (res.success) {
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Enforce Admin role verification
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const menuSections = [
    {
      title: 'Store Operations',
      items: [
        { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/products', label: 'Products Catalog', icon: Package },
        { to: '/admin/categories', label: 'Categories', icon: Layers },
        { to: '/admin/inventory', label: 'Inventory & Stock', icon: Boxes },
        { to: '/admin/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
        { to: '/admin/returns', label: 'Returns & Refunds', icon: RotateCcw },
      ],
    },
    {
      title: 'Customers & Growth',
      items: [
        { to: '/admin/customers', label: 'Customers', icon: Users },
        { to: '/admin/reviews', label: 'Customer Reviews', icon: Star },
        { to: '/admin/coupons', label: 'Coupons & Promos', icon: Tag },
        { to: '/admin/analytics', label: 'Sales Analytics', icon: BarChart3 },
        { to: '/admin/reports', label: 'Export Reports', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'System & Diagnostics',
      items: [
        { to: '/admin/health', label: 'Website Health', icon: Activity },
        { to: '/admin/bugs', label: 'Bugs & Errors', icon: Bug },
        { to: '/admin/audit-logs', label: 'Audit Trail Logs', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-card">
                A
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white">AURA Control</span>
                <span className="block text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                  Store Administration
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                <h4 className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-brand-600 text-white shadow-card font-bold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Storefront Link & Logout */}
          <div className="p-4 border-t border-slate-800 shrink-0 space-y-2">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-brand-400" />
                View Customer Store
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">Live</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Admin
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Control Bar */}
        <header className="h-20 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Global admin lookup (Orders, Products, Customers)..."
                className="w-80 bg-slate-800/80 text-xs text-white pl-9 pr-4 py-2 rounded-xl border border-slate-700/60 focus:outline-none focus:border-brand-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-2xl shadow-premium border border-slate-800 p-3 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-brand-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2 pt-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No recent notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-2.5 rounded-xl text-xs ${
                            n.isRead ? 'bg-slate-900/60' : 'bg-slate-800/80 border border-brand-500/20'
                          }`}
                        >
                          <p className="font-bold text-white">{n.title}</p>
                          <p className="text-slate-400 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <img
                src={
                  user.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
                }
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-700"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</p>
                <p className="text-[10px] text-slate-400">Master Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
