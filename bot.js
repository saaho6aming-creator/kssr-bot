const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const app = express();
let pairingCode = '';
let isOnline = false;
let sock;
let pairingTried = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ['KSSR BOT','Chrome','1.0'], syncFullHistory: false });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    console.log('Connection:', connection);

    // Ask for pairing code AFTER socket connects to WhatsApp server
    if (connection === 'connecting' && !sock.authState.creds.registered && !pairingTried) {
      pairingTried = true;
      setTimeout(async () => {
        try {
          pairingCode = await sock.requestPairingCode('9779748710002');
          console.log('PAIRING CODE: ' + pairingCode);
        } catch(e){ 
          console.log('Pairing failed, retrying...');
          pairingTried = false;
          setTimeout(() => startBot(), 5000);
        }
      }, 5000);
    }

    if (connection === 'open') { isOnline = true; pairingCode = ''; pairingTried = false; console.log('BOT IS ONLINE ✅'); }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('Disconnected code:', code);
      if (code === DisconnectReason.loggedOut || code === 428) {
        console.log('Deleting dead auth, restarting fresh...');
        try { fs.rmSync('auth', { recursive: true, force: true }); } catch(e){}
        pairingTried = false; pairingCode = '';
        setTimeout(() => startBot(), 3000);
      } else {
        setTimeout(() => startBot(), 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (text.trim() === '!ping') {
      await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong! Bot is ONLINE ✅' });
    }
  });
}
startBot();

app.get('/', (req,res) => {
  res.send(`<h1>KSSR BOT</h1><h2>${isOnline ? 'ONLINE ✅' : 'Pairing Code: ' + pairingCode}</h2><p>Refresh page for code</p>`);
});
app.listen(10000, () => console.log('Web on 10000'));
