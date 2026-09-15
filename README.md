# Netlify Blobs Admin Panel

An internal admin tool to view, edit, and delete data stored in Netlify Blobs. Intended for the site owner to manually fix data errors and resolve disputes.

## Deployment steps (separate admin site, connecting to your game's site)

This version is set up to run from an **independent** Netlify site and connect remotely to the Blobs store that belongs to **your game's site**.

1. Push this folder as a Git repo (GitHub/GitLab) or drag-and-drop it into Netlify as a **new, separate** site.
2. **Gather the connection details for your game's site:**
   - **Site ID**: open your game's site in Netlify → Site settings → General → Site details → copy the **Site ID**.
   - **Personal Access Token**: from your Netlify account → User settings (top-right avatar) → Applications → Personal access tokens → New access token. Give it a clear name (e.g. `blobs-admin`) and copy the value immediately (it's shown only once).
3. On the **new admin site** (not the game's site) → Site settings → Environment variables, add:
   - `ADMIN_PASSWORD` = a strong password of your choice to protect the panel itself
   - `NETLIFY_SITE_ID` = the Site ID you copied from the game's site
   - `NETLIFY_TOKEN` = the access token you created
4. Trigger a redeploy after adding the variables so they take effect.
5. Open the admin site's URL, enter the password and the **store name** (it must exactly match the name your game uses in code, e.g. `getStore("store_name")`), then use the buttons:
   - List all keys
   - Load / edit / save / delete a specific key (value as JSON)

## Important security notes

- **`NETLIFY_TOKEN` is powerful**: whoever holds it can control your entire Netlify account, not just Blobs. Never put it in the frontend code (index.html) — it lives only in the backend function and is read from an environment variable, which is how the current code is set up. Keep it completely secret, and if you suspect it leaked, revoke it immediately on Netlify and generate a new one.
- **Rotate `ADMIN_PASSWORD` periodically** and don't share it.
- Consider adding an extra layer of protection at the Netlify level itself (e.g. **Netlify Identity** or site **Password Protection**), since this is a sensitive admin page.
- Log every manual edit/delete somewhere else (e.g. a Google Sheet) to document why each manual change was made when resolving a dispute — this will help you later if you need to prove what happened.
- To run locally for testing: `npx netlify dev` after `netlify login` and `netlify link`.

## Structure

```
netlify.toml                 Deployment configuration
package.json                 @netlify/blobs dependency
netlify/functions/blobs.js   Backend function (GET/POST/DELETE)
public/index.html            Admin UI
```
