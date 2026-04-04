// src/components/players/AddPlayerMenu.tsx
"use client";

import { useState } from 'react';
import { ChevronDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface AddPlayerMenuProps {
  onAdd: (level: string) => void;
  isAdding: boolean;
}

export default function AddPlayerMenu({ onAdd, isAdding }: AddPlayerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex-1">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={isAdding}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
      >
        {isAdding ? 'Adding...' : 'Add'}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          {/* Menu pops UP instead of down so it doesn't get cut off by the bottom of the screen */}
          <div className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 border-b border-slate-100">
              Select Level
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onAdd('MLB'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
              <ArrowUpCircle size={14} className="text-green-500" /> MLB
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onAdd('AAA'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
              <ArrowUpCircle size={14} className="text-orange-500" /> AAA
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onAdd('AA'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
              <ArrowUpCircle size={14} className="text-orange-500" /> AA
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onAdd('A'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
              <ArrowUpCircle size={14} className="text-orange-500" /> A
            </button>
          </div>
        </>
      )}
    </div>
  );
}