// src/components/team/CollapsibleSection.tsx
"use client";

import { useState } from 'react';

interface Props {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, count, defaultOpen = true, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8">
      {/* ⬅️ The clickable header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          {count !== undefined && (
            <span className="bg-white text-slate-600 text-xs font-bold px-2 py-1 rounded-md border border-slate-200 shadow-sm">
              {count}
            </span>
          )}
        </div>
        
        {/* The rotating chevron arrow */}
        <div className={`text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>
      
      {/* ⬅️ The toggleable content */}
      {isOpen && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}