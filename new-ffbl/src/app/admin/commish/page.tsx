// src/app/admin/commish/page.tsx
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, RefreshCw, Trophy, Medal, Settings, FileText, Megaphone, Lock, Gavel, ListOrdered } from 'lucide-react';
import SeasonManager from '@/components/admin/SeasonManager';
import LeagueSettingsManager from '@/components/admin/LeagueSettingsManager';
import StandingsManager from '@/components/admin/StandingsManager'; // 🌟 NEW
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import DataSyncManager from '@/components/admin/DataSyncManager';
import DocumentManager from '@/components/admin/DocumentManager';
import RecordManager from '@/components/admin/RecordManager';
import DraftOrderManager from '@/components/admin/DraftOrderManager';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';

// 🌟 Added 'standings' to TabType
type TabType = 'announcements' | 'standings' | 'draft' | 'sync' | 'champions' | 'records' | 'settings' | 'docs';

export default function CommishCenter() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('announcements');

  if (status === "loading") {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse text-slate-400 font-bold tracking-widest uppercase text-sm">Verifying Credentials...</div>
        </div>
      </PageContainer>
    );
  }

  const userRole = (session?.user as any)?.role;
  const isCommishOrAdmin = userRole === 'COMMISH' || userRole === 'ADMIN';

  if (!isCommishOrAdmin) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner"><Lock size={32} className="text-slate-400" /></div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto text-sm">This area is restricted to League Commissioners and Administrators.</p>
        </div>
      </PageContainer>
    );
  }

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
        activeTab === id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={16} />{label}
    </button>
  );

  return (
    <PageContainer>
      <PageHeader 
        title="Commish Center"
        subtitle="League administration, historical records, and global controls."
      />

      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 no-scrollbar">
        <TabButton id="announcements" label="Announcements" icon={Megaphone} />
        <TabButton id="standings" label="Standings" icon={ListOrdered} /> {/* 🌟 NEW TAB */}
        <TabButton id="draft" label="Draft Room" icon={Gavel} />
        <TabButton id="settings" label="League Settings" icon={Settings} />
        <TabButton id="champions" label="Champions" icon={Trophy} />
        <TabButton id="records" label="Record Books" icon={Medal} />
        <TabButton id="docs" label="Documents" icon={FileText} />
        <TabButton id="sync" label="Data Sync" icon={RefreshCw} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'announcements' && <div className="max-w-3xl"><AnnouncementManager /></div>}       
        {activeTab === 'standings' && <div className="max-w-4xl"><StandingsManager /></div>}
        {activeTab === 'draft' && <div className="max-w-3xl"><DraftOrderManager /></div>}
        {activeTab === 'settings' && <div className="max-w-4xl"><LeagueSettingsManager /></div>}
        {activeTab === 'champions' && <div className="max-w-4xl"><SeasonManager /></div>}
        {activeTab === 'records' && <div className="max-w-4xl"><RecordManager /></div>}
        {activeTab === 'docs' && <div className="max-w-4xl"><DocumentManager /></div>}
        {activeTab === 'sync' && <DataSyncManager />}
      </div>
    </PageContainer>
  );
}