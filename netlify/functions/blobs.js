const { getStore } = require('@netlify/blobs');

// The admin password is read from an environment variable on Netlify:
// Site settings > Environment variables > ADMIN_PASSWORD
function isAuthorized(event) {
  const password = event.headers['x-admin-password'];
  return password && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

// This site is separate from the game's site, so we need to connect to the
// game's Blobs store explicitly via siteID + token instead of relying on the
// automatic deploy context.
// Set NETLIFY_SITE_ID and NETLIFY_TOKEN in this admin site's environment variables.
function getGameStore(storeName) {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_TOKEN;
  if (!siteID || !token) {
    throw new Error('NETLIFY_SITE_ID or NETLIFY_TOKEN is not set in environment variables');
  }
  return getStore({ name: storeName, siteID, token });
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!isAuthorized(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid password' }) };
  }

  const params = event.queryStringParameters || {};
  const storeName = params.store;
  const key = params.key;

  if (!storeName) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Store name is required' }) };
  }

  let store;
  try {
    store = getGameStore(storeName);
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }

  try {
    // ---- GET: fetch a single key, or list all keys ----
    if (event.httpMethod === 'GET') {
      if (key) {
        const value = await store.get(key, { type: 'json' });
        if (value === null) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Key not found' }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ key, value }) };
      } else {
        const { blobs } = await store.list();
        return { statusCode: 200, headers, body: JSON.stringify({ keys: blobs.map(b => b.key) }) };
      }
    }

    // ---- POST: create or update a key ----
    if (event.httpMethod === 'POST') {
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Key is required' }) };
      }
      let parsed;
      try {
        parsed = JSON.parse(event.body);
      } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
      }
      await store.setJSON(key, parsed);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, key }) };
    }

    // ---- DELETE: remove a key ----
    if (event.httpMethod === 'DELETE') {
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Key is required' }) };
      }
      await store.delete(key);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, deleted: key }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
