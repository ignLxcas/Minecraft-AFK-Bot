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
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 10000;

function createBot() {
  console.log(`🔄 Intentando conectar al servidor ${config.serverHost}:${config.serverPort}...`);

  bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username: config.botUsername,
    auth: 'offline',
    version: '1.21.5',          // <--- VERSIÓN CORRECTA PARA 26.1.2
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
    startAFKRoutine();
  });

  bot.on('error', (err) => {
    console.error('⚠️ Error:', err.message);
    if (err.message.includes('ECONNRESET') || err.message.includes('throttled')) {
      console.log('🔄 Conexión bloqueada. Esperando 60 segundos...');
      setTimeout(reconnectBot, 60000);
    } else {
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
// RUTINA AFK
// ============================================
function startAFKRoutine() {
  console.log('🔄 Iniciando rutina AFK...');
  setInterval(() => {
    if (!bot || !bot.entity) return;
    const direction = Math.random() < 0.5 ? 'forward' : 'back';
    bot.setControlState('forward', false);
    bot.setControlState('back', false);
    bot.setControlState(direction, true);
    setTimeout(() => {
      if (bot && bot.entity) {
        bot.setControlState(direction, false);
      }
    }, 500);
  }, 5000);
  
  setInterval(() => {
    if (bot && bot.chat) {
      const messages = [
        '💤 AFK - Manteniendo servidor activo',
        '🤖 Bot de mantenimiento',
        '🔄 Manteniendo CPU activa',
        '📡 Servidor online 24/7'
      ];
      bot.chat(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, 120000);
}

// ============================================
// INICIO
// ============================================
console.log('🤖 Bot de mantenimiento iniciado!');
createBot();
