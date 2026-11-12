const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

let lastQR = '';

// AUTO-FIND CHROME - This fixes "Could not find Chrome" forever
function findChrome() {
  const bases = [
    '/opt/render/.cache/puppeteer',
    path.join(__dirname, '.cache', 'puppeteer'),
    path.join(process.cwd(), '.cache', 'puppeteer'),
    '/root/.cache/puppeteer'
  ];
  for (const base of bases) {
    try {
      const chromeDir = path.join(base, 'chrome');
      if (!fs.existsSync(chromeDir)) continue;
      const versions = fs.readdirSync(chromeDir);
      for (const v of versions) {
        const p1 = path.join(chromeDir, v, 'chrome-linux', 'chrome');
        const p2 = path.join(chromeDir, v, 'chrome-linux64', 'chrome');
        if (fs.existsSync(p1)) return p1;
        if (fs.existsSync(p2)) return p2;
      }
    } catch (e) {}
  }
  return undefined;
}
const chromePath = findChrome();
console.log('Chrome found at:', chromePath || 'NOT FOUND - will use default');

app.get('/', (req, res) => {
  if (!lastQR) {
    return res.send('<h2>Bot is starting... wait 30 sec and refresh</h2><p>Chrome: ' + (chromePath || 'searching...') + '</p>');
  }
  qrcode.toDataURL(lastQR, (err, url) => {
    if (err) return res.send('QR Error');
    res.send(`<h2>Scan this QR with BOT phone</h2><img src="${url}" style="width:300px"><br><p>Refresh if QR expires</p>`);
  });
});

app.listen(PORT, () => console.log('Server on ' + PORT));

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    executablePath: chromePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('NEW QR generated - open website to scan');
  lastQR = qr;
});

client.on('authenticated', () => {
  console.log('Authenticated - SUCCESS');
  lastQR = '';
});

client.on('ready', () => {
  console.log('Client is ready - BOT IS ONLINE ✅');
});

client.on('auth_failure', (msg) => {
  console.log('Auth failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

client.on('message', async (msg) => {
  try {
    if (msg.fromMe) return;
    const body = msg.body.trim().toLowerCase();
    console.log('Message received:', body, 'from:', msg.from);
    if (body === '!ping') {
      await msg.reply('🏓 Pong! Bot is ONLINE ✅');
    }
    if (body === '!help' || body === '!menu') {
      await msg.reply(`🤖 *KSSR CUP BOT*\n\n!ping - Check bot online\n!help - Show this menu\n!menu - Show this menu\n!rules - Group rules`);
    }
    if (body === '!rules') {
      await msg.reply('📋 *KSSR CUP Rules*\n1. Respect everyone\n2. No spam\n3. Enjoy the game ⚽');
    }
  } catch (e) {
    console.log('Message error:', e.message);
  }
});

client.initialize();
