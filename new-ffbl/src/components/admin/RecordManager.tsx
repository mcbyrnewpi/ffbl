"use client";

import { useState, useEffect } from "react";
import { Medal, Save, Trash2, Edit2, PlusCircle, Loader2 } from "lucide-react";

type RecordType = "TEAM" | "INDIVIDUAL";

interface LeagueRecord {
  id: string;
  type: RecordType;
  title: string;
  value: string;
  yearSet: number | null;
  recordHolder: string;
}

export default function RecordManager() {
  const [records, setRecords] = useState<LeagueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState<RecordType>("TEAM");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [yearSet, setYearSet] = useState("");
  const [recordHolder, setRecordHolder] = useState("");

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/records");
      const data = await res.json();
      setRecords(data);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleEdit = (rec: LeagueRecord) => {
    setEditId(rec.id);
    setType(rec.type);
    setTitle(rec.title);
    setValue(rec.value);
    setYearSet(rec.yearSet ? rec.yearSet.toString() : "");
    setRecordHolder(rec.recordHolder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setType("TEAM");
    setTitle("");
    setValue("");
    setYearSet("");
    setRecordHolder("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = { id: editId, type, title, value, yearSet: yearSet || null, recordHolder };
    const method = editId ? "PATCH" : "POST";

    try {
      const res = await fetch("/api/records", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchRecords();
        handleCancelEdit();
      } else {
        alert("Failed to save record.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`/api/records?id=${id}`, { method: "DELETE" });
      await fetchRecords();
    } catch {
      alert("Failed to delete record.");
    }
  };

  if (fetching) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" /></div>;

  const teamRecords = records.filter(r => r.type === "TEAM");
  const individualRecords = records.filter(r => r.type === "INDIVIDUAL");

  const RecordTable = ({ title, data }: { title: string, data: LeagueRecord[] }) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-black text-slate-900 tracking-tight">
        {title} ({data.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-200 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 font-bold">Stat</th>
              <th className="px-4 py-3 font-bold">Value</th>
              <th className="px-4 py-3 font-bold">Holder</th>
              <th className="px-4 py-3 font-bold">Year</th>
              <th className="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(rec => (
              <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-900">{rec.title}</td>
                <td className="px-4 py-3 font-black text-blue-600">{rec.value}</td>
                <td className="px-4 py-3 text-slate-600">{rec.recordHolder}</td>
                <td className="px-4 py-3 text-slate-500">{rec.yearSet || "All-Time"}</td>
                <td className="px-4 py-3 flex justify-end gap-2">
                  <button onClick={() => handleEdit(rec)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(rec.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 📝 Editor Form */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${editId ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-6">
          <Medal className={editId ? "text-amber-500" : "text-blue-500"} size={20} />
          <h3 className="text-lg font-black text-slate-900">{editId ? "Edit Existing Record" : "Log a New Record"}</h3>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Record Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as RecordType)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
              <option value="TEAM">Team Record</option>
              <option value="INDIVIDUAL">Individual Record</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Stat Category (e.g. Home Runs)</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Value (e.g. 65 or 0.00 (18 IP))</label>
            <input type="text" required value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Year Set (Optional)</label>
            <input type="number" value={yearSet} onChange={(e) => setYearSet(e.target.value)} placeholder="e.g. 2024" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Record Holder (Player / Team Name)</label>
            <input type="text" required value={recordHolder} onChange={(e) => setRecordHolder(e.target.value)} placeholder="e.g. Carlos Beltran (Nixon's Nasty Ninjas)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>

          <div className="md:col-span-2 flex gap-3 mt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
              {loading ? <Loader2 className="animate-spin" size={16} /> : (editId ? <Save size={16} /> : <PlusCircle size={16} />)}
              {editId ? "Update Record" : "Add to Record Books"}
            </button>
            {editId && (
              <button type="button" onClick={handleCancelEdit} className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition-all shadow-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 🗃️ Current Records Lists */}
      <div>
        <RecordTable title="Team Records" data={teamRecords} />
        <RecordTable title="Individual Records" data={individualRecords} />
      </div>
    </div>
  );
}