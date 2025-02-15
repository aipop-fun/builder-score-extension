import React, { useEffect, useRef, useState } from 'react';
import { Check, Star, Activity, User, Code } from 'lucide-react';

const TwitterBadge = ({ username, passport, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState('bottom');
  const badgeRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!badgeRef.current || !showTooltip) return;
      const rect = badgeRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setTooltipPosition(spaceBelow < 320 ? 'top' : 'bottom');
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showTooltip]);

  if (!passport) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-purple-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div
      ref={badgeRef}
      className={`inline-flex items-center ml-2 relative ${className}`}
    >
      <button
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full
          ${getScoreColor(passport.score)}
          text-white text-sm font-medium
          transition-all hover:opacity-90
          shadow-sm hover:shadow-md
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Star className="w-3 h-3" />
        <span>{passport.score}</span>
      </button>

      {showTooltip && (
        <div
          className={`
            absolute z-50 w-72
            ${tooltipPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
            left-1/2 -translate-x-1/2
            bg-black border border-gray-700 rounded-xl
            shadow-xl p-4
          `}
        >
          <div className="flex items-start gap-3 mb-3">
            <img
              src={passport.passport_profile.image_url}
              alt=""
              className="w-12 h-12 rounded-full"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white">
                  {passport.passport_profile.display_name}
                </span>
                {passport.verified && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="text-gray-400 text-sm">
                Builder Profile
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <ScoreCard
              icon={Activity}
              label="Activity"
              score={passport.activity_score}
            />
            <ScoreCard
              icon={User}
              label="Identity"
              score={passport.identity_score}
            />
            <ScoreCard
              icon={Code}
              label="Skills"
              score={passport.skills_score}
            />
          </div>

          <a
            href={`https://app.talentprotocol.com/profile/${passport.passport_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Full Profile
          </a>
        </div>
      )}
    </div>
  );
};

const ScoreCard = ({ icon: Icon, label, score }) => (
  <div className="bg-gray-800 rounded-lg p-2 text-center">
    <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
    <div className="text-xs text-gray-400">{label}</div>
    <div className="font-semibold text-white">{score}</div>
  </div>
);

export default TwitterBadge;