'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!user || !user.isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background-light">
      <Header role="admin" />
      <main className="flex-1">
        {children}
      </main>
      <footer className="mt-auto py-6 px-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">© 2025 Degxifi Protocol. All system actions are cryptographically logged.</p>
        <div className="flex items-center gap-6">
          <a className="text-xs text-slate-500 hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs text-slate-500 hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-xs text-slate-500 hover:text-primary transition-colors" href="#">Security Audit</a>
        </div>
      </footer>
    </div>
  );
}
