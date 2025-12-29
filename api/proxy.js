// Simple proxy for forwarding Apps Script requests and adding CORS headers.
// Deploy this under Vercel (api/proxy.js). It accepts query params like:
// /api/proxy?action=getAllData&projectId=E-001&target=https://script.google.com/...
// It only allows targets that start with 'https://script.google.com/' to avoid open proxy.

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { target } = req.query;
  const defaultTarget = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw7HIgfEnoIkUOWFB-xU7dlyno84OaSWrdvJ3LXlX9KryXRJ7uobHzShg6MCoEzbIdh-Q/exec';
  let forwardTo = defaultTarget;

  if (target) {
    try {
      const t = decodeURIComponent(target);
      if (t.startsWith('https://script.google.com/')) forwardTo = t;
    } catch (e) {
      // ignore
    }
  }

  // Reconstruct query string from original request
  const qs = Object.keys(req.query)
    .filter(k => k !== 'target')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(req.query[k])}`)
    .join('&');

  const url = qs ? `${forwardTo}?${qs}` : forwardTo;

  try {
    const r = await fetch(url, { method: req.method, headers: { 'Accept': 'application/json' } });
    const text = await r.text();
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    const ct = r.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', ct);
    res.status(r.status).send(text);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.status(502).json({ error: 'Proxy fetch failed', detail: String(err) });
  }
}
