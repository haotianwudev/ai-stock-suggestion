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
            youtube_subscribed AS "youtubeSubscribed", tier
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
  // Subscribing bumps tier up to at least 2, never down (a tier-9 power user
  // stays 9). Unsubscribing only drops tier 2 back to 1 -- it never touches a
  // tier 3+ manually-granted membership, since that isn't tied to this claim.
  const result = await db.query(
    `UPDATE profiles SET
       youtube_subscribed = $2,
       tier = CASE
         WHEN $2 = true THEN GREATEST(tier, 2)
         WHEN $2 = false AND tier = 2 THEN 1
         ELSE tier
       END
     WHERE id = $1
     RETURNING youtube_subscribed AS "youtubeSubscribed", tier`,
    [userId, subscribed]
  );
  return result.rows[0];
}

module.exports = { getProfile, updateProfile, setYoutubeSubscribed, ALLOWED_AVATARS };
