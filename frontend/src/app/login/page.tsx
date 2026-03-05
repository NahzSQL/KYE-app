'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<'staff' | 'admin'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, selectedRole);
      setAuth(res.token, res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');

      if (res.user.isAdmin) {
        router.push('/admin/staff-management');
      } else {
        router.push('/staff/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-display login-bg">
      <div className="min-h-screen flex flex-col">
        {/* Minimal Top Bar */}
        <header className="sticky top-0 z-50">
          <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between px-6 lg:px-10 h-16 mt-2">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">shield</span>
                </div>
                <h2 className="text-slate-900 text-xl font-black tracking-tight">Degxifi</h2>
              </div>
              <div className="flex items-center gap-4">
                <a className="text-slate-500 hover:text-primary text-sm font-medium transition-colors" href="#">Help</a>
                <a className="text-slate-500 hover:text-primary text-sm font-medium transition-colors" href="#">Contact</a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Login Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Floating Icon */}
            <div className="flex justify-center mb-8">
              <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center float-animation overflow-hidden">
                <span className="material-symbols-outlined text-primary text-4xl">shield</span>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Welcome Back</h1>
                <p className="text-slate-500 text-sm">Sign in to access the Degxifi Staff Portal</p>
              </div>

              {/* Role Toggle */}
              <div className="flex bg-slate-50 rounded-xl p-1 mb-8 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedRole('staff')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    selectedRole === 'staff'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">person</span>
                    Staff
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    Admin
                  </span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input w-full rounded-xl bg-slate-50 border-slate-200 text-slate-900 pl-11 pr-4 py-3 transition-all placeholder:text-slate-600"
                      placeholder="you@degxifi.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-600">Password</label>
                    <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input w-full rounded-xl bg-slate-50 border-slate-200 text-slate-900 pl-11 pr-12 py-3 transition-all placeholder:text-slate-600"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input className="rounded border-slate-200 bg-slate-50 text-primary focus:ring-primary focus:ring-offset-0" type="checkbox" />
                    <span className="text-sm text-slate-500">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary text-white font-black text-base rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Notice */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm text-primary/50">lock</span>
              <span>256-bit encrypted connection &bull; SOC2 Type II Compliant</span>
            </div>

            {/* Footer Links */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <span className="text-primary/30">&bull;</span>
              <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
              <span className="text-primary/30">&bull;</span>
              <a className="hover:text-primary transition-colors" href="#">Security</a>
            </div>
          </div>
        </main>

        {/* Bottom Bar */}
        <footer className="py-6 text-center">
          <p className="text-slate-600 text-xs">© 2025 Degxifi Protocol. All internal communications are monitored and encrypted.</p>
        </footer>
      </div>
    </div>
  );
}
