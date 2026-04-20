// src/components/ui/MediaLibraryModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect }: Props) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/admin/media')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setImages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-blue-600" size={20} />
            <h2 className="font-black text-slate-900 tracking-tight uppercase">FFBL Media Library</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-slate-100/50">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">No historic media found.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    onSelect(img.url);
                    onClose();
                  }}
                  className="relative group aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:ring-4 hover:ring-blue-500 transition-all focus:outline-none"
                >
                  <img src={img.url} alt="FFBL Media" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white text-blue-600 text-[10px] font-black px-2 py-1 rounded shadow uppercase tracking-widest">Select</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}