// Atoms - Basic UI primitives (shadcn/ui components)

// Basic UI Elements
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Badge } from '@/components/ui/badge';
export { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Layout & Structure
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Form Controls
export { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
} from '@/components/ui/select';
export { Slider } from '@/components/ui/slider';

// Interactive Elements
export { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogPortal
} from '@/components/ui/dialog';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Typography Components (custom atoms)
export * from './Typography';

// Icon Components (custom atoms)  
export * from './Icons';

// Metric Components (custom atoms)
export { MetricState } from './MetricState';

// Audio Matching Components (custom atoms)
export { ConfidenceIndicator } from './ConfidenceIndicator';
export { TrackStatus } from './TrackStatus';
export { PlayButton } from './PlayButton';