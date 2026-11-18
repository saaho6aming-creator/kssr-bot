const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const pino = require('pino');

let sock = null;
let users = {};
const TROPHY_LINK = 'https://kssrcuptrophy.netlify.app/?board=main';
const POINTS_LINK = 'https://kssrleaguestanding.netlify.app';
const BOT_NUMBER = '9779748710002';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false, browser: ['KSSR BOT', 'Chrome', '1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      sock = null;
      if (code === DisconnectReason.loggedOut) { try { fs.rmSync('auth', { recursive: true, force: true }); } catch {} }
      setTimeout(() => { if (!sock) startBot(); }, 3000);
    }
    if (connection === 'open') console.log('✅ KSSR BOT ONLINE!');
  });
  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(BOT_NUMBER);
        console.log('====================================');
        console.log('YOUR PAIRING CODE IS: ' + code);
        console.log('====================================');
      } catch (e) { console.log('Pairing error:', e.message); }
    }, 5000);
  }
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const rawText = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const text = rawText.trim();
    const lower = text.toLowerCase();
    if (users[from] && users[from].waitingTeam && !lower.startsWith('!')) {
      users[from].team = text; users[from].waitingTeam = false;
      await sock.sendMessage(from, { text: `✅ TEAM NAME SAVED! ✅\n\nHello ${users[from].name} 👋\nYour Team: *${text}*\n\n🏆 Trophy Board:\n${TROPHY_LINK}\n\n📊 Points Table:\n${POINTS_LINK}\n\nStay Active! ⚽` });
      return;
    }
    if (text === '!ping') await sock.sendMessage(from, { text: '🏓 Pong! KSSR Bot is Online!' });
    if (text === '!help') await sock.sendMessage(from, { text: `🏆 KSSR CUP BOT 🏆\n\n!help - Show menu\n!rules - Rules & Notice\n!trophy - Trophy Info\n!warning - Warning Rules\n!fixtures - Fixtures\n!points - Points Table\n!register YourName - Register` });
    if (text === '!trophy') await sock.sendMessage(from, { text: `🏆 KSSR CUP - TROPHY INFO 🏆\n\n🥇 Winner: Champion Trophy + Cash Prize\n🥈 Runner Up: Trophy + Cash Prize\n⭐ Best Player\n⚽ Top Scorer\n🧤 Best Goalkeeper\n\n👉 Live Trophy Board:\n${TROPHY_LINK}\n\nType !register to join Next Season!` });
    if (text === '!warning') await sock.sendMessage(from, { text: `⚠️ KSSR CUP - WARNING RULES ⚠️\n\n🚨 QUIT / BACK OUT WARNING:\n\n- 1 Game Back = 2 POINTS DEDUCTED\n- 2 Or More Games Back = SUSPENDED NEXT SEASON\n\n- No Show Without Info = 3 POINTS DEDUCTED\n\nPlay Fair! Don't Back Out! ⚽\nKSSR CUP` });
    if (text === '!rules') await sock.sendMessage(from, { text: `🏆 KSSR CUP - IMPORTANT RULES & NOTICE 🏆\nPlease Read Carefully\n\n1️⃣ NO SHOW\nIf a player does not come to play,\n3 POINTS will be deducted. (Inform 24 hrs before)\n\n2️⃣ EMERGENCY\nIf you have an emergency, please inform us in the group.\n\n3️⃣ QUIT / BACK OUT\n- If a player backs out 1 game, his 2 POINTS will be deducted.\n- If a player backs out 2 or more games, he will be SUSPENDED in next season.\n\n4️⃣ TEAM & LOGO\nAll players should use unique club logo and don't use Nepali flag. The team name and club logo will be similar.\n\n5️⃣ GAME DURATION\nThe game duration should be 13 MINUTES.\n\n6️⃣ PLAYER CONDITION\nPlayer condition should be NORMAL.\n\n7️⃣ DON'T USE SMART ASSIST\nDon't use Smart Assist in the game.\n\nSTAY ACTIVE • PLAY FAIR • RESPECT THE GAME\nKSSR CUP ⚽` });
    if (text === '!fixtures') await sock.sendMessage(from, { text: `⚽ KSSR CUP FIXTURES - SEASON 9 ⚽\n6 Teams • 8 Matchdays • 15 Matches\n\nNov 17: Lumbini Lions vs Easy Game ⭐ SEASON OPENER\n\nNov 18:\nLumbini Lions vs Panda FC\nDream Star City vs Easy Game\n\nNov 19:\nBlue FC vs Dil Ka Deewana\nLumbini Lions vs Dream Star City\n\nNov 20:\nEasy Game vs Blue FC\nPanda FC vs Dil Ka Deewana\n\nNov 21:\nLumbini Lions vs Dil Ka Deewana\nDream Star City vs Blue FC\n\nNov 22:\nPanda FC vs Dream Star City\nEasy Game vs Dil Ka Deewana\n\nNov 23:\nLumbini Lions vs Blue FC\nEasy Game vs Panda FC\n\nNov 24:\nDil Ka Deewana vs Dream Star City\nBlue FC vs Panda FC\n\nCheck !points for Table 🏆` });
    if (text === '!points') await sock.sendMessage(from, { text: `🏆 KSSR CUP - POINTS TABLE 🏆\n\n📊 Live Points Table:\n${POINTS_LINK}\n\n🏆 Live Trophy Board:\n${TROPHY_LINK}\n\nType !fixtures for Next Match!` });
    if (lower.startsWith('!register')) {
      let regName = text.replace(/!register/i, '').trim();
      if (!regName) { await sock.sendMessage(from, { text: 'Type like this:\n!register YourName\nExample: !register Nirvan Shah' }); return; }
      users[from] = { name: regName, team: '', waitingTeam: true };
      await sock.sendMessage(from, { text: `✅ REGISTRATION DONE! ✅\n\nHello ${regName} 👋\nYou are registered for KSSR CUP NEXT SEASON!\n\n📩 Now send your Team Name\nYour registered name will be used directly for Table / Fixtures.\n\n🏆 Trophy Board:\n${TROPHY_LINK}\n\nStay Active! ⚽` });
    }
    if (text === '!myteam') {
      if (users[from] && users[from].team) await sock.sendMessage(from, { text: `Your Team: *${users[from].team}*\nRegistered as: ${users[from].name}` });
      else await sock.sendMessage(from, { text: 'You are not registered yet.\nType: !register YourName' });
    }
  });
}
startBot();
