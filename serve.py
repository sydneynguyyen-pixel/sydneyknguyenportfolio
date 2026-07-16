#!/usr/bin/env python3
"""Local static server with clean-URL resolution.

The site links to pages without the .html extension (e.g. href="iterait"),
matching how the production host serves them. Python's stock http.server does
NOT do that mapping, so `/iterait` 404s locally. This handler falls back to
`<path>.html` when the extensionless path doesn't exist, so the local preview
behaves like production. Everything else is standard SimpleHTTPRequestHandler.

Usage: python3 serve.py [port]   (defaults to 8000, serves the current dir)
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class CleanURLHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        fs_path = super().translate_path(path)
        # Extensionless, doesn't exist, but a sibling .html does → serve that.
        if (not os.path.exists(fs_path)
                and not os.path.splitext(fs_path)[1]
                and os.path.isfile(fs_path + '.html')):
            return fs_path + '.html'
        return fs_path

    def end_headers(self):
        # Disable caching so edits (CSS/JS/HTML) always show on reload — the
        # stock http.server sends no cache headers, so browsers cache assets
        # heuristically and serve stale copies without revalidating.
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    httpd = HTTPServer(('', port), CleanURLHandler)
    print(f'Serving {os.getcwd()} on http://localhost:{port} (clean URLs enabled)')
    httpd.serve_forever()
