const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const app = express();
let pairingCode = 'STARTING... PLEASE WAIT 15 SEC';
let isOnline = false;
let sock = null;
let pairingDone = false;

async function startBot() {
  if (sock) return; // STOP double socket - this was the bug
  console.log('Starting bot...');
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ['KSSR BOT','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    if (!connection) return; // ignore undefined - this was spamming logs

    console.log('Connection:', connection);

    if (connection === 'connecting' && !sock.authState.creds.registered && !pairingDone) {
      pairingDone = true;
      console.log('Waiting 8 sec for WhatsApp server...');
      setTimeout(async () => {
        try {
          pairingCode = await sock.requestPairingCode('9779748710002');
          console.log('=== PAIRING CODE: ' + pairingCode + ' ===');
          console.log('ENTER THIS IN PHONE WITHIN 40 SEC');
        } catch(e){ console.log('Pairing failed, will retry on restart'); pairingDone = false; }
      }, 8000);
    }

    if (connection === 'open') {
      isOnline = true;
      pairingCode = 'CONNECTED';
      console.log('BOT IS ONLINE ✅✅✅');
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('Closed code:', code);
      sock = null;
      pairingDone = false;
      if (code === DisconnectReason.loggedOut) {
        const fs = require('fs');
        try { fs.rmSync('auth', { recursive: true, force: true }); } catch(e){}
      }
      // Wait 10 sec before ONE restart - no loop
      setTimeout(() => { if (!isOnline) startBot(); }, 10000);
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
  res.send(`<h1>KSSR BOT</h1><h2 style="font-size:50px">${isOnline ? 'ONLINE ✅' : 'CODE: ' + pairingCode}</h2><p>Do NOT refresh too much. Code lives 40 sec.</p>`);
});
app.listen(10000);
