'use strict';

const https = require('https');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const DIRECT_LINE_SECRET = process.env.DIRECT_LINE_SECRET;

if (!DIRECT_LINE_SECRET) {
  console.error('DIRECT_LINE_SECRET environment variable is required');
  process.exit(1);
}

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.post('/token', (_req, res) => {
  const options = {
    hostname: 'directline.botframework.com',
    path: '/v3/directline/tokens/generate',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DIRECT_LINE_SECRET}`,
      'Content-Type': 'application/json',
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      if (response.statusCode === 200) {
        try {
          const body = JSON.parse(data);
          res.json({ token: body.token });
        } catch {
          res.status(502).json({ error: 'Invalid response from Direct Line API' });
        }
      } else {
        res.status(502).json({ error: 'Token exchange failed', upstream: response.statusCode });
      }
    });
  });

  request.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  request.end();
});

app.listen(PORT, () => {
  console.log(`Token server listening on port ${PORT}`);
});
