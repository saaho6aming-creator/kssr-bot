const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let lastQR = '';

app.get('/', (req, res) => {
  if (!lastQR) {
    return res.send('<h2>Bot is starting... wait 30 sec and refresh</h2>');
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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--safebrowsing-disable-auto-update'
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
      await msg.reply(
        `🤖 *KSSR CUP BOT*\n\n` +
        `!ping - Check bot online\n` +
        `!help - Show this menu\n` +
        `!menu - Show this menu\n` +
        `!rules - Group rules`
      );
    }
    if (body === '!rules') {
      await msg.reply('📋 *KSSR CUP Rules*\n1. Respect everyone\n2. No spam\n3. Enjoy the game ⚽');
    }
  } catch (e) {
    console.log('Message error:', e.message);
  }
});

client.initialize();
