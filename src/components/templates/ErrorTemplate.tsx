import React from 'react';
import { cn } from '@/lib/utils';
import { H1, H2, P, Button } from '@/components/atoms';
import { PageLayout } from './PageLayout';

interface ErrorTemplateProps {
  title?: string;
  message?: string;
  statusCode?: number;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const ErrorTemplate: React.FC<ErrorTemplateProps> = ({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again later.",
  statusCode,
  onRetry,
  onGoHome,
  className
}) => {
  return (
    <PageLayout className={className}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-4xl">⚠️</span>
            </div>
            
            {statusCode && (
              <div className="text-white/40 text-6xl font-bold mb-4">
                {statusCode}
              </div>
            )}
          </div>

          {/* Error Content */}
          <div className="mb-8">
            <H1 className="text-white text-3xl mb-4">
              {title}
            </H1>
            
            <P className="text-white/70 text-lg max-w-xl mx-auto leading-relaxed mt-0">
              {message}
            </P>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {onRetry && (
              <Button
                onClick={onRetry}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Try Again
              </Button>
            )}
            
            <Button
              onClick={onGoHome || (() => window.location.href = '/')}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-8 py-3"
            >
              Go Home
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <H2 className="text-white text-lg mb-3 border-0 pb-0">
              Need Help?
            </H2>
            <P className="text-white/60 text-sm mt-0">
              If this problem persists, please contact support or try refreshing the page.
            </P>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};