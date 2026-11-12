const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

let lastQR = '';

function findChrome() {
  const bases = [
    '/opt/render/.cache/puppeteer',
    path.join(__dirname, '.cache', 'puppeteer'),
    path.join(process.cwd(), '.cache', 'puppeteer'),
    '/root/.cache/puppeteer',
    path.join(process.env.HOME || '/tmp', '.cache', 'puppeteer')
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
  return null;
}

let chromePath = findChrome();
console.log('Chrome check 1:', chromePath || 'NOT FOUND - installing now...');

// AUTO-INSTALL CHROME IF MISSING - This is the fix
if (!chromePath) {
  try {
    console.log('Installing Chrome... this takes 1-2 min, please wait...');
    execSync('npx --yes puppeteer browsers install chrome', { stdio: 'inherit', timeout: 180000 });
    chromePath = findChrome();
    console.log('Chrome check 2:', chromePath || 'STILL NOT FOUND');
  } catch (e) {
    console.log('Chrome install failed:', e.message);
    // Try second method - whatsapp-web.js own puppeteer
    try {
      execSync('node -e "require(\'./node_modules/whatsapp-web.js/node_modules/puppeteer\').browsers?.install ? console.log(\'trying alt\') : 0"', { stdio: 'inherit' });
    } catch (e2) {}
  }
}

app.get('/', (req, res) => {
  if (!lastQR) {
    return res.send('<h2>Bot is starting... installing Chrome, wait 2 min and refresh</h2><p>Chrome: ' + (chromePath || 'installing...') + '</p>');
  }
  qrcode.toDataURL(lastQR, (err, url) => {
    if (err) return res.send('QR Error');
    res.send(`<h2>Scan this QR with BOT phone</h2><img src="${url}" style="width:300px"><br><p>Refresh if QR expires</p>`);
  });
});

app.listen(PORT, () => console.log('Server on ' + PORT));

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    executablePath: chromePath || undefined,
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
client.on('authenticated', () => { console.log('Authenticated - SUCCESS'); lastQR = ''; });
client.on('ready', () => { console.log('Client is ready - BOT IS ONLINE ✅'); });
client.on('auth_failure', (msg) => { console.log('Auth failed:', msg); });
client.on('disconnected', (reason) => { console.log('Disconnected:', reason); });

client.on('message', async (msg) => {
  try {
    if (msg.fromMe) return;
    const body = msg.body.trim().toLowerCase();
    console.log('Message received:', body, 'from:', msg.from);
    if (body === '!ping') await msg.reply('🏓 Pong! Bot is ONLINE ✅');
    if (body === '!help' || body === '!menu') await msg.reply(`🤖 *KSSR CUP BOT*\n\n!ping - Check bot online\n!help - Show this menu\n!menu - Show this menu\n!rules - Group rules`);
    if (body === '!rules') await msg.reply('📋 *KSSR CUP Rules*\n1. Respect everyone\n2. No spam\n3. Enjoy the game ⚽');
  } catch (e) { console.log('Message error:', e.message); }
});

client.initialize();
