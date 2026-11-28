# YAHIAZAKIZ OS — Render deployment

This project serves the complete OS from `index.html` and runs both proxy endpoints on the same Render web service:

- OS: `/`
- Bare: `/tspmo/`
- Wisp: `wss://YOUR-SERVICE.onrender.com/wisp/`
- Health check: `/health`

## Deploy

1. Upload this folder to a GitHub repository (keep `index.html`, `server.js`, `package.json`, and `render.yaml` at the repository root).
2. In Render, choose **New → Blueprint** and connect the repository, or create a **Web Service** from it.
3. For a manual Web Service use:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
4. Wait for the service to become Live. Open its `https://...onrender.com` URL.
5. Check `https://YOUR-SERVICE.onrender.com/health` for the health response.

The OS now tries its own `/wisp/` endpoint first and automatically uses `/tspmo/` for its same-origin Bare proxy. No separate Wisp Render service is required.

## Notes

- Render Web Services support WebSockets. The app uses `wss://` automatically when served over HTTPS.
- Render's free web services can spin down after inactivity; the first visit after idle may take a little longer while it wakes up.
- This is a general-purpose web proxy. Only deploy it for your own use, keep the repository private if desired, and do not share the proxy endpoint publicly. The server rejects browser requests whose Origin is a different host and disables private/loopback Wisp destinations, but that is not a full user-authentication system.
- Some school-managed networks may still block Render domains or WebSockets. Hosting it yourself cannot override school network restrictions.
