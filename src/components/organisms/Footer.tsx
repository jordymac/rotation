import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { P, Small } from '@/components/atoms';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn('bg-black/80 backdrop-blur-md border-t border-white/20 px-4 py-8', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-white font-bold text-xl">Rotation</span>
            </div>
            <P className="text-white/70 text-sm max-w-md mt-0">
              A scrollable vinyl discovery tool for DJs and record collectors. 
              Discover new music through an interactive feed with embedded audio previews.
            </P>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <div className="space-y-2">
              <Link href="/feed" className="block text-white/70 hover:text-white text-sm transition-colors">
                Feed
              </Link>
              <Link href="/stores" className="block text-white/70 hover:text-white text-sm transition-colors">
                Stores
              </Link>
              <Link href="/admin" className="block text-white/70 hover:text-white text-sm transition-colors">
                Admin
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <div className="space-y-2">
              <Link href="/help" className="block text-white/70 hover:text-white text-sm transition-colors">
                Help
              </Link>
              <Link href="/contact" className="block text-white/70 hover:text-white text-sm transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="block text-white/70 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="block text-white/70 hover:text-white text-sm transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <Small className="text-white/60">
            © 2024 Rotation. All rights reserved.
          </Small>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Small className="text-white/60">
              Powered by Discogs API
            </Small>
          </div>
        </div>
      </div>
    </footer>
  );
};