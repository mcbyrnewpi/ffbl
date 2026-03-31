import './globals.css';
import SideNav from '@/components/layout/SideNav';
import AuthProvider from '@/components/auth/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
        
        {/* 🛡️ Wrap the app in our AuthProvider */}
        <AuthProvider>
          
          <SideNav />

          <main className="flex-1 w-full overflow-y-auto">
            {children}
          </main>

        </AuthProvider>

      </body>
    </html>
  );
}