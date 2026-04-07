// src/app/teams/[id]/edit/page.tsx
"use client";

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Shield, Sprout } from 'lucide-react';
import LogoUploadWidget from '@/components/ui/LogoUploadWidget';

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // 🌟 Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const teamId = resolvedParams.teamId;

  const [team, setTeam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Form State ---
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [aaaName, setAaaName] = useState('');
  const [aaaLogo, setAaaLogo] = useState<string | null>(null);
  
  const [aaName, setAaName] = useState('');
  const [aaLogo, setAaLogo] = useState<string | null>(null);
  
  const [aName, setAName] = useState('');
  const [aLogo, setALogo] = useState<string | null>(null);

  // Fetch the current team data
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`/api/teams`);
        if (res.ok) {
          const data = await res.json();
          const currentTeam = data.find((t: any) => t.id === teamId); // Use unwrapped ID
          
          if (currentTeam) {
            setTeam(currentTeam);
            setName(currentTeam.name || '');
            setLogoUrl(currentTeam.logoUrl || null);
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
    fetchTeam();
  }, [teamId]); // Use unwrapped ID in dependency array

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/teams/${teamId}`, { // Use unwrapped ID
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, logoUrl,
          aaaAffiliateName: aaaName, aaaLogoUrl: aaaLogo,
          aaAffiliateName: aaName, aaLogoUrl: aaLogo,
          aAffiliateName: aName, aLogoUrl: aLogo
        }),
      });

      if (res.ok) {
        router.push(`/teams/${teamId}`); // Use unwrapped ID
        router.refresh();
      } else {
        alert("Failed to save changes.");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
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
          <p className="text-slate-500 font-medium">Manage team branding and farm system identity.</p>
        </div>
      </div>

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

        {/* Action Bar */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-sm disabled:opacity-70"
          >
            {isSaving ? (
              <><Loader2 className="animate-spin" size={18} /> Saving...</>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}