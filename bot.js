const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Keep Render alive
const app = express();
app.get('/', (req, res) => res.send('🤖 KSSR BOT is Running!'));
app.listen(process.env.PORT || 3000, () => console.log('Server running'));

const client = new Client({
    authStrategy: new LocalAuth(),
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
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 KSSR BOT is Ready!');
});

client.on('message', async (msg) => {
    const text = msg.body.toLowerCase().trim();
    const chat = await msg.getChat();

    // Only reply in groups or DM
    if (text === 'hi' || text === 'hello' || text === 'hey') {
        msg.reply('Hello! 👋 I am 🤖 *KSSR BOT*\nHow can I help you?');
    }
    else if (text === 'help' || text === 'menu') {
        msg.reply('🤖 *KSSR BOT MENU*\n\nType:\n*hi* - Say Hello\n*help* - Show Menu\n*ping* - Check Bot\n*owner* - Owner Info');
    }
    else if (text === 'ping') {
        msg.reply('Pong! 🏓 Bot is Online 24/7');
    }
    else if (text === 'owner') {
        msg.reply('👑 Owner: KSSR\n📍 Butwal, Nepal');
    }
});

client.initialize();