// src/components/admin/DraftOrderManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Gavel, Save, GripVertical } from "lucide-react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sub-component for individual draggable rows ---
function SortableTeamRow({ team, pickNumber }: { team: any, pickNumber: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: team.teamId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-4 p-3 bg-white border rounded-xl shadow-sm transition-colors ${isDragging ? 'border-blue-500 shadow-md opacity-90' : 'border-slate-200 hover:border-slate-300'}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-blue-600 transition-colors"
      >
        <GripVertical size={18} />
      </div>
      <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 text-slate-500 font-black text-sm">
        {pickNumber}
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-900">{team.teamName}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Regular Season: Rank {team.rank}
        </p>
      </div>
    </div>
  );
}

// --- Main Manager Component ---
export default function DraftOrderManager() {
  const [targetDraftYear, setTargetDraftYear] = useState<number>(new Date().getFullYear() + 1);
  const [standingsYear, setStandingsYear] = useState<number>(new Date().getFullYear());
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json();
        const activeYear = settingsData.currentSeason || new Date().getFullYear();
        
        // Standings are from the active year (e.g., 2026), but we are drafting for the next year (2027)
        setStandingsYear(activeYear);
        setTargetDraftYear(activeYear + 1);

        const standingsRes = await fetch("/api/admin/standings");
        const standingsData = await standingsRes.json();
        
        if (standingsData.standings) {
          // Sort teams by rank DESCENDING (Worst team first = Pick 1)
          const reverseStandings = [...standingsData.standings].sort((a, b) => b.rank - a.rank);
          setTeams(reverseStandings);
        }
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setTeams((items) => {
        const oldIndex = items.findIndex((i) => i.teamId === active.id);
        const newIndex = items.findIndex((i) => i.teamId === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      const orderedTeamIds = teams.map(t => t.teamId);
      
      const res = await fetch('/api/admin/draft-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: targetDraftYear, orderedTeamIds }),
      });

      if (res.ok) {
        alert(`Draft order for the ${targetDraftYear} Draft successfully locked in!`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update draft order.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Gavel size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight">Draft Order</h2>
          </div>
        </div>
        
        {/* NEW: Explicit Draft Year Target */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Draft:</label>
          <input 
            type="number" 
            value={targetDraftYear} 
            onChange={(e) => setTargetDraftYear(parseInt(e.target.value))}
            className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="p-6 bg-slate-50/50">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={teams.map(t => t.teamId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {teams.map((team, idx) => (
                <SortableTeamRow key={team.teamId} team={team} pickNumber={idx + 1} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button 
          onClick={handleSaveOrder}
          disabled={loading || teams.length === 0}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {loading ? "Processing all 5 rounds..." : `Lock In ${targetDraftYear} Draft Order`}
        </button>
      </div>
    </div>
  );
}