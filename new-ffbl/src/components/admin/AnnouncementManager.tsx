"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Send, Loader2, Mail, Pin } from "lucide-react";

export default function AnnouncementManager() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      content: formData.get("content"),
      isPinned: formData.get("isPinned") === "on",
      sendEmail: formData.get("sendEmail") === "on",
    };

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        await fetchAnnouncements();
        router.refresh();
        alert(payload.sendEmail ? "Announcement posted and emails sent!" : "Announcement posted!");
      } else {
        alert("Failed to post announcement.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* 📢 The Composer */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <Megaphone size={18} className="text-blue-500" />
          <h2 className="font-black text-slate-900 uppercase tracking-tight">Post League Update</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Subject / Title</label>
            <input 
              type="text" 
              name="title" 
              required 
              placeholder="e.g., Trade Deadline Approaching!"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Message Body</label>
            <textarea 
              name="content" 
              required 
              rows={5}
              placeholder="Draft your league-wide message here..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
            />
          </div>

          {/* Options Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-colors hover:bg-blue-100">
                <input type="checkbox" name="sendEmail" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <Mail size={14} className="text-blue-600" />
                <span className="text-[10px] font-black uppercase text-blue-700 tracking-widest">Blast Emails</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition-colors hover:bg-slate-100">
                <input type="checkbox" name="isPinned" className="w-4 h-4 text-slate-600 rounded border-slate-300 focus:ring-slate-500" />
                <Pin size={14} className="text-slate-600" />
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Pin to Top</span>
              </label>
            </div>

            <button 
              type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              {loading ? "Broadcasting..." : "Post Announcement"}
            </button>
          </div>
        </div>
      </form>

      {/* 🗃️ Broadcast Ledger */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">Recent Broadcasts</h3>
        {announcements.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-sm font-bold text-slate-400">
            No announcements have been posted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div 
                key={ann.id} 
                className={`p-5 rounded-xl border flex flex-col gap-2 shadow-sm ${
                  ann.isPinned ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {ann.isPinned && <Pin size={12} className="text-amber-500 fill-amber-500" />}
                      <h4 className="font-black text-slate-900 text-lg leading-tight">{ann.title}</h4>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Posted by {ann.author?.name || 'Commissioner'} • {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}