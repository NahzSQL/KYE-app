'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Sidebar';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
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

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background-light">
      <Header role="staff" />
      <main className="flex-1">
        {children}
      </main>
      <footer className="mt-auto border-t border-slate-200 py-6 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">© 2025 Degxifi Protocol. All internal verification data is encrypted.</p>
          <div className="flex gap-6">
            <a className="text-slate-500 hover:text-primary text-xs transition-colors" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-primary text-xs transition-colors" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
