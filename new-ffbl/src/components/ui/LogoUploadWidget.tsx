// src/components/ui/LogoUploadWidget.tsx
"use client";

import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { UploadCloud, Shield, Library } from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';

interface LogoUploadWidgetProps {
  currentLogoUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export default function LogoUploadWidget({ currentLogoUrl, onUploadSuccess }: LogoUploadWidgetProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <>
      <CldUploadWidget 
        uploadPreset="ffbl_website_upload"
        onSuccess={(result: any) => {
          if (result.info?.secure_url) {
            onUploadSuccess(result.info.secure_url);
          }
        }}
        options={{
          maxFiles: 1,
          resourceType: 'image',
          clientAllowedFormats: ['png', 'jpeg', 'jpg', 'svg', 'webp'],
          sources: ['local', 'url', 'camera'], 
          styles: {
              palette: {
                  window: '#ffffff',
                  windowBorder: '#90a0b3',
                  tabIcon: '#2563eb',
                  menuIcons: '#5a616a',
                  textDark: '#000000',
                  textLight: '#ffffff',
                  link: '#2563eb',
                  action: '#2563eb',
                  inactiveTabIcon: '#0e2f5a',
                  error: '#f44235',
                  inProgress: '#2563eb',
                  complete: '#20b2aa',
                  sourceBg: '#f4f1ea'
              }
          }
        }}
      >
        {({ open }) => {
          return (
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Logo Preview Circle */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden shadow-sm">
                {currentLogoUrl ? (
                  <img src={currentLogoUrl} alt="Team Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Shield size={32} className="text-slate-300" />
                )}
              </div>
              
              {/* ACTION BUTTONS (Upload OR Browse) */}
              <div className="flex flex-col gap-2 w-full max-w-[160px]">
                <button 
                  onClick={() => setIsLibraryOpen(true)}
                  type="button" 
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs font-black text-blue-700 hover:bg-blue-600 hover:text-white transition-colors shadow-sm tracking-wide uppercase"
                >
                  <Library size={14} />
                  Browse Library
                </button>

                <button 
                  onClick={() => open()}
                  type="button" 
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <UploadCloud size={14} />
                  Upload New
                </button>
              </div>
            </div>
          );
        }}
      </CldUploadWidget>

      {/* THE FFBL MEDIA LIBRARY MODAL */}
      <MediaLibraryModal 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        onSelect={onUploadSuccess} 
      />
    </>
  );
}