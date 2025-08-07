import React from 'react';
import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-1 scale
  classification?: 'high' | 'medium' | 'low';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  classification,
  showPercentage = true,
  size = 'md',
  className
}) => {
  const getConfidenceColor = () => {
    if (classification) {
      switch (classification) {
        case 'high': return 'bg-green-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-red-500';
      }
    }
    
    // Auto-classify based on confidence
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (classification) {
      switch (classification) {
        case 'high': return 'text-green-400';
        case 'medium': return 'text-yellow-400';
        case 'low': return 'text-red-400';
      }
    }
    
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-1 text-xs';
      case 'lg': return 'h-3 text-base';
      default: return 'h-2 text-sm';
    }
  };

  const percentage = Math.round(confidence * 100);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('bg-white/20 rounded-full overflow-hidden flex-1 min-w-16', getSizeClasses())}>
        <div 
          className={cn('h-full transition-all duration-300', getConfidenceColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className={cn('font-medium whitespace-nowrap', getTextColor(), getSizeClasses())}>
          {percentage}%
        </span>
      )}
    </div>
  );
};