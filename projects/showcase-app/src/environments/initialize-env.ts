import * as fs from 'fs';
import * as proc from 'process';

const envContent = `
export const envVars = {
  sessionDuration: ${proc.env['APP_SESSION_DURATION'] || 1200},
  warningDuration: ${proc.env['APP_WARNING_DURATION'] || 30},
  keepAliveDuration: ${proc.env['APP_KEEP_ALIVE_DURATION'] || 60},
  timeoutRequireConfirmation: ${proc.env['APP_TIMEOUT_REQUIRE_CONFIRMATION'] === 'true'},
};`;

fs.writeFileSync('./projects/showcase-app/src/environments/env.ts', envContent);

const manifestContent = `{
  "id": "/",
  "name": "${proc.env['APP_PWA_NAME'] || 'Showcase App'}",
  "short_name": "${proc.env['APP_PWA_SHORT_NAME'] || 'showcase-app'}",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "scope": "./",
  "start_url": "./",
  "icons": [
    {
      "src": "icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "screenshots": [
    {
      "src": "screenshots/mobile-1080x2048.png",
      "sizes": "1080x2048",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "screenshots/desktop-1440x900.png",
      "sizes": "1440x900",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
`;

fs.writeFileSync('./projects/showcase-app/public/manifest.webmanifest', manifestContent);
