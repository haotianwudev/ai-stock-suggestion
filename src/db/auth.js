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
    `SELECT display_name AS "displayName", avatar_url AS "avatarUrl"
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

module.exports = { getProfile, updateProfile, ALLOWED_AVATARS };
