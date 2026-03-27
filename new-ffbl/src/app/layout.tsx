import './globals.css';
import SideNav from '@/components/layout/SideNav'; // Import our new component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Notice we changed flex-row to flex-col on mobile, but md:flex-row for desktop */}
      <body className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
        
        {/* Our smart navigation handles its own mobile/desktop display logic */}
        <SideNav />

        {/* --- MAIN CONTENT --- */}
        {/* We add w-full so it doesn't get squished, and let it scroll independently */}
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}