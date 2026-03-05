'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const staffLinks = [
  { href: '/staff/dashboard', label: 'Dashboard' },
  { href: '/staff/kye-submission', label: 'KYE Submission' },
  { href: '/staff/kye-status', label: 'KYE Status' },
];

const adminLinks = [
  { href: '/admin/staff-management', label: 'Staff Management' },
  { href: '/admin/kye-review', label: 'KYE Queue' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function Header({ role }: { role: 'staff' | 'admin' }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links = role === 'admin' ? adminLinks : staffLinks;
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="border-b border-primary/20 bg-slate-50/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between px-6 lg:px-10 h-16">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">shield</span>
            </div>
            <h2 className="text-slate-900 text-xl font-black tracking-tight">
              Degxifi{' '}
              <span className="text-primary font-bold text-xs ml-2 px-2.5 py-0.5 bg-primary/10 rounded-full tracking-widest uppercase">
                {role === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? 'text-primary text-sm font-bold'
                      : 'text-slate-500 hover:text-primary transition-colors text-sm font-medium'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{user.role}</p>
                </div>
                <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                  {role === 'admin' ? (
                    <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                  ) : (
                    <span className="material-symbols-outlined text-primary">person</span>
                  )}
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-xl">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-6 py-3">
          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={
                    isActive
                      ? 'text-primary text-sm font-bold py-2'
                      : 'text-slate-500 hover:text-primary transition-colors text-sm font-medium py-2'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
