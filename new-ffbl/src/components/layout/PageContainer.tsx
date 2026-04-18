import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}