// src/components/trades/TradeActionButtons.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CorrespondingMovesModal from './CorrespondingMovesModal';
import { checkNeedsCorrespondingMoves } from '@/lib/trade-utils';
import Link from 'next/link';

interface Props {
  tradeId: string;
  userId: string;
  teamId: string; 
  tradeAssets: any[]; 
  settings: any; 
  isInitiator: boolean;
  status: string;
  redirectTo?: string;
  hasApproved?: boolean;
  pendingApprovalsCount?: number;
  isDeadlinePassed?: boolean;
}

export default function TradeActionButtons({ 
  tradeId, 
  userId, 
  teamId, 
  tradeAssets, 
  settings, 
  isInitiator, 
  status, 
  redirectTo, 
  hasApproved, 
  pendingApprovalsCount,
  isDeadlinePassed = false
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (status !== 'PENDING') return null;

  // Intercept the approval click to check roster limits first
  const handleApproveClick = async () => {
    if (!window.confirm(`Are you sure you want to approve this trade?`)) return;
    
    setIsLoading(true);
    const needsMoves = await checkNeedsCorrespondingMoves(teamId, tradeAssets, settings);
    
    if (needsMoves) {
      setIsLoading(false);
      setIsModalOpen(true); // Open the modal to force drops
    } else {
      executeApproval(null); // Roster is fine, execute instantly
    }
  };

  // The actual API call to approve the trade (receives moves from the modal)
  const executeApproval = async (correspondingMoves: any) => {
    setIsModalOpen(false);
    setIsLoading(true);
    try {
      const res = await fetch('/api/trades/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, userId, correspondingMoves })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.executed) {
            alert("Trade fully approved and processed!");
        } else {
            alert("Vote recorded! Waiting on other managers.");
        }
        router.refresh(); 
        if (redirectTo) router.push(redirectTo);
      } else {
        const data = await res.json();
        alert(data.error || `Failed to approve trade: Roster limits exceeded?`);
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    const actionText = isInitiator ? 'cancel' : 'decline';
    if (!window.confirm(`Are you sure you want to ${actionText} this trade?`)) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/trades/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, userId })
      });
      
      if (res.ok) {
        router.refresh(); 
        if (redirectTo) router.push(redirectTo);
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${actionText} trade`);
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // UI for the Proposer or anyone who has already Approved
  if (isInitiator || hasApproved) {
    return (
      <div className="flex items-center gap-3">
        {pendingApprovalsCount !== undefined && pendingApprovalsCount > 0 && (
          <span className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
            Pending {pendingApprovalsCount} Approval{pendingApprovalsCount !== 1 ? 's' : ''}
          </span>
        )}
        <button 
          onClick={handleDecline} 
          disabled={isLoading}
          className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Cancelling...' : 'Cancel Trade'}
        </button>
      </div>
    );
  }

  // UI for someone who needs to respond
  return (
    <>
      <button 
        onClick={handleApproveClick}
        disabled={isLoading}
        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Approve Deal'}
      </button>
      
      <Link href={`/trades/build?counter=${tradeId}`} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center">
  Counter Offer
</Link>
      
      <button 
        onClick={handleDecline}
        disabled={isLoading} 
        className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Declining...' : 'Decline'}
      </button>

      <CorrespondingMovesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executeApproval}
        teamId={teamId}
        tradeAssets={tradeAssets}
        settings={settings}
      />
    </>
  );
}