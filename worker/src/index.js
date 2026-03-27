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

// Headers that must not be forwarded between hops (RFC 2616 Section 13.5.1)
const HOP_BY_HOP = [
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailers', 'transfer-encoding',
];

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
    const isWebSocket = request.headers.get('Upgrade') === 'websocket';

    const headers = new Headers(request.headers);
    HOP_BY_HOP.forEach(h => headers.delete(h));
    headers.set('X-Forwarded-Host', hostname);

    const clientIp = request.headers.get('CF-Connecting-IP');
    if (clientIp) {
      headers.set('X-Forwarded-For', clientIp);
    }

    // Preserve Upgrade header for WebSocket handshake (stripped above with hop-by-hop)
    if (isWebSocket) {
      headers.set('Upgrade', 'websocket');
    }

    const proxyInit = {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    };

    try {
      // WebSocket upgrade: pass through directly (Cloudflare handles the upgrade)
      if (isWebSocket) {
        return await fetch(target.toString(), proxyInit);
      }

      const resp = await fetch(target.toString(), proxyInit);

      // Rewrite Location header on redirects to use the public hostname
      const respHeaders = new Headers(resp.headers);
      if (resp.status >= 300 && resp.status < 400) {
        const location = resp.headers.get('Location');
        if (location) {
          try {
            const loc = new URL(location);
            loc.hostname = hostname;
            loc.port = '';
            loc.protocol = 'https:';
            respHeaders.set('Location', loc.toString());
          } catch {
            // Relative URLs are fine as-is
          }
        }
      }

      // Stream the response body through without buffering (supports SSE)
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers: respHeaders,
      });
    } catch (err) {
      console.error('Proxy fetch failed:', err?.message ?? err);
      return new Response(OFFLINE_HTML, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  },
};
