import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeaderboardUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  builder_score: number;
  percentile: number;
  rank: number;
}

interface LeaderboardResponse {
  data: LeaderboardUser[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(
        'https://www.builderscore.xyz/api/leaderboards?per_page=5&page=1'
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: LeaderboardResponse = await response.json();
      setUsers(data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Builders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Builders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">🏆 Top Builders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <a
            key={user.fid}
            href={`https://warpcast.com/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <div className="flex-shrink-0 w-8 text-center">
              <span className="text-sm font-bold">
                {getMedalEmoji(user.rank)}
              </span>
            </div>
            <img
              src={user.pfp_url}
              alt={user.display_name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.display_name}
              </p>
              <p className="text-xs text-gray-500">@{user.username}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-bold text-purple-600">
                {user.builder_score}
              </p>
              <p className="text-xs text-gray-400">
                Top {user.percentile.toFixed(1)}%
              </p>
            </div>
          </a>
        ))}
        <a
          href="https://www.builderscore.xyz/leaderboard"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-purple-600 hover:text-purple-700 pt-2 border-t"
        >
          View Full Leaderboard →
        </a>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;