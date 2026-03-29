// src/components/layout/SideNav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, ArrowRightLeft, Shield, Search, Menu, X } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
      {/* Shows only on small screens, hides on medium (md) and up */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <span className="font-black tracking-tighter text-xl">
          FF<span className="text-blue-400">BL</span>
        </span>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-slate-800 rounded">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY MENU --- */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-slate-900 z-40 flex flex-col p-4 border-t border-slate-800">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)} // Close menu when clicked
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
      {/* Hides on small screens, shows as a fixed sidebar on medium (md) and up */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <span className="font-black tracking-tighter text-2xl text-white">
            FF<span className="text-blue-400">BL</span>
          </span>
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

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          v1.0.4 - 2026 Season
        </div>
      </aside>
    </>
  );
}