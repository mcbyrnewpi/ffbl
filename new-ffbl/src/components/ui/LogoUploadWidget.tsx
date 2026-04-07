// src/components/ui/LogoUploadWidget.tsx
"use client";

import { CldUploadWidget } from 'next-cloudinary';
import { UploadCloud } from 'lucide-react';

interface LogoUploadWidgetProps {
  currentLogoUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export default function LogoUploadWidget({ currentLogoUrl, onUploadSuccess }: LogoUploadWidgetProps) {
  return (
    <CldUploadWidget 
      uploadPreset="ffbl_website_upload"
      onSuccess={(result: any) => {
        // Cloudinary returns the secure URL of the uploaded image
        if (result.info?.secure_url) {
          onUploadSuccess(result.info.secure_url);
        }
      }}
      options={{
        maxFiles: 1,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpeg', 'jpg', 'svg', 'webp'],
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
          <div className="flex flex-col items-center gap-3">
            {/* Logo Preview Circle */}
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden shadow-sm">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt="Team Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Shield size={32} className="text-slate-300" />
              )}
            </div>
            
            {/* Upload Button */}
            <button 
              onClick={() => open()}
              type="button" // Prevents accidentally submitting forms
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              <UploadCloud size={16} />
              {currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>
        );
      }}
    </CldUploadWidget>
  );
}