const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const app = express();
let qrImage = '';
let isOnline = false;
let sock = null;

// ===== DAILY UPDATE HERE - CHANGE ONLY THIS =====
let POINTS_TABLE = `🏆 *KSSR CUP - POINTS TABLE* 🏆
📅 Updated: Nov 17

1. Lumbini Lions - 3 Pts - 1 Match
2. Easy Game - 0 Pts - 1 Match
3. Panda FC - 0 Pts - 0 Match
4. Blue FC - 0 Pts - 0 Match
5. Dream Star City - 0 Pts - 0 Match
6. Dil Ka Deewana - 0 Pts - 0 Match

Top Scorer: - 
Next Match: Check !fixtures`;
// ================================================

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
      isOnline = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      sock = null;
      if (code === DisconnectReason.loggedOut) {
        try { fs.rmSync('auth', { recursive: true, force: true }); } catch(e){}
      }
      setTimeout(() => { if (!isOnline) startBot(); }, 5000);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const rawText = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const text = rawText.trim().toLowerCase();

    if (text === '!ping') await sock.sendMessage(from, { text: '🏓 Pong! Bot is ONLINE ✅' });

    // !help
    if (text === '!help') {
      await sock.sendMessage(from, { text: `🏆 *KSSR CUP BOT* 🏆\n\n!help - Show menu\n!trophy - Trophy Info\n!warning - Warning Rules\n!fixtures - Fixtures\n!points - Points Table\n!register YourName - Register for Next Season` });
    }

    // !trophy
    if (text === '!trophy') {
      await sock.sendMessage(from, { text: `🏆 *KSSR CUP - TROPHY INFO* 🏆\n\n🥇 Winner: Champion Trophy + Cash Prize\n🥈 Runner Up: Trophy + Cash Prize\n⭐ Best Player\n⚽ Top Scorer\n🧤 Best Goalkeeper\n\n👉 *Live Trophy Board:*\nhttps://kssrcuptrophy.netlify.app/?board=main\n\nType !register to join Next Season!` });
    }

    // !warning
    if (text === '!warning') {
      await sock.sendMessage(from, { text: `⚠️ *KSSR CUP - WARNING RULES* ⚠️\n\n🟨 1 Yellow Card = Warning\n🟨🟨 2 Yellow = 1 Match Suspended\n🟥 Red Card = 1 Match Suspended + Fine\n🥊 Fighting / Bad Behaviour = Disqualify\n\nPlay Clean, Play Fair! ⚽\nRespect Referee Decision.` });
    }

    // !fixtures - WITH PHOTO
    if (text === '!fixtures') {
      try {
        await sock.sendMessage(from, {
          image: fs.readFileSync('./fixtures.jpg'),
          caption: `⚽ *KSSR CUP - SEASON 9 FIXTURES* ⚽\n\n📅 Nov 17 - Nov 24\n🏟️ 6 Teams • 15 Matches\n\n🔥 Opener: Lumbini Lions vs Easy Game\nFull Schedule in Photo 👆\n\nType !points for Points Table`
        });
      } catch (e) {
        await sock.sendMessage(from, { text: `⚽ *KSSR CUP FIXTURES*\n\nNov 17: Lumbini Lions vs Easy Game\nNov 18: Blue FC vs Dream Star City\nNov 18: Dil Ka Deewana vs Panda FC\n\nPhoto coming soon!` });
      }
    }

    // !points - TEXT ONLY, CHANGES DAILY
    if (text === '!points') {
      await sock.sendMessage(from, { text: POINTS_TABLE });
    }

    // !register
    if (text.startsWith('!register')) {
      let name = rawText.replace(/!register/i, '').trim();
      if (!name || name.toLowerCase() === 'me') name = m.pushName || "Player";
      try { fs.appendFileSync('./registrations.txt', `${name} - ${new Date().toLocaleString()}\n`); } catch(e){}
      await sock.sendMessage(from, { text: `✅ *REGISTRATION DONE!* ✅\n\nHello ${name} 👋\nYou are registered for *KSSR CUP NEXT SEASON!*\n\n🏆 Trophy Board:\nhttps://kssrcuptrophy.netlify.app/?board=main` });
    }

  });
}
startBot();

app.get('/', (req,res) => {
  if (isOnline) return res.send('<h1>BOT IS ONLINE ✅</h1>');
  if (!qrImage) return res.send('<h1>Starting... Refresh in 10 sec</h1>');
  res.send(`<h1>Scan with 9748710002</h1><img src="${qrImage}" style="width:300px"><p>Refresh if QR expires</p>`);
});
app.listen(10000);
