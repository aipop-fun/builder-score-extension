import React, { useEffect, useState } from 'react';
import { useStore } from '../../popup/store/useStore';
import { AlertCircle, Loader2 } from 'lucide-react';

const BuilderScore = () => {
  const [currentUsername, setCurrentUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getPassportData, fetchPassportFromSupabase } = useStore();

  useEffect(() => {
    const handleUrlChange = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0]?.url;

        if (!url) {
          setError("No active tab URL found");
          setLoading(false);
          return;
        }

        // Extract username from Twitter URL - support both twitter.com and x.com
        const match = url.match(/(?:twitter|x)\.com\/([^/]+)/);
        const username = match?.[1];

        if (!username) {
          setError("No Twitter profile detected");
          setLoading(false);
          return;
        }

        setCurrentUsername(username);
        setLoading(true);

        // Check cache first
        const cachedData = getPassportData(username);
        if (cachedData) {
          setLoading(false);
          return;
        }

        // Fetch from Supabase if not in cache
        const passportData = await fetchPassportFromSupabase(username);
        setLoading(false);

        if (!passportData) {
          setError("No builder score found");
        }
      } catch (err) {
        console.error('Error fetching passport data:', err);
        setError('Failed to fetch builder score');
        setLoading(false);
      }
    };

    // Initial load
    handleUrlChange();

    // Listen for URL changes
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.url) {
        handleUrlChange();
      }
    });

    // Listen for tab changes
    chrome.tabs.onActivated.addListener(handleUrlChange);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleUrlChange);
      chrome.tabs.onActivated.removeListener(handleUrlChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-gray-600">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!currentUsername) {
    return (
      <div className="p-4 text-gray-600">
        Visit a Twitter profile to see builder score
      </div>
    );
  }

  const passportData = getPassportData(currentUsername);
  const passport = passportData?.passport;

  if (!passport) {
    return (
      <div className="p-4 text-gray-600">
        No builder score available for @{currentUsername}
      </div>
    );
  }

  return (
    <div className="p-4 bg-black text-white">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={passport.passport_profile.image_url} 
              alt="" 
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-bold">
                {passport.passport_profile.display_name}
                {passport.verified && (
                  <span className="ml-1 text-blue-400">✓</span>
                )}
              </div>
              <div className="text-gray-500">@{currentUsername}</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {passport.score}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Activity</span>
            <span className="font-medium">{passport.activity_score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Identity</span>
            <span className="font-medium">{passport.identity_score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Skills</span>
            <span className="font-medium">{passport.skills_score}</span>
          </div>
        </div>

        <a
          href={`https://app.talentprotocol.com/profile/${passport.passport_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded-full font-medium hover:bg-blue-600 transition-colors"
        >
          View Full Profile
        </a>
      </div>
    </div>
  );
};

export default BuilderScore;