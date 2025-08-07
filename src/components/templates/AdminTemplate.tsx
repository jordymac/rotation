import React from 'react';
import { cn } from '@/lib/utils';
import { H1, P, Button } from '@/components/atoms';
import { StoreManagement } from '@/components/organisms';
import { PageLayout } from './PageLayout';

interface AdminTemplateProps {
  className?: string;
}

export const AdminTemplate: React.FC<AdminTemplateProps> = ({
  className
}) => {
  return (
    <PageLayout className={className}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-white/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <H1 className="text-3xl font-bold">Admin Dashboard</H1>
                <P className="text-white/70 mt-1">Manage stores and monitor the platform</P>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Home
                </Button>
                <Button
                  onClick={() => window.location.href = '/feed'}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Feed
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Store Management - Admin Overview */}
          <StoreManagement />
        </div>
      </div>
    </PageLayout>
  );
};