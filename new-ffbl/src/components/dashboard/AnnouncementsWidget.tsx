// src/components/dashboard/AnnouncementsWidget.tsx
import { prisma } from '@/lib/prisma';
import { Megaphone, Pin } from 'lucide-react';

export default async function AnnouncementsWidget() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 5,
    include: { author: true }
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Megaphone size={16} className="text-blue-600" />
        <h2 className="font-black text-slate-900 uppercase tracking-tight">League Updates</h2>
      </div>
      
      <div className="p-0 flex-1 overflow-y-auto">
        {announcements.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm font-bold italic">
            No recent announcements from the Commissioner.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((ann) => (
              <div key={ann.id} className={`p-5 ${ann.isPinned ? 'bg-amber-50/30' : 'bg-white'}`}>
                <div className="flex items-start gap-2 mb-1">
                  {ann.isPinned && <Pin size={12} className="text-amber-500 fill-amber-500 mt-1 shrink-0" />}
                  <h3 className="font-black text-slate-900 leading-tight text-lg">{ann.title}</h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-[20px]">
                  {ann.author?.name || 'Commissioner'} • {new Date(ann.createdAt).toLocaleDateString()}
                </p>
                <div className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed pl-[20px]">
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