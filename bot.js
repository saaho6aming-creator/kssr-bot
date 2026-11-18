const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/【entity-baileys¦canonical_name=Baileys】');
const fs = require('fs');
const pino = require('pino');

let sock = null;
let users = {}; // number -> { name, team, waitingTeam }

const TROPHY_LINK = 'https://kssrcuptrophy.netlify.app/?board=main';
const POINTS_LINK = 'https://kssrleaguestanding.netlify.app';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      sock = null;
      if (code === DisconnectReason.loggedOut) {
        try { fs.rmSync('auth', { recursive: true, force: true }); } catch {}
      }
      setTimeout(() => { if (!sock) startBot(); }, 3000);
    }
    if (connection === 'open') console.log('✅ KSSR BOT ONLINE!');
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const rawText = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // ===== TEAM NAME REPLY AFTER REGISTER =====
    if (users[from] && users[from].waitingTeam && !lower.startsWith('!')) {
      users[from].team = text;
      users[from].waitingTeam = false;
      await sock.sendMessage(from, { text:
`✅ TEAM NAME SAVED! ✅

Hello ${users[from].name} 👋
Your Team: *${text}*

Your team name will be used directly for Table / Fixtures.

🏆 Trophy Board:
${TROPHY_LINK}

📊 Points Table:
${POINTS_LINK}

Stay Active! ⚽` });
      return;
    }

    if (text === '!ping') await sock.sendMessage(from, { text: '🏓 Pong! KSSR Bot is Online!' });

    // !help
    if (text === '!help') {
      await sock.sendMessage(from, { text:
`🏆 KSSR CUP BOT 🏆

!help - Show menu
!rules - Rules & Notice
!trophy - Trophy Info
!warning - Warning Rules
!fixtures - Fixtures
!points - Points Table
!register YourName - Register for Next Season` });
    }

    // !trophy
    if (text === '!trophy') {
      await sock.sendMessage(from, { text:
`🏆 KSSR CUP - TROPHY INFO 🏆

🥇 Winner: Champion Trophy + Cash Prize
🥈 Runner Up: Trophy + Cash Prize
⭐ Best Player
⚽ Top Scorer
🧤 Best Goalkeeper

👉 Live Trophy Board:
${TROPHY_LINK}

Type !register to join Next Season!` });
    }

    // !warning - FIXED
    if (text === '!warning') {
      await sock.sendMessage(from, { text:
`⚠️ KSSR CUP - WARNING RULES ⚠️

🚨 QUIT / BACK OUT WARNING:

- 1 Game Back = 2 POINTS DEDUCTED
- 2 Or More Games Back = SUSPENDED NEXT SEASON

- No Show Without Info = 3 POINTS DEDUCTED

Play Fair! Don't Back Out! ⚽
KSSR CUP` });
    }

    // !rules - NEW
    if (text === '!rules') {
      await sock.sendMessage(from, { text:
`🏆 KSSR CUP - IMPORTANT RULES & NOTICE 🏆
Please Read Carefully

1️⃣ NO SHOW
If a player does not come to play,
3 POINTS will be deducted. (Inform 24 hrs before)

2️⃣ EMERGENCY
If you have an emergency, please inform us in the group.

3️⃣ QUIT / BACK OUT
- If a player backs out 1 game, his 2 POINTS will be deducted.
- If a player backs out 2 or more games, he will be SUSPENDED in next season.

4️⃣ TEAM & LOGO
All players should use unique club logo and don't use Nepali flag. The team name and club logo will be similar.

5️⃣ GAME DURATION
The game duration should be 13 MINUTES.

6️⃣ PLAYER CONDITION
Player condition should be NORMAL.

7️⃣ DON'T USE SMART ASSIST
Don't use Smart Assist in the game.

STAY ACTIVE • PLAY FAIR • RESPECT THE GAME
KSSR CUP ⚽` });
    }

    // !fixtures - FIXED
    if (text === '!fixtures') {
      await sock.sendMessage(from, { text:
`⚽ KSSR CUP FIXTURES - SEASON 9 ⚽
6 Teams • 8 Matchdays • 15 Matches

Nov 17: Lumbini Lions vs Easy Game ⭐ SEASON OPENER

Nov 18:
Lumbini Lions vs Panda FC
Dream Star City vs Easy Game

Nov 19:
Blue FC vs Dil Ka Deewana
Lumbini Lions vs Dream Star City

Nov 20:
Easy Game vs Blue FC
Panda FC vs Dil Ka Deewana

Nov 21:
Lumbini Lions vs Dil Ka Deewana
Dream Star City vs Blue FC

Nov 22:
Panda FC vs Dream Star City
Easy Game vs Dil Ka Deewana

Nov 23:
Lumbini Lions vs Blue FC
Easy Game vs Panda FC

Nov 24:
Dil Ka Deewana vs Dream Star City
Blue FC vs Panda FC

Check !points for Table 🏆` });
    }

    // !points - FIXED
    if (text === '!points') {
      await sock.sendMessage(from, { text:
`🏆 KSSR CUP - POINTS TABLE 🏆

📊 Live Points Table:
${POINTS_LINK}

🏆 Live Trophy Board:
${TROPHY_LINK}

Type !fixtures for Next Match!` });
    }

    // !register - FIXED
    if (lower.startsWith('!register')) {
      let regName = text.replace(/!register/i, '').trim();
      if (!regName) {
        await sock.sendMessage(from, { text: 'Type like this:\n!register YourName\nExample: !register Nirvan Shah' });
        return;
      }
      users[from] = { name: regName, team: '', waitingTeam: true };
      await sock.sendMessage(from, { text:
`✅ REGISTRATION DONE! ✅

Hello ${regName} 👋
You are registered for KSSR CUP NEXT SEASON!

📩 Now send your Team Name
Your registered name will be used directly for Table / Fixtures.

🏆 Trophy Board:
${TROPHY_LINK}

Stay Active! ⚽` });
    }

    // !myteam
    if (text === '!myteam') {
      if (users[from] && users[from].team) {
        await sock.sendMessage(from, { text: `Your Team: *${users[from].team}*\nRegistered as: ${users[from].name}` });
      } else {
        await sock.sendMessage(from, { text: 'You are not registered yet.\nType: !register YourName' });
      }
    }

  });
}
startBot();
