// src/app/transactions/page.tsx
import { Suspense } from 'react';
import TransactionWire from '@/components/transactions/TransactionWire';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';

export default function TransactionsPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="League Wire"
        subtitle="The complete, searchable history of every transaction in the FFBL."
      />

      <Suspense fallback={<div className="text-center py-10 text-slate-500 font-medium">Loading wire...</div>}>
        <TransactionWire />
      </Suspense>
    </PageContainer>
  );
}