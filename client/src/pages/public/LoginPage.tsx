import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, Phone, ArrowRight, ShieldCheck, 
  Sparkles, CheckCircle, LogIn, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'password' | 'phone'>('password');
  
  // Password Mode State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone OTP Mode State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithPassword, sendPhoneOtp, verifyPhoneOtp, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectQuery = searchParams.get('redirect');
  const from = (location.state as any)?.from?.pathname || redirectQuery || null;

  const handleQuickInstantLogin = async (role: 'admin' | 'customer') => {
    setError(null);
    setLoading(true);
    try {
      if (role === 'admin') {
        await loginWithPassword('admin@aura.store', 'Admin@123456');
        addToast('Logged in as Store Administrator.', 'success');
        navigate(from || '/admin', { replace: true });
      } else {
        await loginWithPassword('priya.sharma@example.com', 'Customer@123456');
        addToast('Logged in as Demo Customer (Priya Sharma).', 'success');
        navigate(from || '/account', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Instant login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(email, password);
      addToast('Welcome back! Successfully logged in.', 'success');
      const target = from || (email.toLowerCase().includes('admin') ? '/admin' : '/account');
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPhoneOtp(phoneNumber);
      setOtpSent(true);
      addToast('Demo OTP sent: 123456', 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyPhoneOtp(phoneNumber, otp);
      addToast('Phone number verified! Logged in successfully.', 'success');
      const target = from || '/account';
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      addToast('Signed in with Google successfully.', 'success');
      const target = from || '/account';
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (role: 'admin' | 'customer') => {
    setAuthMode('password');
    if (role === 'admin') {
      setEmail('admin@aura.store');
      setPassword('Admin@123456');
    } else {
      setEmail('priya.sharma@example.com');
      setPassword('Customer@123456');
    }
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block mb-3">
            <span className="font-extrabold text-2xl tracking-wider text-gray-900">
              AURA<span className="text-indigo-600">.</span>
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Sign In to Your Account
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
            Track orders, manage addresses, and view real-time delivery dates
          </p>
        </div>

        {/* 1-Click Instant Login Section */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-blue-50/80 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 shadow-xs">
          <p className="font-bold flex items-center gap-1.5 mb-2.5 text-indigo-900 text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" /> 1-Click Instant Demo Login:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickInstantLogin('customer')}
              className="py-2.5 px-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 active:scale-98 transition text-center shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>👤 1-Click Customer</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickInstantLogin('admin')}
              className="py-2.5 px-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 active:scale-98 transition text-center shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>👑 1-Click Admin</span>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-indigo-100/70 text-[11px] text-indigo-700">
            <span>Or pre-fill form fields:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('customer')}
                className="underline font-semibold hover:text-indigo-950"
              >
                Fill Customer
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className="underline font-semibold hover:text-indigo-950"
              >
                Fill Admin
              </button>
            </div>
          </div>
        </div>

        {/* Auth Method Selector Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition ${
              authMode === 'password'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('phone'); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition ${
              authMode === 'phone'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone & OTP
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        {authMode === 'password' && (
          <form className="mt-6 space-y-4" onSubmit={handlePasswordLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); addToast('Use demo password: Admin@123456 or Customer@123456', 'info'); }} className="text-xs text-indigo-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>
        )}

        {/* Phone OTP Form */}
        {authMode === 'phone' && (
          <div className="mt-6 space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Simulated verification. Demo OTP is <strong>123456</strong>.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl flex items-center justify-between">
                  <span>OTP dispatched to <strong>{phoneNumber}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)} 
                    className="underline text-[11px] text-emerald-700 font-bold"
                  >
                    Change
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enter 6-Digit OTP (Hint: 123456)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-2.5 text-center font-mono tracking-widest text-lg bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Continue'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Simulation Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Sign-In
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
