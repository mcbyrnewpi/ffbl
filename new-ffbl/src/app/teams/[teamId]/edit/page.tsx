// src/app/teams/[teamId]/edit/page.tsx
"use client";

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Shield, Sprout, Quote, Users, Mail, Crown, Send, UserMinus } from 'lucide-react';
import LogoUploadWidget from '@/components/ui/LogoUploadWidget';
import { useSession } from 'next-auth/react';

export default function EditTeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  
  const resolvedParams = use(params);
  const teamId = resolvedParams.teamId;

  const [team, setTeam] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Branding Form State ---
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [motto, setMotto] = useState(''); 
  
  const [aaaName, setAaaName] = useState('');
  const [aaaLogo, setAaaLogo] = useState<string | null>(null);
  const [aaName, setAaName] = useState('');
  const [aaLogo, setAaLogo] = useState<string | null>(null);
  const [aName, setAName] = useState('');
  const [aLogo, setALogo] = useState<string | null>(null);

  // --- Invite Form State ---
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams`);
      if (res.ok) {
        const data = await res.json();
        const currentTeam = data.find((t: any) => t.id === teamId);
        
        if (currentTeam) {
          setTeam(currentTeam);
          setManagers(currentTeam.managers || []);
          setName(currentTeam.name || '');
          setLogoUrl(currentTeam.logoUrl || null);
          setMotto(currentTeam.motto || ''); 
          setAaaName(currentTeam.aaaAffiliateName || '');
          setAaaLogo(currentTeam.aaaLogoUrl || null);
          setAaName(currentTeam.aaAffiliateName || '');
          setAaLogo(currentTeam.aaLogoUrl || null);
          setAName(currentTeam.aAffiliateName || '');
          setALogo(currentTeam.aLogoUrl || null);
        }
      }
    } catch (error) {
      console.error("Failed to load team data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, logoUrl, motto, 
          aaaAffiliateName: aaaName, aaaLogoUrl: aaaLogo,
          aaAffiliateName: aaName, aaLogoUrl: aaLogo,
          aAffiliateName: aName, aLogoUrl: aLogo
        }),
      });

      if (res.ok) {
        router.push(`/teams/${teamId}`);
        router.refresh();
      } else {
        const errData = await res.json();
        alert(`Failed to save: ${errData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    setInviteMessage(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });

      const data = await res.json();

      if (res.ok) {
        setInviteMessage({ text: 'Invitation sent successfully!', type: 'success' });
        setInviteEmail('');
        setInviteName('');
        fetchTeam(); // Refresh the managers list
      } else {
        setInviteMessage({ text: data.error || 'Failed to send invite.', type: 'error' });
      }
    } catch (error) {
      setInviteMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!team) return <div className="text-center py-12 text-slate-500">Team not found.</div>;

  const isPrimaryOrCommish = currentUser?.role === 'COMMISH' || currentUser?.role === 'ADMIN' || (currentUser?.teamId === teamId && currentUser?.isPrimaryManager);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-200 bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Franchise Settings</h1>
          <p className="text-slate-500 font-medium">Manage team branding and front office personnel.</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* BRANDING FORM */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* MAJOR LEAGUE BRANDING */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="text-blue-600" size={20} /> Major League Identity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-50 p-6 rounded-xl border border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Official Logo</span>
                <LogoUploadWidget currentLogoUrl={logoUrl} onUploadSuccess={setLogoUrl} />
              </div>

              <div className="md:col-span-2 space-y-5 flex flex-col justify-center">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Franchise Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                    placeholder="e.g., Norfolk Nighthawks"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    <Quote size={12} /> Franchise Motto (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                    placeholder="e.g., Blood, Sweat, and Tears"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MINOR LEAGUE BRANDING */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sprout className="text-green-600" size={20} /> Minor League Affiliates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* AAA AFFILIATE */}
              <div className="flex flex-col bg-slate-50 p-5 rounded-xl border border-slate-100 relative">
                <div className="absolute top-3 right-3 bg-blue-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">AAA</div>
                <div className="flex justify-center mb-6 mt-4">
                  <LogoUploadWidget currentLogoUrl={aaaLogo} onUploadSuccess={setAaaLogo} />
                </div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Affiliate Name</label>
                <input 
                  type="text" 
                  value={aaaName}
                  onChange={(e) => setAaaName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                  placeholder="e.g., Tides"
                />
              </div>

              {/* AA AFFILIATE */}
              <div className="flex flex-col bg-slate-50 p-5 rounded-xl border border-slate-100 relative">
                <div className="absolute top-3 right-3 bg-blue-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">AA</div>
                <div className="flex justify-center mb-6 mt-4">
                  <LogoUploadWidget currentLogoUrl={aaLogo} onUploadSuccess={setAaLogo} />
                </div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Affiliate Name</label>
                <input 
                  type="text" 
                  value={aaName}
                  onChange={(e) => setAaName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                  placeholder="e.g., Baysox"
                />
              </div>

              {/* A AFFILIATE */}
              <div className="flex flex-col bg-slate-50 p-5 rounded-xl border border-slate-100 relative">
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">A</div>
                <div className="flex justify-center mb-6 mt-4">
                  <LogoUploadWidget currentLogoUrl={aLogo} onUploadSuccess={setALogo} />
                </div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Affiliate Name</label>
                <input 
                  type="text" 
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                  placeholder="e.g., Shorebirds"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-2 pb-6 border-b border-slate-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-sm disabled:opacity-70"
            >
              {isSaving ? (
                <><Loader2 className="animate-spin" size={18} /> Saving...</>
              ) : (
                <><Save size={18} /> Save Settings</>
              )}
            </button>
          </div>
        </form>

        {/* --- FRONT OFFICE MANAGEMENT --- */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="text-indigo-600" size={20} /> Front Office Personnel
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Current Managers List */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Managers</h3>
              <div className="space-y-3">
                {managers.map((manager: any) => (
                  <div key={manager.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center shrink-0">
                        {manager.name?.substring(0, 2).toUpperCase() || 'M'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 flex items-center gap-2 truncate">
                          {manager.name || 'Unnamed Manager'}
                          {manager.isPrimaryManager && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" title="Primary Manager">
                              <Crown size={10} /> Primary
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold truncate">{manager.email}</p>
                      </div>
                    </div>

                    {/* Admin/Manager Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      
                      {/* 🌟 TOGGLE PRIMARY MANAGER BUTTON */}
                      {(isPrimaryOrCommish && manager.id !== currentUser?.id) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const actionText = manager.isPrimaryManager ? 'Revoke Primary status from' : 'Grant Primary status to';
                            if (!confirm(`${actionText} ${manager.name}? Primary managers must explicitly approve all trades.`)) return;
                            try {
                              const res = await fetch(`/api/users/${manager.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'TOGGLE_PRIMARY' })
                              });
                              if (res.ok) fetchTeam();
                              else alert("Failed to update primary manager.");
                            } catch (e) { alert("Error updating manager."); }
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            manager.isPrimaryManager 
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title="Toggle Primary Manager Status"
                        >
                          <Crown size={16} />
                        </button>
                      )}

                      {/* Remove from Franchise Button */}
                      {(isPrimaryOrCommish && manager.id !== currentUser?.id) && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Remove ${manager.name} from the franchise? They will lose Front Office access but keep their account.`)) return;
                            try {
                              const res = await fetch(`/api/users/${manager.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'REMOVE_FROM_TEAM' })
                              });
                              if (res.ok) fetchTeam();
                              else alert("Failed to remove manager.");
                            } catch (e) { alert("Error removing manager."); }
                          }}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Remove from Franchise"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                      
                      {/* Commish Only Delete Button */}
                      {(currentUser?.role === 'COMMISH' || currentUser?.role === 'ADMIN') && manager.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`WARNING: Permanently delete ${manager.name}'s account from the database? This cannot be undone.`)) return;
                            try {
                              const res = await fetch(`/api/users/${manager.id}`, { method: 'DELETE' });
                              if (res.ok) fetchTeam();
                              else alert("Failed to delete user.");
                            } catch (e) { alert("Error deleting user."); }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Permanently Delete Account"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Form (Only visible to Primary Manager or Commish) */}
            {isPrimaryOrCommish ? (
              <div className="bg-indigo-50/50 p-5 sm:p-6 rounded-xl border border-indigo-100/50">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 mb-4 flex items-center gap-2">
                  <Mail size={14} className="text-indigo-500" /> Send Co-Manager Invite
                </h3>
                
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="e.g., Theo Epstein"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="theo@cubs.com"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm disabled:opacity-70 text-sm"
                  >
                    {isInviting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} 
                    Send Invitation
                  </button>

                  {inviteMessage && (
                    <div className={`p-3 rounded-lg text-xs font-bold text-center ${
                      inviteMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {inviteMessage.text}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 border-dashed rounded-xl p-8 text-center">
                 <Shield className="text-slate-300 mb-3" size={32} />
                 <p className="text-sm font-bold text-slate-600">Restricted Access</p>
                 <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Only the Primary Manager can invite front office personnel.</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}