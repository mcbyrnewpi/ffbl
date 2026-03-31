'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, ArrowRightLeft, Shield, Search, Menu, X, LogOut, LogIn } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { useSession, signIn, signOut } from 'next-auth/react'; // ⬅️ NEW IMPORTS

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession(); // ⬅️ GET SESSION

  const navLinks = [
    { href: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/players', icon: <Search size={18} />, label: 'Player Search' },
    { href: '/trades', icon: <ArrowRightLeft size={18} />, label: 'Trade Center' },
    { href: '/teams', icon: <Shield size={18} />, label: 'Franchises' },
    { href: '/league', icon: <Users size={18} />, label: 'League Info' },
  ];

  return (
    <>
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <span className="font-black tracking-tighter text-xl">
          FF<span className="text-blue-400">BL</span>
        </span>
        
        <div className="flex items-center gap-2">
          <GlobalSearch variant="icon" />
          <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- MOBILE OVERLAY MENU --- */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-slate-900 z-40 flex flex-col p-4 border-t border-slate-800">
          <nav className="flex flex-col gap-2 flex-grow">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  pathname === link.href ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <span className="font-black tracking-tighter text-2xl text-white">
            FF<span className="text-blue-400">BL</span>
          </span>
        </div>

        <div className="px-4 mb-6">
          <GlobalSearch variant="full" />
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                pathname === link.href ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>

        {/* 🔐 USER PROFILE BOTTOM BAR */}
        <div className="p-4 border-t border-slate-800">
          {status === 'loading' ? (
             <div className="text-xs text-slate-500 animate-pulse">Loading session...</div>
          ) : session ? (
            <div className="flex flex-col gap-1">
              <div className="text-xs font-bold text-white truncate" title={session.user.name || session.user.email}>
                {session.user.name || session.user.email}
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-2">
                {(session.user as any).role || 'OWNER'}
              </div>
              <button 
                onClick={() => signOut()} 
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-fit"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  );
}