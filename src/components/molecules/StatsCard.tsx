import React from 'react';
import { cn } from '@/lib/utils';
import { Card, MetricState } from '@/components/atoms';

interface StatsCardProps {
  title: string;
  value: string | number;
  state?: 'loading' | 'empty' | 'error' | 'value';
  emptyMessage?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  state = 'value',
  emptyMessage,
  className
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card 
      className={cn(
        'bg-white/5 rounded-lg p-3 border border-white/10',
        className
      )}
    >
      {state === 'value' ? (
        <div className="text-lg font-bold text-white">
          {formatValue(value)}
        </div>
      ) : (
        <MetricState 
          state={state} 
          value={value}
          label={state === 'empty' ? (emptyMessage || 'No data yet') : undefined}
        />
      )}
      <div className="text-white/60 text-xs">{title}</div>
    </Card>
  );
};