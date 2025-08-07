import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, ExclamationTriangleIcon, MusicalNoteIcon } from './Icons';

interface TrackStatusProps {
  status: 'pending' | 'matched' | 'approved' | 'rejected' | 'no-match';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const TrackStatus: React.FC<TrackStatusProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckIcon className="w-full h-full" />,
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          label: 'Approved'
        };
      case 'matched':
        return {
          icon: <MusicalNoteIcon className="w-full h-full" />,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          label: 'Matched'
        };
      case 'rejected':
        return {
          icon: <ExclamationTriangleIcon className="w-full h-full" />,
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          label: 'Rejected'
        };
      case 'no-match':
        return {
          icon: <span className="text-white/40">—</span>,
          color: 'bg-white/5 text-white/40 border-white/10',
          label: 'No Match'
        };
      default: // pending
        return {
          icon: <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />,
          color: 'bg-white/10 text-white/60 border-white/20',
          label: 'Pending'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4 text-xs';
      case 'lg': return 'w-8 h-8 text-base';
      default: return 'w-6 h-6 text-sm';
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center border',
        config.color,
        getSizeClasses()
      )}>
        {config.icon}
      </div>
      {showLabel && (
        <span className={cn('font-medium', getSizeClasses(), config.color.split(' ')[1])}>
          {config.label}
        </span>
      )}
    </div>
  );
};