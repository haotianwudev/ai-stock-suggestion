const db = require('./supabase');

const ALLOWED_AVATARS = [
  '/images/agents/warren_buffett.png',
  '/images/agents/charlie_munger.png',
  '/images/agents/cathie_wood.png',
  '/images/agents/stanley_druckenmiller.png',
  '/images/agents/ben_graham.png',
  '/images/agents/SOPHIE.png',
];

async function getProfile(userId) {
  const result = await db.query(
    `SELECT display_name AS "displayName", avatar_url AS "avatarUrl",
            youtube_subscribed AS "youtubeSubscribed", liked_count AS "likedCount", tier
     FROM profiles WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function updateProfile(userId, { displayName, avatarUrl }) {
  const result = await db.query(
    `UPDATE profiles SET display_name = $2, avatar_url = $3
     WHERE id = $1
     RETURNING display_name AS "displayName", avatar_url AS "avatarUrl"`,
    [userId, displayName, avatarUrl]
  );
  return result.rows[0];
}

async function setYoutubeSubscribed(userId, subscribed) {
  // Subscribing bumps tier up to at least 2 (or 3 if they'd already liked a
  // video), never down (a tier-9 power user stays 9). Unsubscribing only
  // drops tier 2 back to 1 -- it never touches a tier 3+ membership, since
  // tiers 3+ are earned via liked_count (see db/engagement.js) and aren't
  // tied to this claim.
  const result = await db.query(
    `UPDATE profiles SET
       youtube_subscribed = $2,
       tier = CASE
         WHEN $2 = true AND liked_count >= 1 THEN GREATEST(tier, 3)
         WHEN $2 = true THEN GREATEST(tier, 2)
         WHEN $2 = false AND tier = 2 THEN 1
         ELSE tier
       END
     WHERE id = $1
     RETURNING youtube_subscribed AS "youtubeSubscribed", liked_count AS "likedCount", tier`,
    [userId, subscribed]
  );
  return result.rows[0];
}

// liked_count (bumped by attestLiked in db/engagement.js, which tracks *which*
// video via the liked_videos table) drives tier promotion 3-7 -- see that
// file for the ladder.

module.exports = { getProfile, updateProfile, setYoutubeSubscribed, ALLOWED_AVATARS };
