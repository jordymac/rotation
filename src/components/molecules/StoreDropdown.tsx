import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';

interface Store {
  id: string;
  username: string;
  displayName?: string;
}

interface StoreDropdownProps {
  stores: Store[];
  selectedStore?: string;
  onStoreChange: (storeId: string) => void;
  placeholder?: string;
  className?: string;
}

export const StoreDropdown: React.FC<StoreDropdownProps> = ({
  stores,
  selectedStore,
  onStoreChange,
  placeholder = "Select a store...",
  className
}) => {
  return (
    <Select value={selectedStore} onValueChange={onStoreChange}>
      <SelectTrigger className={cn('bg-white/10 border-white/20 text-white', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.displayName || store.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};