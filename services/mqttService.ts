import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
global.process = require('process');

import mqtt, { MqttClient } from 'mqtt/dist/mqtt';

// ========================
// 📡 Configuración Broker
// ========================
const WS_HOST = 'wss://ventanaiot.cloud.shiftr.io';

const MQTT_USER = 'ventanaiot';
const MQTT_PASS = '4orRA8Ga2donb2x5';

// ========================
// 🚀 Conexión MQTT
// ========================
export const client: MqttClient = mqtt.connect(WS_HOST, {
  username: MQTT_USER,
  password: MQTT_PASS,
  keepalive: 60,
  reconnectPeriod: 2000,
  clientId: 'expo-' + Date.now(),
});


// ========================
// 🔍 Depuración avanzada
// ========================
client.on('connect', () => {
  console.log('✅ MQTT conectado al broker:', WS_HOST);
  const topics = ['casa/ventana/estado', 'casa/ventana/modo/estado', 'casa/ventana/modo'];
  client.subscribe(topics, (err, granted) => {
    if (err) {
      console.error('❌ Error al suscribirse a topics:', err.message);
    } else {
      console.log('📡 Suscripción activa a', granted.map(g=>g.topic).join(', '));
    }
  });
});

client.on('reconnect', () => {
  console.warn('🔄 Intentando reconectar a MQTT...');
});

client.on('close', () => {
  console.warn('📴 Conexión MQTT cerrada');
});

client.on('disconnect', (packet) => {
  console.warn('🛑 Cliente desconectado', packet);
});

client.on('offline', () => {
  console.warn('⚠️ Cliente MQTT está offline');
});

client.on('error', (err) => {
  console.error('❌ Error de conexión MQTT:', err.message);
});

// ========================
// 📥 Recepción de mensajes
// ========================
let lastWindowState: string | null = null;
let lastAutoMode: 'auto' | 'manual' | null = null;
const listeners = new Set<(state: string) => void>();
const autoModeListeners = new Set<(mode: 'auto' | 'manual') => void>();

client.on('message', (topic: string, message: Buffer) => {
  console.log(`📥 Mensaje recibido → Topic: ${topic} | Payload: ${message.toString()}`);

  if (topic === 'casa/ventana/estado') {
    const state = message.toString();
    lastWindowState = state;
    listeners.forEach((fn) => fn(state));
  } else if (topic === 'casa/ventana/modo/estado' || topic === 'casa/ventana/modo') {
    const mode = message.toString() as 'auto' | 'manual';
    lastAutoMode = mode;
    autoModeListeners.forEach((fn) => fn(mode));
  }
});

// ========================
// 📤 Publicación de comandos
// ========================

export const setWindowState = (state: number | string) => {
  if (!client.connected) {
    console.warn('⚠️ MQTT no conectado');
    return;
  }

  let topic = 'casa/ventana/cmd';
  let payload = state.toString();

  // Si el payload es 'auto' o 'manual', lo mandamos por otro topic
  if (payload === 'auto' || payload === 'manual') {
    topic = 'casa/ventana/modo';
  }

  console.log(`📤 Publicando MQTT → ${topic} = ${payload}`);

  const publishOptions = payload === 'auto' || payload === 'manual'
    ? { qos: 0, retain: true }
    : { qos: 0 };

  client.publish(topic, payload, publishOptions, (err) => {
    if (err) {
      console.error('❌ Error al publicar:', err.message);
    } else {
      console.log('✅ Publicado correctamente');
    }
  });
};


// ========================
// 📡 Suscripción desde la app
// ========================

/**
 * Devuelve el último valor recibido del estado de la ventana ('0'-'100', etc)
 */
export function getLastWindowState(): string | null {
  return lastWindowState;
}

export function getLastAutoMode(): 'auto' | 'manual' | null {
  return lastAutoMode;
}

/**
 * Se suscribe a los cambios de estado de la ventana.
 * @param callback función a llamar cuando se reciba '0' o '1'
 * @returns función para desuscribirse
 */
export const onWindowState = (callback: (state: string) => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const onAutoMode = (callback: (mode: 'auto' | 'manual') => void) => {
  autoModeListeners.add(callback);
  return () => autoModeListeners.delete(callback);
};

