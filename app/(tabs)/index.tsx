import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

//import { setWindowState } from '@/services/mqttService'; // ✅ MQTT import

import { setWindowState, onWindowState, getLastWindowState, getLastAutoMode, onAutoMode } from '@/services/mqttService';
import { client } from '@/services/mqttService';


export default function HomeScreen() {
  const [co2Value, setCo2Value] = useState(650);
  const [tempInteriorValue, setTempInteriorValue] = useState(22.5);
  const [tempExteriorValue, setTempExteriorValue] = useState(0);
  const [vientoValue, setVientoValue] = useState(0);
  const [lluviaValue, setLluviaValue] = useState(0);
  const [humedadValue, setHumedadValue] = useState(0);

  const [windowPosition, setWindowPosition] = useState(0);
  const [autoMode, setAutoMode] = useState(false);
  const [mqttReady, setMqttReady] = useState(false);
  const windowWidth = useSharedValue(0);

  const windowStyle = useAnimatedStyle(() => ({
    width: `${windowWidth.value}%`,
  }));

  // ✅ Publica comando MQTT además de actualizar UI
 /* const handleAbrir = () => {
    setWindowPosition(100);
    windowWidth.value = withSpring(100);
    setAutoMode(false);
    setWindowState('1'); // <-- MQTT comando: abrir
  };

  const handleCerrar = () => {
    setWindowPosition(0);
    windowWidth.value = withSpring(0);
    setAutoMode(false);
    setWindowState('0'); // <-- MQTT comando: cerrar
  };

  const handleAutomatico = () => {
    setAutoMode(!autoMode);
  };

  const handleQuickPosition = (position) => {
    setWindowPosition(position);
    windowWidth.value = withSpring(position);
    setAutoMode(false);
    setWindowState(position >= 50 ? '1' : '0'); // <-- simplificado por umbral
  };*/

  const handleAbrir = () => {
    setWindowPosition(100);
    windowWidth.value = withSpring(100);
    setAutoMode(false);
    setWindowState('100'); // ⬅️ Enviamos "100" como string
  };
  
  const handleCerrar = () => {
    setWindowPosition(0);
    windowWidth.value = withSpring(0);
    setAutoMode(false);
    setWindowState('0'); // ⬅️ Enviamos "0"
  };

  /*const handleAutomatico = () => {
    setAutoMode(!autoMode);
  };*/

  const handleAutomatico = () => {
    const nuevoModo = !autoMode;
    setAutoMode(nuevoModo);
  
    const modoStr = nuevoModo ? 'auto' : 'manual';
    setWindowState(modoStr); // ⬅️ Aquí adaptamos `setWindowState` para enviar modo
  };
  
  
  const handleQuickPosition = (position: number) => {
    setWindowPosition(position);
    windowWidth.value = withSpring(position);
    setAutoMode(false);
    setWindowState(position.toString()); // ⬅️ Convertimos número a string
  };
  

  useEffect(() => {
    // Handler para cuando el cliente MQTT ya está conectado
    const initFromMqtt = () => {
      // posición ventana
      const lastPos = getLastWindowState();
      if (lastPos !== null) {
        setWindowPosition(Number(lastPos));
        windowWidth.value = withSpring(Number(lastPos));
      }
      // modo automático
      const lastMode = getLastAutoMode();
      if (lastMode !== null) {
        setAutoMode(lastMode === 'auto');
      }
      setMqttReady(true);
    };

    if (client.connected) {
      initFromMqtt();
    } else {
      client.once('connect', initFromMqtt);
    }

    // Suscripción en tiempo real
    const unsubscribeState = onWindowState((state) => {
      setWindowPosition(Number(state));
      windowWidth.value = withSpring(Number(state));
    });
    const unsubscribeMode = onAutoMode((mode) => {
      setAutoMode(mode === 'auto');
    });

    return () => {
      unsubscribeState();
      unsubscribeMode();
      client.removeListener('connect', initFromMqtt as any);
    };
  }, []);

  useEffect(() => {
    const fetchTTNData = async () => {
      try {
        const response = await fetch(
          'https://eu1.cloud.thethings.network/api/v3/as/applications/estacionmeteorologica-miguel/devices/estacionmiguel/packages/storage/uplink_message?last=10m',
          {
            headers: {
              Authorization:
                'Bearer NNSXS.DQE2PFRZR62ZFUUGFH5Y7VTP43WNHT6KNUBONAA.LGKMGIK4FEUSOITSI5JIXXU25RUYOZ2L3KIKBQWXSAJGY2CEXCBQ',
              Accept: 'text/plain',
            },
          }
        );

        const text = await response.text();
        const objects = text
          .split(/(?<=\})\s*(?=\{)/g)
          .map(str => str.trim())
          .filter(Boolean)
          .map(str => JSON.parse(str));

        if (objects.length === 0) return;

        const last = objects[objects.length - 1];
        const payload = last.result?.uplink_message?.decoded_payload;
        if (!payload) return;

        setTempExteriorValue(payload.temperature || 0);
        setHumedadValue(payload.humidity || 0);
        setVientoValue(payload.windspeed || 0);
        setLluviaValue(payload.LLuvia || 0);
      } catch (err) {
        console.error('❌ Error obteniendo datos de TTN:', err);
      }
    };

    const fetchMedialabValues = async () => {
      try {
        const co2Res = await fetch('https://www.medialab-uniovi.es/co2/ultimovalordelmedialabCO2.php');
        const co2Text = await co2Res.text();
        const co2 = parseInt(co2Text);
        if (!isNaN(co2)) setCo2Value(co2);

        const tempRes = await fetch('https://www.medialab-uniovi.es/co2/ultimovalordelmedialabT.php');
        const tempText = await tempRes.text();
        const temp = parseFloat(tempText);
        if (!isNaN(temp)) setTempInteriorValue(temp);
      } catch (err) {
        console.error('❌ Error obteniendo datos de Medialab:', err);
      }
    };

    fetchTTNData();
    fetchMedialabValues();

    const interval = setInterval(() => {
      fetchTTNData();
      fetchMedialabValues();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mqttReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#60A5FA" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.metricsGrid}>
          <MetricCard title="Temp. Interior" icon="home" value={`${tempInteriorValue}°C`} color="#60A5FA" />
          <MetricCard title="Temp. Exterior" icon="temperature-three-quarters" value={`${tempExteriorValue}°C`} color="#F87171" isFontAwesome />
          <MetricCard title="CO₂" icon="speed" value={`${co2Value} ppm`} color="#C084FC" />
          <MetricCard title="Viento" icon="wind" value={`${vientoValue} km/h`} color="#38BDF8" isFeather />
          <MetricCard title="Precipitaciones" icon="cloud" value={`${lluviaValue} mm`} color="#93C5FD" isFeather />
          <MetricCard title="Humedad" icon="droplet" value={`${humedadValue}%`} color="#5EEAD4" isFeather />
        </View>
      </View>

      <View style={styles.windowControlContainer}>
        <View style={styles.windowVisualization}>
          <View style={styles.windowFrame}>
            <Animated.View style={[styles.windowPane, windowStyle]} />
          </View>
          <View style={styles.windowPositionLabel}>
            <ThemedText style={styles.windowPositionText}>{windowPosition}%</ThemedText>
          </View>
        </View>

        <View style={styles.quickControlsContainer}>
          {[10, 25, 50, 75, 90].map((pos) => (
            <TouchableOpacity key={pos} style={styles.quickControlButton} onPress={() => handleQuickPosition(pos)}>
              <ThemedText style={styles.quickControlText}>{pos}%</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mainControlsContainer}>
          <ControlButton icon="vertical-align-top" text="Abrir" onPress={handleAbrir} style={styles.openButton} />
          <ControlButton icon="vertical-align-bottom" text="Cerrar" onPress={handleCerrar} style={styles.closeButton} />
          <ControlButton
            icon="auto-fix-high"
            text={autoMode ? 'Auto ON' : 'Auto OFF'}
            onPress={handleAutomatico}
            style={[styles.autoButton, autoMode && styles.autoButtonActive]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// MetricCard y ControlButton se quedan igual


function MetricCard({ title, icon, value, color, isFeather, isFontAwesome }) {
  const Icon = isFeather ? Feather : isFontAwesome ? FontAwesome6 : MaterialIcons;
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <ThemedText style={styles.metricTitle}>{title}</ThemedText>
        <Icon name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

function ControlButton({ icon, text, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.mainControlButton, style]} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color="#FFFFFF" />
      <ThemedText style={styles.mainControlText}>{text}</ThemedText>
    </TouchableOpacity>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  mainContent: {
    flex: 1, // Esto empuja el control de ventana hacia abajo
    paddingBottom: 20, // Espacio para que no toque el control de ventana
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 50, // Margen superior añadido
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E0E0',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Control de ventana - Fijado al fondo
  windowControlContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34, // Padding extra para dispositivos sin botón home
    borderTopWidth: 1,
    borderColor: '#333333',
    // Sombra para dar efecto de elevación
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  
  // Visualización de la ventana
  windowVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  windowFrame: {
    height: 40,
    width: '80%',
    borderWidth: 2,
    borderColor: '#60A5FA',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2D2D2D',
  },
  windowPane: {
    height: '100%',
    backgroundColor: '#60A5FA',
    position: 'absolute',
    left: 0,
    opacity: 0.7,
  },
  windowPositionLabel: {
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  windowPositionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60A5FA',
  },
  
  // Controles rápidos
  quickControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickControlButton: {
    backgroundColor: '#2D2D2D',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '18%',
    borderWidth: 1,
    borderColor: '#444444',
  },
  quickControlText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Botones principales
  mainControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '31%',
  },
  openButton: {
    backgroundColor: '#10B981', // Verde
  },
  closeButton: {
    backgroundColor: '#EF4444', // Rojo
  },
  autoButton: {
    backgroundColor: '#6366F1', // Índigo
  },
  autoButtonActive: {
    backgroundColor: '#8B5CF6', // Púrpura cuando está activo
  },
  mainControlText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});















