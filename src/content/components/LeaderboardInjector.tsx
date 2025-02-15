import React, { useEffect, useState } from 'react';
import { useStore } from '../../popup/store/useStore';

const UserAvatar = ({ src, username, name }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="css-175oi2r r-18kxxzh r-1wron08 r-1777fci">
      <div className="css-175oi2r r-bztko3 r-1adg3ll r-13qz1uu" style={{ height: "40px" }}>
        <div className="r-1adg3ll r-13qz1uu" style={{ paddingBottom: "100%" }}></div>
        <div className="r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-ipm5af r-13qz1uu">
          <div className="css-175oi2r r-1mlwlqe r-1udh08x r-417010 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af">
            <div className="css-175oi2r r-1niwhzg r-vvn4in r-u6sd8q r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw"
              style={{ backgroundImage: `url(${!imageError ? src : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`})` }}>
            </div>
            <img
              alt=""
              src={!imageError ? src : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`}
              onError={() => setImageError(true)}
              className="css-9pa8cd"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FollowButton = () => (
  <button
    className="css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-15ysp7h r-4wgw6l r-1ny4l3l r-1loqt21"
    style={{ backgroundColor: "rgb(239, 243, 244)", borderColor: "rgba(0, 0, 0, 0)" }}
  >
    <div className="css-175oi2r r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci" style={{ color: "rgb(15, 20, 25)" }}>
      <span className="css-1jxf684 r-bcqeeo r-qvutc0 r-poiln3">Follow</span>
    </div>
  </button>
);

export const LeaderboardInjector = () => {
  const [loading, setLoading] = useState(true);
  const [topBuilders, setTopBuilders] = useState([]);
  const { supabase } = useStore();

  useEffect(() => {
    const fetchTopBuilders = async () => {
      try {
        const { data, error } = await supabase
          .from('passports')
          .select('*')
          .order('score', { ascending: false })
          .limit(3);

        if (error) throw error;
        setTopBuilders(data);
      } catch (err) {
        console.error('Error fetching top builders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopBuilders();
  }, []);

  if (loading || topBuilders.length === 0) return null;

  return (
    <div className="css-175oi2r r-1bro5k0">
      <aside aria-label="Who to follow" role="complementary" className="css-175oi2r">
        <div className="css-175oi2r r-1wtj0ep r-1mmae3n r-1ny4l3l">
          <h2 className="css-175oi2r r-18u37iz r-1wtj0ep">
            <div dir="ltr" className="css-1rynq56 r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q" style={{ color: "rgb(231, 233, 234)" }}>
              <span className="css-1qaijid r-bcqeeo r-qvutc0 r-poiln3">You might like</span>
            </div>
          </h2>
        </div>

        <div role="list" className="css-175oi2r">
          {topBuilders.map((builder) => (
            <div
              key={builder.passport_id}
              className="css-175oi2r r-1loqt21 r-18u37iz r-1ny4l3l r-1udh08x r-1qhn6m8 r-i023vh"
            >
              <div className="css-175oi2r r-18u37iz">
                <UserAvatar
                  src={builder.image_url}
                  name={builder.display_name}
                  username={builder.twitter_username}
                />

                <div className="css-175oi2r r-1iusvr4 r-16y2uox r-1777fci">
                  <div className="css-175oi2r r-1awozwy r-18u37iz r-1wtj0ep">
                    <div className="css-175oi2r">
                      <div className="css-1rynq56 r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q" style={{ color: "rgb(231, 233, 234)" }}>
                        <span className="css-1qaijid r-bcqeeo r-qvutc0 r-poiln3">{builder.display_name}</span>
                        {builder.verified && (
                          <svg viewBox="0 0 24 24" aria-label="Verified account" className="r-1cvl2hr r-4qtqp9 r-1n0xq6e r-1plcrui r-lrvibr" style={{ color: "rgb(29, 155, 240)" }}>
                            <g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"></path></g>
                          </svg>
                        )}
                      </div>
                      <div className="css-1rynq56 r-dnmrzs r-1udh08x r-3s2u2q r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe" style={{ color: "rgb(113, 118, 123)" }}>
                        @{builder.twitter_username}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="css-175oi2r" style={{ minWidth: 0 }}>
                  <FollowButton />
                </div>
              </div>
            </div>
          ))}
        </div>

        <a href="https://app.talentprotocol.com/explore"
          className="css-175oi2r r-1ny4l3l r-1loqt21">
          <div className="css-1rynq56 r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe" style={{ color: "rgb(29, 155, 240)" }}>
            Show more
          </div>
        </a>
      </aside>
    </div>
  );
};

export default LeaderboardInjector;