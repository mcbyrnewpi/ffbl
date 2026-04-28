import './globals.css';
import SideNav from '@/components/layout/SideNav';
import AuthProvider from '@/components/auth/AuthProvider';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
        
        {/* 🛡️ Wrap the app in our AuthProvider */}
        <AuthProvider>
          
          <SideNav />

          <main className="flex-1 w-full">
            {children}
          </main>

        </AuthProvider>

        {/* GA4 Component pulling from .env file */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}

      </body>
    </html>
  );
}