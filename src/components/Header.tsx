import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          Rotation
        </Link>
        
        <nav className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <Link 
              href="/profile" 
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Profile
            </Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}