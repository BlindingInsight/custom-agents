/**
 * Cloudflare Worker: demo-proxy
 *
 * Proxies *.summitaigroup.com to the Tailscale Funnel endpoint (demo-proxy.py
 * on port 9000). The Worker is a thin pass-through — all vertical routing is
 * handled by demo-proxy.py based on the X-Forwarded-Host header.
 */

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Demo Offline - Summit AI Group</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f8f8f6;
      color: #1a1a1a;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.75rem;
      color: #1a1a1a;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #555;
    }
    .accent {
      display: inline-block;
      width: 40px;
      height: 4px;
      background: #d4af37;
      border-radius: 2px;
      margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="accent"></div>
    <h1>Demo Offline</h1>
    <p>This demo environment is not currently running. Please contact your Summit AI Group representative to schedule a session.</p>
  </div>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const slug = hostname.split('.')[0];

    // Guard: bare domain should not match the wildcard route, but reject if it does
    if (hostname === 'summitaigroup.com') {
      return new Response('Not Found', { status: 404 });
    }

    // Redirect www to bare domain
    if (slug === 'www') {
      url.hostname = 'summitaigroup.com';
      return Response.redirect(url.toString(), 301);
    }

    // Build proxy request to Tailscale Funnel
    const target = new URL(url.pathname + url.search, env.FUNNEL_URL);

    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-Host', hostname);

    const proxyInit = {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    };

    try {
      // WebSocket upgrade: pass through directly (Cloudflare handles the upgrade)
      if (request.headers.get('Upgrade') === 'websocket') {
        return fetch(target.toString(), proxyInit);
      }

      const resp = await fetch(target.toString(), proxyInit);

      // Stream the response body through without buffering (supports SSE)
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers,
      });
    } catch {
      return new Response(OFFLINE_HTML, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  },
};
