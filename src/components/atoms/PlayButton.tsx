import React from 'react';
import { cn } from '@/lib/utils';
import { PlayIcon, PauseIcon } from './Icons';

interface PlayButtonProps {
  isPlaying?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'ghost';
  onClick?: () => void;
  className?: string;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isPlaying = false,
  isLoading = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  onClick,
  className
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      default: return 'w-10 h-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  const getVariantClasses = () => {
    const base = 'rounded-full flex items-center justify-center transition-all duration-200';
    
    if (disabled) {
      return `${base} bg-white/10 text-white/30 cursor-not-allowed`;
    }

    switch (variant) {
      case 'primary':
        return `${base} bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl`;
      case 'ghost':
        return `${base} bg-transparent hover:bg-white/10 text-white/70 hover:text-white`;
      default:
        return `${base} bg-white/20 hover:bg-white/30 text-white`;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        getSizeClasses(),
        getVariantClasses(),
        className
      )}
    >
      {isLoading ? (
        <div className={cn('border-2 border-white/20 border-t-white/50 rounded-full animate-spin', getIconSize())} />
      ) : isPlaying ? (
        <PauseIcon className={getIconSize()} />
      ) : (
        <PlayIcon className={getIconSize()} />
      )}
    </button>
  );
};