import React from 'react';
import { cn } from '@/lib/utils';

interface MetricStateProps {
  state: 'loading' | 'empty' | 'error' | 'value';
  value?: number | string;
  label?: string;
  className?: string;
}

export const MetricState: React.FC<MetricStateProps> = ({
  state,
  value,
  label,
  className
}) => {
  const baseClasses = "flex items-center justify-center text-sm";
  
  switch (state) {
    case 'loading':
      return (
        <div className={cn(baseClasses, "text-white/50", className)}>
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin mr-2" />
          Loading...
        </div>
      );
    
    case 'empty':
      return (
        <div className={cn(baseClasses, "text-white/40", className)}>
          <span className="text-2xl mr-2">—</span>
          <span>{label || 'No data yet'}</span>
        </div>
      );
    
    case 'error':
      return (
        <div className={cn(baseClasses, "text-red-400", className)}>
          <span className="text-lg mr-2">⚠</span>
          Error
        </div>
      );
    
    case 'value':
      return (
        <div className={cn(baseClasses, "text-white", className)}>
          <span className="text-2xl font-bold">{value}</span>
          {label && <span className="ml-2 text-white/60">{label}</span>}
        </div>
      );
    
    default:
      return null;
  }
};