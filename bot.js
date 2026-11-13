const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const app = express();
let qrImage = '';
let isOnline = false;
let sock = null;

async function startBot() {
  if (sock) return;
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ['KSSR BOT','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      qrImage = await QRCode.toDataURL(qr);
      console.log('NEW QR READY');
    }
    if (connection === 'open') { isOnline = true; qrImage = ''; console.log('BOT IS ONLINE ✅'); }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      sock = null;
      if (code === DisconnectReason.loggedOut) {
        const fs = require('fs');
        try { fs.rmSync('auth', { recursive: true, force: true }); } catch(e){}
      }
      setTimeout(() => { if (!isOnline) startBot(); }, 5000);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (text.trim() === '!ping') await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong! Bot is ONLINE ✅' });
  });
}
startBot();

app.get('/', (req,res) => {
  if (isOnline) return res.send('<h1>BOT IS ONLINE ✅</h1>');
  if (!qrImage) return res.send('<h1>Starting... Refresh in 10 sec</h1>');
  res.send(`<h1>Scan with 9748710002</h1><img src="${qrImage}" style="width:300px"><p>Refresh if QR expires</p>`);
});
app.listen(10000);
