'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Scale, Inbox, LogOut, Settings } from 'lucide-react';
import { auth } from '@/lib/api';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    if (!auth.getToken()) {
      router.replace('/login');
      return;
    }
    setAdmin(auth.getAdmin());
    const onUpdate = (e) => setAdmin(e.detail);
    window.addEventListener('admin-updated', onUpdate);
    return () => window.removeEventListener('admin-updated', onUpdate);
  }, [router, pathname]);

  const logout = () => {
    auth.clear();
    router.replace('/login');
  };

  if (!admin) return <div className="boot" aria-busy="true" />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__mark" aria-hidden="true">
            <Scale size={20} strokeWidth={1.75} />
          </span>
          <div>
            <strong>Admin</strong>
            <small>Consultation requests</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          <Link href="/" className={pathname === '/' || pathname.startsWith('/leads') ? 'active' : ''}>
            <Inbox size={18} strokeWidth={1.75} aria-hidden="true" /> Requests
          </Link>
          <Link href="/settings" className={pathname.startsWith('/settings') ? 'active' : ''}>
            <Settings size={18} strokeWidth={1.75} aria-hidden="true" /> Settings
          </Link>
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__user">
            <strong>{admin.name}</strong>
            <small dir="ltr">{admin.email}</small>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
