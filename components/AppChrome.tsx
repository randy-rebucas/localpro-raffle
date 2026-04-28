'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaGift, FaHome, FaPlus, FaSignOutAlt } from 'react-icons/fa';

interface AppChromeProps {
  children: React.ReactNode;
}

interface SessionResponse {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

const authRoutes = new Set(['/login', '/signup']);

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isPublicStandaloneRoute =
    authRoutes.has(pathname) ||
    pathname === '/create' ||
    /^\/raffles\/[^/]+$/.test(pathname) ||
    /^\/raffles\/[^/]+\/(setup|draw|results)$/.test(pathname) ||
    pathname.startsWith('/share');
  const displayName = session?.user?.name || session?.user?.email || 'User';
  const email = session?.user?.email;
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (isPublicStandaloneRoute) return;

    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SessionResponse | null) => setSession(data))
      .catch(() => setSession(null));
  }, [isPublicStandaloneRoute]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isPublicStandaloneRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-sm">
                <FaGift size={15} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">Raffle Pro</h1>
            </div>

            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="hidden items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline-flex"
              >
                <FaHome size={14} />
                Home
              </Link>
              <Link
                href="/create"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <FaPlus size={12} />
                New Raffle
              </Link>
              {session?.user ? (
                <div ref={profileMenuRef} className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full px-1 py-1 transition hover:bg-slate-50"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-sm font-semibold text-purple-600">
                      {initial}
                    </span>
                    <span className="max-w-32 truncate text-sm font-medium text-slate-700">{displayName}</span>
                    <FaChevronDown className={`text-slate-500 transition ${profileOpen ? 'rotate-180' : ''}`} size={11} />
                  </button>

                  {profileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                        {email && <p className="mt-1 truncate text-xs text-slate-500">{email}</p>}
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <FaSignOutAlt size={14} />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline-flex">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="mt-9 bg-slate-950 py-7 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm text-white">
                {initial}
              </div>
              <p className="text-sm">© 2026 Raffle Pro. Fair, random, transparent.</p>
            </div>
            <p className="text-sm">Built with Next.js & Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </>
  );
}
