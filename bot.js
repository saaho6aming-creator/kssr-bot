const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
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
    console.log('SCAN THIS QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is READY!');
});

client.on('message', async (msg) => {
    if (msg.body.toLowerCase() === 'hi') {
        msg.reply('Hello! Bot is working ✅');
    }
});

client.initialize();
