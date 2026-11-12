const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

let lastQR = '';
let isReady = false;

// NEW: QR WEBSITE PAGE
app.get('/', async (req, res) => {
    if (isReady) {
        return res.send('<h1>✅ Bot Connected!</h1><p>WhatsApp is linked.</p>');
    }
    if (!lastQR) {
        return res.send('<h1>Waiting for QR...</h1><p>Refresh in 5 sec</p><script>setTimeout(()=>location.reload(), 5000)</script>');
    }
    const img = await QRCode.toDataURL(lastQR, { width: 400, margin: 2 });
    res.send(`
        <div style="text-align:center; font-family:sans-serif; padding:20px;">
            <h1>Scan This QR</h1>
            <img src="${img}" style="width:320px; height:320px; border:10px solid white; box-shadow:0 0 20px #ccc;">
            <p>WhatsApp > Linked Devices > Link a Device</p>
            <p>Auto-refresh in 15 sec</p>
        </div>
        <script>setTimeout(()=>location.reload(), 15000)</script>
    `);
});

app.listen(PORT, () => console.log('Server running on ' + PORT));

console.log('Chrome path: ' + puppeteer.executablePath());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: puppeteer.executablePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    }
});

client.on('qr', (qr) => {
    lastQR = qr;
    isReady = false;
    console.log('NEW QR generated - open website to scan');
});

client.on('ready', () => {
    isReady = true;
    lastQR = '';
    console.log('Bot is READY!');
});

client.on('authenticated', () => {
    console.log('Authenticated ✅');
});

client.on('message', async (msg) => {
    if (msg.body.toLowerCase() === 'hi') {
        msg.reply('Hello! Bot is working ✅');
    }
});

client.initialize();
