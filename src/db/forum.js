const db = require('./supabase');

// Shared field list for every query that returns a ForumThread row —
// factored out to avoid repeating this five-table-ish join four times.
const THREAD_SELECT = `
  SELECT
    t.id,
    t.category_id                       AS "categoryId",
    c.slug                              AS "categorySlug",
    t.content_type                      AS "contentType",
    t.content_slug                      AS "contentSlug",
    t.title,
    t.created_by                        AS "authorId",
    p.display_name                      AS "authorDisplayName",
    p.avatar_url                        AS "authorAvatarUrl",
    t.status,
    t.pinned,
    t.locked,
    TO_CHAR(t.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    TO_CHAR(t.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
    CAST(
      (SELECT COUNT(*) FROM forum_posts fp WHERE fp.thread_id = t.id AND fp.status = 'published')
      AS INT
    ) AS "postCount"
  FROM forum_threads t
  LEFT JOIN forum_categories c ON c.id = t.category_id
  LEFT JOIN profiles p ON p.id = t.created_by
`;

async function getCategories() {
  const result = await db.query(`
    SELECT
      id,
      slug,
      name,
      description,
      sort_order AS "sortOrder"
    FROM forum_categories
    ORDER BY sort_order ASC
  `);
  return result.rows;
}

async function getThreads({ categorySlug, limit = 20, offset = 0 } = {}) {
  const whereParams = [];
  let where = "t.status = 'published'";
  if (categorySlug) {
    whereParams.push(categorySlug);
    where += ` AND c.slug = $${whereParams.length}`;
  }

  const itemsParams = [...whereParams, limit, offset];
  const itemsResult = await db.query(`
    ${THREAD_SELECT}
    WHERE ${where}
    ORDER BY t.pinned DESC, t.created_at DESC
    LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
  `, itemsParams);

  const countResult = await db.query(`
    SELECT COUNT(*) AS count
    FROM forum_threads t
    LEFT JOIN forum_categories c ON c.id = t.category_id
    WHERE ${where}
  `, whereParams);

  return {
    items: itemsResult.rows,
    totalCount: parseInt(countResult.rows[0].count, 10),
  };
}

async function getThreadById(id) {
  const result = await db.query(`
    ${THREAD_SELECT}
    WHERE t.id = $1
  `, [id]);
  return result.rows[0] || null;
}

async function getThreadByContent(contentType, contentSlug) {
  const result = await db.query(`
    ${THREAD_SELECT}
    WHERE t.content_type = $1 AND t.content_slug = $2
  `, [contentType, contentSlug]);
  return result.rows[0] || null;
}

// Shared field list for every query that returns a ForumPost row.
const POST_SELECT = `
  SELECT
    fp.id,
    fp.thread_id                        AS "threadId",
    fp.parent_post_id                   AS "parentPostId",
    fp.author_id                        AS "authorId",
    p.display_name                      AS "authorDisplayName",
    p.avatar_url                        AS "authorAvatarUrl",
    fp.body,
    fp.status,
    TO_CHAR(fp.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    TO_CHAR(fp.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
    TO_CHAR(fp.edited_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "editedAt"
  FROM forum_posts fp
  LEFT JOIN profiles p ON p.id = fp.author_id
`;

async function getPostsForThread(threadId, { limit = 50, offset = 0 } = {}) {
  const itemsResult = await db.query(`
    ${POST_SELECT}
    WHERE fp.thread_id = $1 AND fp.status = 'published'
    ORDER BY fp.created_at ASC
    LIMIT $2 OFFSET $3
  `, [threadId, limit, offset]);

  const countResult = await db.query(`
    SELECT COUNT(*) AS count FROM forum_posts WHERE thread_id = $1 AND status = 'published'
  `, [threadId]);

  return {
    items: itemsResult.rows,
    totalCount: parseInt(countResult.rows[0].count, 10),
  };
}

async function getPostById(id) {
  const result = await db.query(`
    ${POST_SELECT}
    WHERE fp.id = $1
  `, [id]);
  return result.rows[0] || null;
}

// Returns just enough to authorize a mutation (owner + lock state) without
// paying for the full joined SELECT.
async function getPostOwnerAndThread(id) {
  const result = await db.query(`
    SELECT
      fp.author_id AS "authorId",
      fp.thread_id AS "threadId"
    FROM forum_posts fp
    WHERE fp.id = $1
  `, [id]);
  return result.rows[0] || null;
}

async function getThreadLockStatus(threadId) {
  const result = await db.query(`SELECT locked FROM forum_threads WHERE id = $1`, [threadId]);
  return result.rows[0] ? result.rows[0].locked : null; // null => thread doesn't exist
}

async function createThread({ categoryId, title, authorId }) {
  const result = await db.query(`
    INSERT INTO forum_threads (category_id, title, created_by)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [categoryId, title, authorId]);
  return result.rows[0].id;
}

// Get-or-create the single comment thread for a piece of content (e.g. an
// article slug). Relies on the (content_type, content_slug) partial unique
// index — concurrent first-comments race safely via ON CONFLICT DO NOTHING.
async function getOrCreateThreadForContent(contentType, contentSlug, title, authorId) {
  const insertResult = await db.query(`
    INSERT INTO forum_threads (content_type, content_slug, title, created_by)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (content_type, content_slug) WHERE content_slug IS NOT NULL DO NOTHING
    RETURNING id
  `, [contentType, contentSlug, title, authorId]);

  if (insertResult.rows[0]) {
    return insertResult.rows[0].id;
  }

  const existing = await db.query(`
    SELECT id FROM forum_threads WHERE content_type = $1 AND content_slug = $2
  `, [contentType, contentSlug]);
  return existing.rows[0].id;
}

async function createPost({ threadId, parentPostId, authorId, body }) {
  const result = await db.query(`
    INSERT INTO forum_posts (thread_id, parent_post_id, author_id, body)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [threadId, parentPostId || null, authorId, body]);
  return result.rows[0].id;
}

async function updatePostBody(id, body) {
  await db.query(`
    UPDATE forum_posts
    SET body = $2, updated_at = now(), edited_at = now()
    WHERE id = $1
  `, [id, body]);
  return getPostById(id);
}

async function deletePostById(id) {
  await db.query(`DELETE FROM forum_posts WHERE id = $1`, [id]);
}

module.exports = {
  getCategories,
  getThreads,
  getThreadById,
  getThreadByContent,
  getPostsForThread,
  getPostById,
  getPostOwnerAndThread,
  getThreadLockStatus,
  createThread,
  getOrCreateThreadForContent,
  createPost,
  updatePostBody,
  deletePostById,
};
