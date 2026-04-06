// src/components/teams/SyncStatsButton.tsx
"use client";

import { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  teamId: string;
  lastStatSync: Date | null;
}

export default function SyncStatsButton({ teamId, lastStatSync }: Props) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate if the 24 hour cooldown has passed
  const hoursSince = lastStatSync ? (Date.now() - new Date(lastStatSync).getTime()) / (1000 * 60 * 60) : 24;
  const canSync = hoursSince >= 24;
  const hoursLeft = Math.ceil(24 - hoursSince);

  const handleSync = async () => {
    if (!canSync) return;
    setIsSyncing(true);
    
    try {
      const res = await fetch(`/api/teams/${teamId}/sync-stats`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        router.refresh(); // Refresh the page to show the new stats!
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to sync stats. Try again later.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!canSync) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed shadow-sm">
        <Clock size={14} className="text-slate-400" />
        Up to date (Available in {hoursLeft}h)
      </div>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm border ${
        isSyncing 
          ? 'bg-blue-100 text-blue-500 border-blue-200 cursor-not-allowed' 
          : 'bg-white text-blue-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
      {isSyncing ? "Pulling MLB Data..." : "Refresh Live Stats"}
    </button>
  );
}