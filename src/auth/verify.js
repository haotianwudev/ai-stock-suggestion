const { createRemoteJWKSet, jwtVerify } = require('jose');

// Supabase publishes rotating signing keys at a per-project JWKS endpoint.
// createRemoteJWKSet fetches + caches them and handles rotation automatically,
// so there's no static secret to manage here. Built lazily (not at module load)
// so the server can still boot before SUPABASE_URL is configured — every
// request just resolves to an anonymous user until then.
let JWKS = null;
function getJWKS() {
  if (!JWKS) {
    JWKS = createRemoteJWKSet(
      new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    );
  }
  return JWKS;
}

/**
 * Verify a Supabase-issued JWT from an `Authorization: Bearer <token>` header.
 * Never throws — a missing/invalid/expired token means "anonymous", not an error.
 * @param {string|undefined} authHeader
 * @returns {Promise<{ id: string, email: string|null } | null>}
 */
async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  if (!process.env.SUPABASE_URL) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    return { id: payload.sub, email: payload.email || null };
  } catch (error) {
    console.warn('JWT verification failed:', error.message);
    return null;
  }
}

module.exports = { getUserFromToken };
