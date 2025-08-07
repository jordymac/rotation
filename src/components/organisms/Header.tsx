import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, H2 } from '@/components/atoms';
import { NavLink } from '@/components/molecules';
import { UserIcon, Cog6ToothIcon } from '@/components/atoms';

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  currentStore?: {
    id: string;
    name: string;
  };
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentStore,
  className
}) => {
  return (
    <header className={cn('bg-black/80 backdrop-blur-md border-b border-white/20 px-4 py-3', className)}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <H2 className="text-white font-bold text-xl border-0 pb-0">
            Rotation
          </H2>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLink href="/feed">
            Feed
          </NavLink>
          <NavLink href="/stores">
            Stores
          </NavLink>
          {user && (
            <NavLink href="/admin">
              Admin
            </NavLink>
          )}
        </nav>

        {/* Store Selector & User Actions */}
        <div className="flex items-center gap-4">
          {/* Current Store Indicator */}
          {currentStore && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white/80 text-sm">
                {currentStore.name}
              </span>
            </div>
          )}

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white">
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login" className="text-white">
                  Sign In
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};