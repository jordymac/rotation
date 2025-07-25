import { DiscogsRelease } from '@/utils/discogs';

interface RecordCardProps {
  release: DiscogsRelease;
}

export default function RecordCard({ release }: RecordCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img
          src={release.thumb}
          alt={`${release.artist} - ${release.title}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {release.title}
        </h3>
        
        <p className="text-gray-700 mb-2">
          {release.artist}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>{release.label}</span>
          <span>{release.year}</span>
        </div>
        
        {release.genre && release.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {release.genre.slice(0, 3).map((genre, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        
        {release.price && (
          <div className="mb-3">
            <span className="text-lg font-bold text-green-600">
              {release.price}
            </span>
            {release.condition && (
              <span className="text-sm text-gray-500 ml-2">
                {release.condition}
                {release.sleeve_condition && ` / ${release.sleeve_condition}`}
              </span>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <a
            href={`https://www.discogs.com${release.uri}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Buy on Discogs
          </a>
        </div>
      </div>
    </div>
  );
}