const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const app = express();
let pairingCode = '';
let isOnline = false;
let sock;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['KSSR BOT','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  // If not logged in, ask for pairing code
  if (!sock.authState.creds.registered) {
    const number = '97798XXXXXXXX'; // <-- PUT BOT NUMBER HERE without + , example 9779800000000
    setTimeout(async () => {
      try {
        pairingCode = await sock.requestPairingCode(number);
        console.log('PAIRING CODE: ' + pairingCode);
      } catch(e){ console.log(e); }
    }, 3000);
  }

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') { isOnline = true; pairingCode = ''; console.log('BOT IS ONLINE ✅'); }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Disconnected, reconnect:', shouldReconnect);
      if (shouldReconnect) startBot();
      else { console.log('LOGGED OUT - delete auth folder'); }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (text.trim() === '!ping') {
      await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong! Bot is ONLINE ✅' });
    }
    if (text.trim() === '!help') {
      await sock.sendMessage(m.key.remoteJid, { text: 'KSSR CUP BOT\n!ping - check online\n!help - menu' });
    }
  });
}
startBot();

app.get('/', (req,res) => {
  res.send(`<h1>KSSR BOT</h1><h2>${isOnline ? 'ONLINE ✅' : 'Pairing Code: ' + pairingCode}</h2><p>Refresh page for code</p>`);
});
app.listen(10000, () => console.log('Web on 10000'));
