const mineflayer = require('mineflayer');
const config = require('./config.json');
const express = require('express');

// ============================================
// SERVIDOR HTTP PARA RENDER
// ============================================
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('🤖 Bot de mantenimiento activo!');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor HTTP escuchando en el puerto ${port}`);
});

// ============================================
// CONFIGURACIÓN DEL BOT
// ============================================
let bot = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

function createBot() {
  console.log(`🔄 Intentando conectar al servidor ${config.serverHost}:${config.serverPort}...`);

  bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username: config.botUsername,
    auth: 'offline',
    version: '1.21.4',          // <--- ESPECIFICADA PARA PURPUR 26.1.2
    viewDistance: config.botChunk || 4,
    checkTimeoutInterval: 120000,
    hideErrors: false,
    keepAlive: true
  });

  bot.on('connect', () => {
    console.log('🔗 Conectando al servidor...');
  });

  bot.on('spawn', () => {
    console.log(`✅ ${config.botUsername} está listo!`);
    console.log(`📍 Posición: ${bot.entity.position}`);
    reconnectAttempts = 0;
    setTimeout(startAFKRoutine, 3000);
  });

  bot.on('error', (err) => {
    console.error('⚠️ Error:', err.message);
    if (err.message.includes('ECONNRESET')) {
      console.log('🔄 El servidor cerró la conexión. Reconectando...');
      reconnectBot();
    }
  });

  bot.on('end', () => {
    console.log('⛔️ Bot desconectado!');
    reconnectBot();
  });

  bot.on('kicked', (reason) => {
    console.log(`🚫 El bot fue expulsado: ${reason}`);
    reconnectBot();
  });

  return bot;
}

function reconnectBot() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log(`❌ Demasiados intentos fallidos (${MAX_RECONNECT_ATTEMPTS}). Esperando 30 minutos...`);
    setTimeout(() => {
      reconnectAttempts = 0;
      reconnectBot();
    }, 1800000);
    return;
  }

  reconnectAttempts++;
  const delay = RECONNECT_DELAY * reconnectAttempts;
  console.log(`🔄 Reintentando en ${delay/1000} segundos... (Intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  
  setTimeout(() => {
    if (bot) bot.end();
    createBot();
  }, delay);
}

// ============================================
// RUTINA AFK DEL BOT
// ============================================
const CONFIG_BOT = {
  stepInterval: 2000,
  jumpDuration: 800,
  sneakDuration: 3000,
  sprintDuration: 4000,
  lookInterval: 5000,
  afkMessageInterval: 120000
};

function startAFKRoutine() {
  console.log('🔄 Iniciando rutina AFK...');
  movementCycle();
  lookAround();
  sendAFKMessage();
  checkPosition();
}

function movementCycle() {
  if (!bot || !bot.entity) {
    setTimeout(movementCycle, CONFIG_BOT.stepInterval);
    return;
  }

  ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'].forEach(c => {
    bot.setControlState(c, false);
  });

  const directions = ['forward', 'back', 'left', 'right'];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  bot.setControlState(direction, true);
  
  if (Math.random() < 0.2) {
    bot.setControlState('sprint', true);
    setTimeout(() => bot.setControlState('sprint', false), CONFIG_BOT.sprintDuration);
  }

  if (Math.random() < 0.15) {
    bot.setControlState('sneak', true);
    setTimeout(() => bot.setControlState('sneak', false), CONFIG_BOT.sneakDuration);
  }

  if (Math.random() < 0.25) {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), CONFIG_BOT.jumpDuration);
  }

  setTimeout(movementCycle, CONFIG_BOT.stepInterval + Math.random() * 1000);
}

function lookAround() {
  if (!bot || !bot.entity) {
    setTimeout(lookAround, CONFIG_BOT.lookInterval);
    return;
  }

  const yaw = Math.random() * Math.PI * 2;
  const pitch = (Math.random() - 0.5) * 0.5;
  bot.look(yaw, pitch, true);
  setTimeout(lookAround, CONFIG_BOT.lookInterval + Math.random() * 3000);
}

function sendAFKMessage() {
  if (!bot || !bot.chat) {
    setTimeout(sendAFKMessage, CONFIG_BOT.afkMessageInterval);
    return;
  }

  const messages = [
    '💤 AFK - Manteniendo el servidor activo',
    '🤖 Bot de mantenimiento',
    '🔄 Manteniendo CPU activa',
    '📡 Servidor online 24/7'
  ];
  bot.chat(messages[Math.floor(Math.random() * messages.length)]);
  setTimeout(sendAFKMessage, CONFIG_BOT.afkMessageInterval + Math.random() * 30000);
}

function checkPosition() {
  if (!bot || !bot.entity) {
    setTimeout(checkPosition, 30000);
    return;
  }

  const pos = bot.entity.position;
  console.log(`📍 Posición: ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`);

  if (bot.entity.velocity.x === 0 && bot.entity.velocity.z === 0) {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
  }

  setTimeout(checkPosition, 30000);
}

// ============================================
// INICIO
// ============================================
console.log('🤖 Bot de mantenimiento iniciado!');
createBot();
