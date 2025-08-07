import React from 'react';
import { cn } from '@/lib/utils';

// Country code to flag emoji mapping
const countryToFlag = (country: string): string => {
  const countryMap: { [key: string]: string } = {
    'US': '🇺🇸',
    'USA': '🇺🇸',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'Australia': '🇦🇺',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Russia': '🇷🇺',
    'Poland': '🇵🇱',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Belgium': '🇧🇪',
    'Finland': '🇫🇮',
    'Ireland': '🇮🇪',
    'South Korea': '🇰🇷',
    'China': '🇨🇳',
    'India': '🇮🇳',
    'Israel': '🇮🇱',
    'South Africa': '🇿🇦',
    'New Zealand': '🇳🇿',
    'Portugal': '🇵🇹',
    'Greece': '🇬🇷',
    'Turkey': '🇹🇷',
    'Iceland': '🇮🇸'
  };
  
  return countryMap[country] || '🌍';
};

interface LabelYearInfoProps {
  label: string;
  year: number;
  country?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export const LabelYearInfo: React.FC<LabelYearInfoProps> = ({
  label,
  year,
  country,
  variant = 'default',
  className
}) => {
  const textSize = variant === 'compact' ? 'text-xs' : 'text-sm';
  
  return (
    <div className={cn(`flex items-center gap-2 ${textSize} text-white/70`, className)}>
      <span className="truncate flex-1">{label}</span>
      <span className="text-white/50 flex-shrink-0">|</span>
      <span className="flex-shrink-0">{year}</span>
      {country && (
        <>
          <span className="text-white/50 flex-shrink-0">|</span>
          <span className="flex-shrink-0" title={country}>
            {countryToFlag(country)}
          </span>
        </>
      )}
    </div>
  );
};