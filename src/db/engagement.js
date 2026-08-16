const db = require('./supabase');
const { LIKE_THRESHOLDS } = require('../lib/tiers');

// Honor-system "liked a paired YouTube video" attestation -- no verification
// that they actually liked it on YouTube, but identity-tracked and idempotent
// per (user, article): liking the same video twice is a no-op, so liked_count
// (and the tier ladder below) counts distinct videos, not raw clicks.
async function attestLiked(userId, articleSlug) {
  // The liked_videos INSERT is a data-modifying CTE: Postgres runs it exactly
  // once regardless of how many times `ins` is referenced below, so this is
  // safe to reference twice without double-inserting.
  const result = await db.query(
    `WITH ins AS (
       INSERT INTO liked_videos (user_id, article_slug)
       VALUES ($1, $2)
       ON CONFLICT (user_id, article_slug) DO NOTHING
       RETURNING 1
     )
     UPDATE profiles SET
       liked_count = liked_count + (SELECT count(*) FROM ins),
       tier = CASE
         WHEN liked_count + (SELECT count(*) FROM ins) >= ${LIKE_THRESHOLDS.TIER_7} THEN GREATEST(tier, 7)
         WHEN liked_count + (SELECT count(*) FROM ins) >= ${LIKE_THRESHOLDS.TIER_6} THEN GREATEST(tier, 6)
         WHEN liked_count + (SELECT count(*) FROM ins) >= ${LIKE_THRESHOLDS.TIER_5} THEN GREATEST(tier, 5)
         WHEN liked_count + (SELECT count(*) FROM ins) >= ${LIKE_THRESHOLDS.TIER_4} THEN GREATEST(tier, 4)
         WHEN youtube_subscribed = true THEN GREATEST(tier, 3)
         ELSE tier
       END
     WHERE id = $1
     RETURNING liked_count AS "likedCount", tier, (SELECT count(*) FROM ins) > 0 AS "wasNewLike"`,
    [userId, articleSlug]
  );
  return result.rows[0];
}

async function getLikedArticleSlugs(userId) {
  const result = await db.query(
    `SELECT article_slug FROM liked_videos WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => row.article_slug);
}

async function toggleBookmark(userId, articleSlug) {
  const deleted = await db.query(
    `DELETE FROM bookmarks WHERE user_id = $1 AND article_slug = $2 RETURNING 1`,
    [userId, articleSlug]
  );
  if (deleted.rowCount > 0) return false;

  await db.query(
    `INSERT INTO bookmarks (user_id, article_slug) VALUES ($1, $2)
     ON CONFLICT (user_id, article_slug) DO NOTHING`,
    [userId, articleSlug]
  );
  return true;
}

async function getBookmarkedArticleSlugs(userId) {
  const result = await db.query(
    `SELECT article_slug FROM bookmarks WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => row.article_slug);
}

module.exports = { attestLiked, getLikedArticleSlugs, toggleBookmark, getBookmarkedArticleSlugs };
