'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, ArrowRightLeft, Shield, Search, Menu, X, LogOut, LogIn, ShieldAlert, Activity, BookOpen } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { useSession, signIn, signOut } from 'next-auth/react';


export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession(); 

  const userRole = (session?.user as any)?.role;
  const isCommishOrAdmin = userRole === 'COMMISH' || userRole === 'ADMIN';

  const navLinks = [
    { href: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/teams', icon: <Shield size={18} />, label: 'Franchises' },
    { href: '/players', icon: <Search size={18} />, label: 'Player Search' },
    { href: '/trades', icon: <ArrowRightLeft size={18} />, label: 'Trade Center' },
    { href: '/transactions', icon: <Activity size={18} />, label: 'Transactions'},
    { href: '/history', icon: <BookOpen size={18} />, label: 'League Info' },
  ];

  return (
    <>
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden bg-white text-slate-900 p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-200">
        <Link href="/" className="font-black tracking-tighter text-xl text-slate-900 hover:opacity-80 transition-opacity">
          FF<span className="text-blue-600">BL</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <GlobalSearch variant="icon" />
          <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- MOBILE OVERLAY MENU --- */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] bg-white z-40 flex flex-col p-4 border-b border-slate-200 shadow-xl">
          <nav className="flex flex-col gap-2 flex-grow">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold ${
                  pathname === link.href ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}

            {isCommishOrAdmin && (
              <>
                <div className="h-px bg-slate-100 my-2 mx-2" />
                <Link
                  href="/admin/commish"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold ${
                    pathname === '/admin/commish' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <ShieldAlert size={18} /> Commish Center
                </Link>
              </>
            )}
          </nav>
          {/* MOBILE USER PROFILE BOTTOM BAR */}
          <div className="mt-auto pt-4 pb-2 px-4 border-t border-slate-100">
            {status === 'loading' ? (
               <div className="text-xs text-slate-400 font-bold animate-pulse">Loading...</div>
            ) : session ? (
              <div className="flex flex-col gap-1">
                <div className="text-sm font-black text-slate-900 truncate">
                  {session?.user?.name || session?.user?.email || ""}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                  {(session?.user as any)?.role || 'OWNER'}
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors w-fit"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn()} 
                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <LogIn size={16} /> Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen shrink-0 shadow-sm">
        <div className="p-6">
          <Link href="/" className="font-black tracking-tighter text-2xl text-slate-900 hover:opacity-80 transition-opacity block w-fit">
            FF<span className="text-blue-600">BL</span>
          </Link>
        </div>

        <div className="px-4 mb-6">
          <GlobalSearch variant="full" />
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-bold text-sm ${
                pathname === link.href ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}

          {isCommishOrAdmin && (
            <>
              <div className="h-px bg-slate-100 my-2 mx-2" />
              <Link
                href="/admin/commish"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-bold text-sm ${
                  pathname === '/admin/commish' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50'
                }`}
              >
                <ShieldAlert size={18} /> Commish Center
              </Link>
            </>
          )}
        </nav>

        {/* 🔐 USER PROFILE BOTTOM BAR */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {status === 'loading' ? (
             <div className="text-xs text-slate-400 font-bold animate-pulse">Loading...</div>
          ) : session ? (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-black text-slate-900 truncate" title={session?.user?.name || session?.user?.email || ""}>
                {session?.user?.name || session?.user?.email || ""}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                {(session?.user as any)?.role || 'OWNER'}
              </div>
              <button 
                onClick={() => signOut()} 
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors w-fit"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  );
}