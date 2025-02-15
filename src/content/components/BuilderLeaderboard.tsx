import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BuilderLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topBuilders, setTopBuilders] = useState([]);

  useEffect(() => {
    const fetchTopBuilders = async () => {
      try {
        const { data, error } = await supabase
          .from('passports')
          .select('*')
          .order('score', { ascending: false })
          .limit(5);

        if (error) throw error;

        setTopBuilders(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching top builders:', err);
        setError('Failed to load leaderboard');
        setLoading(false);
      }
    };

    fetchTopBuilders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-black bg-opacity-40 rounded-2xl">
        <div className="animate-spin h-5 w-5 text-gray-400">⌛</div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div className="border border-gray-800 rounded-2xl bg-black mb-4">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Top Builders</h2>
        </div>
        <p className="text-gray-500 text-sm">Developers making an impact</p>
      </div>

      <div className="divide-y divide-gray-800">
        {topBuilders.map((builder, index) => (
          <a
            key={builder.passport_id}
            href={`https://twitter.com/${builder.twitter_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={builder.image_url}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                {index === 0 && (
                  <span className="absolute -top-1 -right-1 text-lg">👑</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white">
                    {builder.display_name}
                  </span>
                  {builder.verified && (
                    <span className="text-blue-400">✓</span>
                  )}
                </div>
                <div className="text-gray-500">@{builder.twitter_username}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-500 text-white font-medium">
                🏗️ {builder.score}
              </div>
            </div>
          </a>
        ))}
      </div>

      <a
        href="https://app.talentprotocol.com/explore"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 text-blue-400 hover:bg-gray-900 transition-colors text-sm border-t border-gray-800"
      >
        Show more builders
      </a>
    </div>
  );
};

export default BuilderLeaderboard;