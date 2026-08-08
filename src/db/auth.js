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
  // tiers 3+ are earned via liked_count (see incrementLikedCount) and aren't
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

// Honor-system "liked a paired YouTube video" counter -- no dedup or
// verification, incremented once per click of "Like on YouTube" (see
// YoutubeSubscribeGate on the client). Ladder mirrors LIKE_TIER_LADDER in
// client/src/lib/tiers.ts -- keep both in sync:
//   subscribed + liked_count >= 1  -> tier 3 (comments)
//   liked_count >= 5               -> tier 4 (premium articles)
//   liked_count >= 25              -> tier 5
//   liked_count >= 100             -> tier 6
//   liked_count >= 200             -> tier 7 (ladder stops here; 8-9 are manual-only)
async function incrementLikedCount(userId) {
  const result = await db.query(
    `UPDATE profiles SET
       liked_count = liked_count + 1,
       tier = CASE
         WHEN (liked_count + 1) >= 200 THEN GREATEST(tier, 7)
         WHEN (liked_count + 1) >= 100 THEN GREATEST(tier, 6)
         WHEN (liked_count + 1) >= 25 THEN GREATEST(tier, 5)
         WHEN (liked_count + 1) >= 5 THEN GREATEST(tier, 4)
         WHEN youtube_subscribed = true THEN GREATEST(tier, 3)
         ELSE tier
       END
     WHERE id = $1
     RETURNING liked_count AS "likedCount", youtube_subscribed AS "youtubeSubscribed", tier`,
    [userId]
  );
  return result.rows[0];
}

module.exports = { getProfile, updateProfile, setYoutubeSubscribed, incrementLikedCount, ALLOWED_AVATARS };
