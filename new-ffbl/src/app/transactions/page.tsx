import { Suspense } from 'react';
import TransactionWire from '@/components/transactions/TransactionWire';

export default function TransactionsPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4"> 
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">League Wire</h1>
        <p className="text-slate-500">
          The complete, searchable history of every transaction in the FFBL.
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-10 text-slate-500">Loading wire...</div>}>
        <TransactionWire />
      </Suspense>
    </div>
  );
}