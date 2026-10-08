import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config for server-side lookup
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Real Dynamic QR Code Backend Redirection: /q/:code
  app.get('/q/:code', async (req, res, next) => {
    const rawCode = req.params.code;
    const cleanCode = rawCode.replace(/^(QR-|PLACA-)/i, '').padStart(6, '0');

    if (firebaseConfig.projectId && firebaseConfig.firestoreDatabaseId && firebaseConfig.apiKey) {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/qrCodes/${cleanCode}?key=${firebaseConfig.apiKey}`;
        const response = await fetch(firestoreUrl);

        if (response.ok) {
          const docData = await response.json();
          const status = docData?.fields?.status?.stringValue;
          const targetUrl = docData?.fields?.targetUrl?.stringValue;

          if (status === 'active' && targetUrl && targetUrl.trim()) {
            let destination = targetUrl.trim();
            if (!destination.match(/^https?:\/\//i)) {
              destination = 'https://' + destination;
            }

            // Perform instant HTTP 302 redirection to customer's destination
            return res.redirect(302, destination);
          }
        }
      } catch (err) {
        console.error('Server redirect lookup error:', err);
      }
    }

    // If not active or link is pending, pass through to SPA frontend
    next();
  });

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
