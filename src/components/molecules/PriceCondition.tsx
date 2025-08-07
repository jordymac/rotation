import React from 'react';
import { cn } from '@/lib/utils';

interface PriceConditionProps {
  condition?: string;
  sleeveCondition?: string;
  price?: string;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const PriceCondition: React.FC<PriceConditionProps> = ({
  condition,
  sleeveCondition,
  price,
  layout = 'horizontal',
  className
}) => {
  if (!price && !condition) {
    return <div className={cn('h-6', className)} />;
  }

  if (layout === 'vertical') {
    return (
      <div className={cn('', className)}>
        {condition && (
          <div className="mb-2">
            <p className="text-sm text-white/80">
              {condition}
            </p>
            {sleeveCondition && (
              <p className="text-xs text-white/60">
                Sleeve: {sleeveCondition}
              </p>
            )}
          </div>
        )}
        {price && (
          <div>
            <p className="text-base font-semibold text-green-400">
              {price}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={cn('', className)}>
      {(price || condition) && (
        <div className="flex items-center justify-between gap-2">
          {/* Condition - left side, 50% width, truncated */}
          {condition && (
            <div className="flex-1 max-w-[50%] text-sm text-white/60 truncate">
              {condition}
              {sleeveCondition && ` / ${sleeveCondition}`}
            </div>
          )}
          {/* Price - right side */}
          {price && (
            <span className="text-lg font-bold text-green-400 flex-shrink-0 text-right">
              {price}
            </span>
          )}
        </div>
      )}
    </div>
  );
};