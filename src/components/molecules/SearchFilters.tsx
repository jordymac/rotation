import React from 'react';
import { cn } from '@/lib/utils';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '@/components/atoms';
import { MagnifyingGlassIcon, XMarkIcon } from '@/components/atoms';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    minPrice: string;
    maxPrice: string;
    format: string;
    condition: string;
    genre: string;
    year: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        <Input
          type="text"
          placeholder="Artist, title, label, or genre..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30"
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Price Range
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onFilterChange({...filters, minPrice: e.target.value})}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({...filters, maxPrice: e.target.value})}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
          />
        </div>
      </div>

      {/* Format */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Format
        </label>
        <Select value={filters.format || "all"} onValueChange={(value) => onFilterChange({...filters, format: value === "all" ? "" : value})}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="All Formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="vinyl">Vinyl</SelectItem>
            <SelectItem value="cd">CD</SelectItem>
            <SelectItem value="cassette">Cassette</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Condition
        </label>
        <Select value={filters.condition || "all"} onValueChange={(value) => onFilterChange({...filters, condition: value === "all" ? "" : value})}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="All Conditions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="mint">Mint (M)</SelectItem>
            <SelectItem value="near mint">Near Mint (NM)</SelectItem>
            <SelectItem value="very good plus">Very Good Plus (VG+)</SelectItem>
            <SelectItem value="very good">Very Good (VG)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Year
        </label>
        <Input
          type="number"
          placeholder="e.g. 1990"
          value={filters.year}
          onChange={(e) => onFilterChange({...filters, year: e.target.value})}
          className="bg-white/10 border-white/20 text-white placeholder-white/50"
        />
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="w-full bg-white/20 text-white border-white/20 hover:bg-white/30"
      >
        <XMarkIcon className="w-4 h-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );
};