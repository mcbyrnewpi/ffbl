"use client";
import { useState } from 'react';
import InductHofModal from '@/components/teams/InductHofModal';

export default function ClientHofWrapper({ teamId }: { teamId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-amber-300 shadow-sm"
      >
        + Induct Player
      </button>
      <InductHofModal teamId={teamId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}