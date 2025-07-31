

---

#  App de Control de Ventana Automática (React Native + Expo)

Este proyecto es una **aplicación móvil desarrollada con React Native y Expo** que permite controlar un mecanismo de apertura/cierre de una ventana mediante el protocolo **MQTT**.

La app se comunica con un microcontrolador **ESP32** que ejecuta la lógica física del sistema.

---

##  Funcionalidades principales

* Conectar con un broker MQTT (público o privado).
* Abrir o cerrar la ventana manualmente (0–100%).
* Activar o desactivar el modo automático.
* Configurar tramos horarios y parámetros del algoritmo de apertura.
* Recibir el estado actual del mecanismo en tiempo real.

---

##  Estructura destacada del proyecto

* **`/services/mqttService.ts`**:
  Archivo central que gestiona la conexión con el broker MQTT, la suscripción a los topics y la publicación de mensajes desde cualquier pantalla.

* **Pantallas principales**:

  * `HomeScreen.tsx`: Control de la ventana en tiempo real.
  * `SettingsScreen.tsx`: Configuración de horarios, modo automático y pesos del algoritmo.

---

##  Configuración de `mqttService.ts`

Antes de ejecutar la app, debes configurar el archivo **`/services/mqttService.ts`** con los datos de tu broker MQTT:

```ts
const WS_HOST = 'wss://<tu-broker-mqtt>:<puerto>';
const MQTT_USER = '<usuario>';
const MQTT_PASS = '<contraseña>';

export const client: MqttClient = mqtt.connect(WS_HOST, {
  username: MQTT_USER,
  password: MQTT_PASS,
  keepalive: 60,
  reconnectPeriod: 2000,
  clientId: 'expo-' + Date.now(),
});
```

### Topics usados

* **Publicación**:

  * `casa/ventana/cmd` → posición de la ventana (0–100)
  * `casa/ventana/modo/estado` → `"auto"` / `"manual"`
  * `casa/ventana/horario/*` → configuración de horarios
  * `casa/ventana/peso/*` → parámetros del algoritmo

* **Suscripción**:

  * `casa/ventana/estado` → posición actual
  * `casa/ventana/modo/estado` → estado del modo
  * `casa/ventana/evento` → eventos o notificaciones desde el ESP32

---

## ▶️ Ejecución del proyecto

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Iniciar Expo:

   ```bash
   npx expo start
   ```

3. Escanear el código QR con la app **Expo Go** en el móvil o ejecutar en un emulador.

---

## 🔗 Requisitos

* Node.js >= 16
* Expo CLI
* Un broker MQTT (p. ej. [Mosquitto](https://test.mosquitto.org/) o [HiveMQ Cloud](https://www.hivemq.com/cloud/)) activo.

---

