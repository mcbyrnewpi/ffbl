// src/components/players/PlayerCardModal.tsx
"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';
import BaseballCard from './BaseballCard';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
}

export default function PlayerCardModal({ isOpen, onClose, player }: PlayerCardModalProps) {
  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !player) return null;

  return (
    <div 
      /* Change 1: Use 'overflow-y-auto' on the backdrop so the whole modal area can scroll.
         Change 2: Use 'items-start' instead of 'items-center' to prevent the top from clipping.
      */
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose} 
    >
      <div className="flex items-start justify-center min-h-screen py-12 px-4 sm:py-20">
        {/* Change 3: Removed 'max-h-[90vh]' so the card can take its full natural 3.5:2.5 aspect ratio height.
        */}
        <div 
          className="relative w-full max-w-sm animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()} 
        >
          {/* Close Button: Slightly repositioned for better visibility against dark backgrounds */}
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 md:-right-12 md:top-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors z-50 border border-white/20"
            title="Close"
          >
            <X size={20} />
          </button>

          {/* The 3D Baseball Card */}
          <div className="w-full drop-shadow-2xl">
            <BaseballCard player={player} />
          </div>
        </div>
      </div>
    </div>
  );
}