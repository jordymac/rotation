import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  variant?: 'default' | 'ghost';
  className?: string;
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  children,
  icon,
  active = false,
  variant = 'ghost',
  className
}) => {
  return (
    <Button
      asChild
      variant={active ? 'default' : variant}
      className={cn(
        'justify-start gap-2',
        active && 'bg-primary text-primary-foreground',
        className
      )}
    >
      <Link href={href}>
        {icon}
        {children}
      </Link>
    </Button>
  );
};