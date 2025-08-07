import React from 'react';
import { cn } from '@/lib/utils';
import { H2, P } from '@/components/atoms';
import { PageLayout } from './PageLayout';

interface LoadingTemplateProps {
  message?: string;
  subtitle?: string;
  showSpinner?: boolean;
  className?: string;
}

export const LoadingTemplate: React.FC<LoadingTemplateProps> = ({
  message = "Loading...",
  subtitle,
  showSpinner = true,
  className
}) => {
  return (
    <PageLayout showFooter={false} className={className}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          {/* Loading Animation */}
          {showSpinner && (
            <div className="mb-8">
              <div className="relative">
                {/* Outer Ring */}
                <div className="w-16 h-16 border-4 border-white/20 rounded-full mx-auto mb-6"></div>
                
                {/* Spinning Ring */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {/* Loading Content */}
          <div>
            <H2 className="text-white text-2xl mb-3 border-0 pb-0">
              {message}
            </H2>
            
            {subtitle && (
              <P className="text-white/70 text-base leading-relaxed mt-0">
                {subtitle}
              </P>
            )}
          </div>

          {/* Loading Dots Animation */}
          <div className="flex justify-center gap-1 mt-8">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};