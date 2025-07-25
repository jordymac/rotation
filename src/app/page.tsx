import Feed from '@/components/Feed';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Feed />
    </div>
  );
}
