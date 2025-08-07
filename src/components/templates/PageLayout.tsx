import React from 'react';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/organisms';

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showFooter = true,
  className
}) => {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};