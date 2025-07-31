import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { client } from '@/services/mqttService';

export default function SettingsScreen() {
  const [isAutoModeEnabled, setIsAutoModeEnabled] = useState(false);
  const [isTimeScheduleEnabled, setIsTimeScheduleEnabled] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [temperatureWeight, setTemperatureWeight] = useState(50);
  const [co2Weight, setCo2Weight] = useState(30);
  const [energyWeight, setEnergyWeight] = useState(20);
  // ⏱️ Intervalo de evaluación (segundos)
  const [evaluationInterval, setEvaluationInterval] = useState(30);
  // ⌛ Retardo tras ejecutar acción (segundos)
  const [actionDelay, setActionDelay] = useState(5);

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${hours}:${minutesStr} ${ampm}`;
  };

  const onStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || startTime;
    setShowStartPicker(Platform.OS === 'ios');
    setStartTime(currentDate);
  };

  const onEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || endTime;
    setShowEndPicker(Platform.OS === 'ios');
    setEndTime(currentDate);
  };

  useEffect(() => {
    if (!client.connected) return;

    client.subscribe('casa/ventana/#');

    client.on('message', (topic: string, messageBuffer: Buffer) => {
      const msg = messageBuffer.toString();

      if (topic === 'casa/ventana/modo/estado') {
        setIsAutoModeEnabled(msg === 'auto');
      } else if (topic === 'casa/ventana/horario/enabled') {
        setIsTimeScheduleEnabled(msg === 'true');
      } else if (topic === 'casa/ventana/horario/inicio') {
        const [h, m] = msg.split(':');
        const date = new Date();
        date.setHours(Number(h), Number(m));
        setStartTime(date);
      } else if (topic === 'casa/ventana/horario/fin') {
        const [h, m] = msg.split(':');
        const date = new Date();
        date.setHours(Number(h), Number(m));
        setEndTime(date);
      } else if (topic === 'casa/ventana/peso/temperatura') {
        setTemperatureWeight(parseInt(msg));
      } else if (topic === 'casa/ventana/peso/co2') {
        setCo2Weight(parseInt(msg));
      } else if (topic === 'casa/ventana/peso/energia') {
        setEnergyWeight(parseInt(msg));
      } else if (topic === 'casa/ventana/intervalo/evaluacion') {
        setEvaluationInterval(parseInt(msg));
      } else if (topic === 'casa/ventana/retardo/postaccion') {
        setActionDelay(parseInt(msg));
      }
    });

    return () => {
      client.unsubscribe('casa/ventana/#');
    };
  }, [client.connected]);

  const handleSaveSettings = () => {
    const modo = isAutoModeEnabled ? 'auto' : 'manual';
    const horarioActivo = isTimeScheduleEnabled ? 'true' : 'false';
    const inicio = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const fin = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

    client.publish('casa/ventana/modo/estado', modo, { qos: 0, retain: true });
    client.publish('casa/ventana/horario/enabled', horarioActivo);
    client.publish('casa/ventana/horario/inicio', inicio);
    client.publish('casa/ventana/horario/fin', fin);
    client.publish('casa/ventana/peso/temperatura', temperatureWeight.toString());
    client.publish('casa/ventana/peso/co2', co2Weight.toString());
    client.publish('casa/ventana/peso/energia', energyWeight.toString());
    client.publish('casa/ventana/intervalo/evaluacion', evaluationInterval.toString());
    client.publish('casa/ventana/retardo/postaccion', actionDelay.toString());

    console.log('✅ Configuración publicada vía MQTT');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Margen superior añadido */}
        {/* <View style={styles.topMargin} /> */}
        
        {/* <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Ajustes</ThemedText>
        </View> */}

        {/* Sección de Modo Automático */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="autorenew" size={24} color="#60A5FA" />
            <ThemedText style={styles.sectionTitle}>Modo Automático</ThemedText>
          </View> 
          
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>Activar modo automático</ThemedText>
            <Switch
              trackColor={{ false: "#3F3F46", true: "#2563EB" }}
              thumbColor={isAutoModeEnabled ? "#60A5FA" : "#71717A"}
              ios_backgroundColor="#3F3F46"
              onValueChange={() => setIsAutoModeEnabled(previousState => !previousState)}
              value={isAutoModeEnabled}
            />
          </View>
          
          <ThemedText style={styles.settingDescription}>
            El modo automático ajustará la posición de la ventana según las condiciones ambientales y tus preferencias.
          </ThemedText>
        </View> */}

        {/* Sección de Programación Horaria */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color="#60A5FA" />
            <ThemedText style={styles.sectionTitle}>Programación Horaria</ThemedText>
          </View>
          
          {/* Botón de encendido/apagado para tramos horarios */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>Activar tramos horarios</ThemedText>
            <Switch
              trackColor={{ false: "#3F3F46", true: "#2563EB" }}
              thumbColor={isTimeScheduleEnabled ? "#60A5FA" : "#71717A"}
              ios_backgroundColor="#3F3F46"
              onValueChange={() => setIsTimeScheduleEnabled(previousState => !previousState)}
              value={isTimeScheduleEnabled}
            />
          </View>
          
          <ThemedText style={styles.settingDescription}>
            Define un tramo horario para la operación automática de la ventana.
          </ThemedText>
          
          {/* Contenido de tramos horarios (solo visible si está activado) */}
          {isTimeScheduleEnabled && (
            <View style={styles.timeScheduleContent}>
              <View style={styles.settingRow}>
                <ThemedText style={styles.settingLabel}>Hora de inicio</ThemedText>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <ThemedText style={styles.timeButtonText}>{formatTime(startTime)}</ThemedText>
                </TouchableOpacity>
              </View>
              
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={onStartTimeChange}
                  themeVariant={Platform.OS === 'android' ? 'dark' : undefined}
                  textColor="#FFFFFF" // Para iOS
                />
              )}
              
              <View style={styles.settingRow}>
                <ThemedText style={styles.settingLabel}>Hora de fin</ThemedText>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <ThemedText style={styles.timeButtonText}>{formatTime(endTime)}</ThemedText>
                </TouchableOpacity>
              </View>
              
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={onEndTimeChange}
                  themeVariant={Platform.OS === 'android' ? 'dark' : undefined}
                  textColor="#FFFFFF" // Para iOS
                />
              )}
            </View>
          )}
        </View>

        {/* Sección de Pesos del Algoritmo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="balance-scale" size={24} color="#60A5FA" />
            <ThemedText style={styles.sectionTitle}>Pesos del Algoritmo</ThemedText>
          </View>
          
          <ThemedText style={styles.settingDescription}>
            Ajusta la importancia de cada factor en el algoritmo de decisión automática.
          </ThemedText>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>Temperatura</ThemedText>
              <ThemedText style={styles.sliderValue}>{temperatureWeight}%</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={temperatureWeight}
              //onValueChange={setTemperatureWeight}
              //onValueChange={(val) => setTempDisplay(val)} // valor local para mostrar
              onSlidingComplete={setTemperatureWeight} // solo al soltar el dedo
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#4B5563"
              thumbTintColor="#60A5FA"
            />
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>CO2</ThemedText>
              <ThemedText style={styles.sliderValue}>{co2Weight}%</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={co2Weight}
              //onValueChange={setCo2Weight}
              //onValueChange={(val) => setTempDisplay(val)} // valor local para mostrar
              onSlidingComplete={setCo2Weight} // solo al soltar el dedo
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#4B5563"
              thumbTintColor="#60A5FA"
            />
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>Consumo Energético</ThemedText>
              <ThemedText style={styles.sliderValue}>{energyWeight}%</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={energyWeight}
              //onValueChange={setEnergyWeight}
              //onValueChange={(val) => setTempDisplay(val)} // valor local para mostrar
              onSlidingComplete={setEnergyWeight} // solo al soltar el dedo
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#4B5563"
              thumbTintColor="#60A5FA"
            />
          </View>
        </View>

        {/* Sección de Tiempos de Control */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={24} color="#60A5FA" />
            <ThemedText style={styles.sectionTitle}>Tiempos de Control</ThemedText>
          </View>

          <ThemedText style={styles.settingDescription}>
            Define la frecuencia de evaluación y el retardo tras cada acción.
          </ThemedText>

          {/* Intervalo de evaluación */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>Intervalo de evaluación</ThemedText>
              <ThemedText style={styles.sliderValue}>{evaluationInterval}s</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={300}
              step={5}
              value={evaluationInterval}
              onSlidingComplete={setEvaluationInterval}
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#4B5563"
              thumbTintColor="#60A5FA"
            />
          </View>

          {/* Retardo postacción */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <ThemedText style={styles.sliderLabel}>Retardo postacción</ThemedText>
              <ThemedText style={styles.sliderValue}>{actionDelay}s</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={60}
              step={1}
              value={actionDelay}
              onSlidingComplete={setActionDelay}
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#4B5563"
              thumbTintColor="#60A5FA"
            />
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveSettings}>
            <ThemedText style={styles.saveButtonText}>Guardar Cambios</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212', // Fondo principal muy oscuro
  },
  topMargin: {
    height: 30, // Margen superior añadido
  },
  header: {
    padding: 16,
    backgroundColor: '#1E1E1E', // Cabecera ligeramente más clara que el fondo
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D', // Borde sutil
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF', // Texto blanco para el título
  },
  section: {
    backgroundColor: '#1E1E1E', // Secciones ligeramente más claras que el fondo
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2D2D2D', // Borde sutil
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF', // Texto blanco para títulos de sección
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#E5E5E5', // Texto ligeramente menos brillante que el blanco puro
  },
  settingDescription: {
    fontSize: 14,
    color: '#9CA3AF', // Gris medio para texto descriptivo
    marginTop: 8,
    marginBottom: 16,
  },
  timeScheduleContent: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    paddingTop: 16,
    marginTop: 8,
  },
  timeButton: {
    backgroundColor: '#2D2D2D', // Fondo de botón más oscuro
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46', // Borde sutil
  },
  timeButtonText: {
    fontSize: 16,
    color: '#60A5FA', // Azul más suave para el modo oscuro
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#E5E5E5', // Texto ligeramente menos brillante que el blanco puro
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA', // Azul más suave para el modo oscuro
  },
  slider: {
    width: '100%',
    height: 40,
  },
  buttonsContainer: {
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2563EB', // Azul más oscuro para el botón de guardar
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});