const mineflayer = require('mineflayer');
const config = require('./config.json');

// ============================================
// CONFIGURACIÓN DEL BOT
// ============================================
const bot = mineflayer.createBot({
  host: config.serverHost,
  port: config.serverPort,
  username: config.botUsername,
  auth: 'offline',
  version: false,
  viewDistance: config.botChunk || 4,
  checkTimeoutInterval: 60000,  // Timeout más largo
  hideErrors: true
});

// ============================================
// VARIABLES DE ESTADO
// ============================================
let movementPhase = 0;
let isJumping = false;
let isSneaking = false;
let isSprinting = false;
let currentDirection = 0;
const DIRECTIONS = ['forward', 'back', 'left', 'right'];

// ============================================
// CONFIGURACIÓN DE MOVIMIENTO (MÁS REALISTA)
// ============================================
const CONFIG = {
  stepInterval: 2000,           // 2 segundos entre cambios
  jumpDuration: 800,           // Duración del salto
  sneakDuration: 3000,         // Tiempo agachado
  sprintDuration: 4000,        // Tiempo de sprint
  moveDistance: 5,             // Distancia a moverse
  lookInterval: 5000,          // Mirar alrededor
  afkMessageInterval: 120000   // Mensaje AFK cada 2 min
};

// ============================================
// EVENTOS DEL BOT
// ============================================

// Cuando el bot aparece en el mundo
bot.on('spawn', () => {
  console.log(`✅ ${config.botUsername} está listo!`);
  console.log(`📍 Posición: ${bot.entity.position}`);
  
  // Esperar a que el mundo cargue
  setTimeout(() => {
    startAFKRoutine();
  }, 3000);
});

// Cuando el bot recibe daño
bot.on('health', () => {
  if (bot.health < 10) {
    console.log(`⚠️ El bot tiene poca vida (${bot.health})`);
    bot.setControlState('sneak', true);
  }
});

// Manejo de errores
bot.on('error', (err) => {
  console.error('⚠️ Error:', err.message);
});

bot.on('end', () => {
  console.log('⛔️ Bot desconectado!');
  // Intentar reconectar después de 30 segundos
  setTimeout(() => {
    console.log('🔄 Intentando reconectar...');
    bot.connect();
  }, 30000);
});

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function startAFKRoutine() {
  console.log('🔄 Iniciando rutina AFK...');
  
  // Iniciar ciclos
  movementCycle();
  lookAround();
  sendAFKMessage();
  checkPosition();
}

// ============================================
// CICLO DE MOVIMIENTO (MÁS REALISTA)
// ============================================
function movementCycle() {
  if (!bot.entity || !bot.entity.position) return;

  // Resetear todos los movimientos
  resetControls();

  // Calcular dirección aleatoria
  const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  const duration = CONFIG.stepInterval;

  // Movimiento base
  bot.setControlState(direction, true);
  
  // A veces corre
  if (Math.random() < 0.2) {
    bot.setControlState('sprint', true);
    setTimeout(() => {
      bot.setControlState('sprint', false);
    }, CONFIG.sprintDuration);
  }

  // A veces se agacha
  if (Math.random() < 0.15) {
    bot.setControlState('sneak', true);
    setTimeout(() => {
      bot.setControlState('sneak', false);
    }, CONFIG.sneakDuration);
  }

  // A veces salta
  if (Math.random() < 0.25) {
    bot.setControlState('jump', true);
    setTimeout(() => {
      bot.setControlState('jump', false);
    }, CONFIG.jumpDuration);
  }

  // A veces gira
  if (Math.random() < 0.3) {
    const yaw = Math.random() * Math.PI * 2;
    bot.look(yaw, 0);
  }

  // Programar siguiente ciclo
  setTimeout(movementCycle, duration + Math.random() * 1000);
}

// ============================================
// MIRAR ALREDEDOR
// ============================================
function lookAround() {
  if (!bot.entity) return;

  // Mirar en una dirección aleatoria
  const yaw = Math.random() * Math.PI * 2;
  const pitch = (Math.random() - 0.5) * 0.5;
  
  bot.look(yaw, pitch, true);

  // Programar próxima mirada
  setTimeout(lookAround, CONFIG.lookInterval + Math.random() * 3000);
}

// ============================================
// ENVIAR MENSAJE AFK
// ============================================
function sendAFKMessage() {
  if (!bot.whisper) return;

  const messages = [
    '💤 AFK - Manteniendo el servidor activo',
    '🤖 Bot de mantenimiento',
    '🔄 Manteniendo CPU activa',
    '📡 Servidor online 24/7'
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  bot.chat(randomMessage);

  setTimeout(sendAFKMessage, CONFIG.afkMessageInterval + Math.random() * 30000);
}

// ============================================
// VERIFICAR POSICIÓN (EVITA QUEDARSE ATRAPADO)
// ============================================
function checkPosition() {
  if (!bot.entity) return;

  const pos = bot.entity.position;
  console.log(`📍 Posición: ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`);

  // Si el bot está en un lugar por más de 10 segundos sin moverse
  if (bot.entity.velocity.x === 0 && bot.entity.velocity.z === 0) {
    // Intentar saltar para salir de cualquier bloqueo
    bot.setControlState('jump', true);
    setTimeout(() => {
      bot.setControlState('jump', false);
    }, 500);
  }

  setTimeout(checkPosition, 30000);
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function resetControls() {
  const controls = ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'];
  controls.forEach(control => {
    bot.setControlState(control, false);
  });
}

// ============================================
// COMANDOS (Desde la consola)
// ============================================
process.stdin.on('data', (data) => {
  const command = data.toString().trim();
  
  switch(command) {
    case 'stop':
      console.log('🛑 Deteniendo bot...');
      bot.quit();
      process.exit(0);
      break;
    case 'pos':
      if (bot.entity) {
        console.log(`📍 Posición: ${bot.entity.position}`);
      }
      break;
    case 'help':
      console.log('📋 Comandos disponibles:');
      console.log('  stop - Detener el bot');
      console.log('  pos  - Mostrar posición');
      console.log('  help - Mostrar ayuda');
      break;
    default:
      console.log('❌ Comando desconocido. Usa "help" para ver los comandos.');
  }
});

console.log('🤖 Bot de mantenimiento iniciado!');
console.log('📋 Comandos disponibles: stop, pos, help');
