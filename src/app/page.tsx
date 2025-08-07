'use client';

import { useRouter } from 'next/navigation';
import { HomeTemplate } from '@/components/templates';

export default function Home() {
  const router = useRouter();

  return (
    <HomeTemplate
      onEnterFeed={() => router.push('/feed')}
      onBrowseStores={() => router.push('/stores')}
      onGoToAdmin={() => router.push('/admin')}
    />
  );
}
