import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode; // For right-aligned buttons if needed
}

export default function PageHeader({ 
  title, 
  subtitle, 
  children 
}: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        {subtitle && (
          <p className="text-slate-500 text-base">{subtitle}</p>
        )}
      </div>
      
      {/* Right-aligned action buttons (like the 'Go to Team' button on the homepage) */}
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}